const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('../serializers');
const { SCHOOLS, MEMBER_TYPES } = require('../constants');

const router = express.Router();
router.use(requireAuth);

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const RESERVED = new Set(['me', 'admin', 'api', 'null', 'undefined']);
const MAX_AVATAR = 150000;
const MINI_FIELDS = 'username displayName avatar school';

const normalize = (value) => String(value ?? '').trim().toLowerCase();

const mini = (u) => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  avatar: u.avatar,
  school: u.school,
});

const validUsername = (value) => USERNAME_RE.test(value) && !RESERVED.has(value);

const usernameTaken = async (username, selfId) =>
  Boolean(await User.exists({ username, _id: { $ne: selfId } }));

const requireOnboarded = (req, res, next) => {
  if (!req.user.username) {
    return res.status(403).json({ error: 'Completa primeiro o teu perfil.' });
  }
  next();
};

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 30);
  if (q.length < 2) return res.json({ users: [] });
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find({
    username: { $exists: true },
    $or: [{ username: rx }, { displayName: rx }],
  })
    .limit(20)
    .select(MINI_FIELDS);
  res.json({ users: users.map(mini) });
});

router.get('/username-available', async (req, res) => {
  const username = normalize(req.query.username);
  if (!validUsername(username)) return res.json({ available: false });
  res.json({ available: !(await usernameTaken(username, req.user._id)) });
});

router.patch('/me', async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'A conta de administração não tem perfil.' });
  }

  const { displayName, username, school, memberType, course, bio, avatar, notificationPrefs } = req.body;

  if (displayName !== undefined) {
    const value = String(displayName).trim();
    if (value.length < 1 || value.length > 50) {
      return res.status(400).json({ error: 'O nome deve ter entre 1 e 50 caracteres.' });
    }
    user.displayName = value;
  }

  if (username !== undefined) {
    const value = normalize(username);
    if (!validUsername(value)) {
      return res.status(400).json({
        error: 'O username deve ter 3 a 20 caracteres: letras minúsculas, números, _ ou .',
      });
    }
    if (value !== user.username && (await usernameTaken(value, user._id))) {
      return res.status(409).json({ error: 'Este username já está em uso.' });
    }
    user.username = value;
  }

  if (school !== undefined) {
    if (school !== '' && !SCHOOLS.includes(school)) {
      return res.status(400).json({ error: 'Escola inválida.' });
    }
    user.school = school || undefined;
  }

  if (memberType !== undefined) {
    if (memberType !== '' && !MEMBER_TYPES.includes(memberType)) {
      return res.status(400).json({ error: 'Tipo de membro inválido.' });
    }
    user.memberType = memberType || undefined;
  }

  if (course !== undefined) {
    const value = String(course).trim();
    if (value.length > 80) {
      return res.status(400).json({ error: 'O curso pode ter no máximo 80 caracteres.' });
    }
    user.course = value || undefined;
  }

  if (bio !== undefined) {
    const value = String(bio).trim();
    if (value.length > 160) {
      return res.status(400).json({ error: 'A bio pode ter no máximo 160 caracteres.' });
    }
    user.bio = value;
  }

  if (notificationPrefs !== undefined) {
    const ok =
      notificationPrefs &&
      typeof notificationPrefs === 'object' &&
      !Array.isArray(notificationPrefs) &&
      Object.entries(notificationPrefs).every(
        ([k, v]) => ['going', 'reminders'].includes(k) && typeof v === 'boolean'
      );
    if (!ok) {
      return res.status(400).json({ error: 'Preferências de notificações inválidas.' });
    }
    for (const [k, v] of Object.entries(notificationPrefs)) {
      user.notificationPrefs[k] = v;
    }
  }

  if (avatar !== undefined) {
    if (!avatar) {
      user.avatar = undefined;
    } else if (
      typeof avatar !== 'string' ||
      avatar.length > MAX_AVATAR ||
      !AVATAR_RE.test(avatar)
    ) {
      return res.status(400).json({ error: 'Imagem inválida ou demasiado grande.' });
    } else {
      user.avatar = avatar;
    }
  }

  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Este username já está em uso.' });
    }
    throw err;
  }

  res.json({ user: publicUser(user) });
});

router.get('/:username', async (req, res) => {
  const target = await User.findOne({ username: normalize(req.params.username) });
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });

  const followersCount = await User.countDocuments({ following: target._id });

  res.json({
    user: {
      ...mini(target),
      memberType: target.memberType,
      course: target.course,
      bio: target.bio || '',
      createdAt: target.createdAt,
      followersCount,
      followingCount: target.following.length,
      isMe: target.id === req.user.id,
      isFollowing: req.user.following.some((id) => id.equals(target._id)),
    },
  });
});

router.post('/:username/follow', requireOnboarded, async (req, res) => {
  const target = await User.findOne({ username: normalize(req.params.username) });
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  if (target.id === req.user.id) {
    return res.status(400).json({ error: 'Não podes seguir-te a ti próprio.' });
  }
  await User.updateOne({ _id: req.user._id }, { $addToSet: { following: target._id } });
  const followersCount = await User.countDocuments({ following: target._id });
  res.json({ following: true, followersCount });
});

router.delete('/:username/follow', requireOnboarded, async (req, res) => {
  const target = await User.findOne({ username: normalize(req.params.username) });
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  await User.updateOne({ _id: req.user._id }, { $pull: { following: target._id } });
  const followersCount = await User.countDocuments({ following: target._id });
  res.json({ following: false, followersCount });
});

router.get('/:username/followers', async (req, res) => {
  const target = await User.findOne({ username: normalize(req.params.username) });
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const users = await User.find({ following: target._id }).limit(100).select(MINI_FIELDS);
  res.json({ users: users.map(mini) });
});

router.get('/:username/following', async (req, res) => {
  const target = await User.findOne({ username: normalize(req.params.username) });
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const users = await User.find({ _id: { $in: target.following } })
    .limit(100)
    .select(MINI_FIELDS);
  res.json({ users: users.map(mini) });
});

module.exports = router;