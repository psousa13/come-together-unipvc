const express = require('express');
const Community = require('../models/Community');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { isAdmin, canManageCommunity } = require('../permissions');

const router = express.Router();
router.use(requireAuth);

const ID_RE = /^[a-f\d]{24}$/i;

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Já existe uma comunidade com este nome.' });
    }
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first ? first.message : 'Dados inválidos.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  });

const bad = (res, error) => res.status(400).json({ error });
const notFound = (res, error = 'Comunidade não encontrada.') => res.status(404).json({ error });
const forbidden = (res, error = 'Só os administradores da comunidade podem fazer isto.') =>
  res.status(403).json({ error });

const has = (list, id) => list.some((x) => String(x) === String(id));
const cleanName = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function toJson(c, me) {
  return {
    id: String(c._id),
    name: c.name,
    description: c.description,
    isPrivate: c.isPrivate,
    membersCount: c.members.length,
    isMember: has(c.members, me._id),
    isAdmin: has(c.admins, me._id),
    hasRequested: has(c.requests, me._id),
    createdAt: c.createdAt,
  };
}

async function load(req, res) {
  if (!ID_RE.test(req.params.id)) {
    notFound(res);
    return null;
  }
  const c = await Community.findById(req.params.id).lean();
  if (!c) notFound(res);
  return c;
}

async function reply(res, id, me) {
  const c = await Community.findById(id).lean();
  res.json({ community: toJson(c, me) });
}

function needMember(me, res) {
  if (isAdmin(me)) {
    res.status(403).json({ error: 'O administrador não pode participar em comunidades.' });
    return false;
  }
  if (!me.username) {
    res.status(403).json({ error: 'Conclui o registo primeiro.' });
    return false;
  }
  return true;
}

async function people(ids, admins) {
  const list = await User.find({ _id: { $in: ids } })
    .select('username displayName avatar')
    .lean();
  return list
    .filter((p) => p.username)
    .map((p) => ({
      username: p.username,
      displayName: p.displayName || '',
      avatar: p.avatar,
      isAdmin: has(admins, p._id),
    }))
    .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin));
}

router.get(
  '/',
  wrap(async (req, res) => {
    const me = req.user;
    const and = [];
    if (req.query.q !== undefined) {
      const text = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (text.length < 2) return bad(res, 'A pesquisa precisa de pelo menos 2 caracteres.');
      and.push({ name: new RegExp(escapeRe(text), 'i') });
    }
    if (req.query.mine === '1') and.push({ members: me._id });
    const list = await Community.find(and.length ? { $and: and } : {})
      .sort({ nameKey: 1 })
      .limit(100)
      .lean();
    res.json({ communities: list.map((c) => toJson(c, me)) });
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const me = req.user;
    if (!needMember(me, res)) return;
    const b = req.body || {};
    const name = cleanName(b.name);
    if (name.length < 3 || name.length > 40) return bad(res, 'O nome deve ter entre 3 e 40 caracteres.');
    const description = typeof b.description === 'string' ? b.description.trim() : '';
    if (description.length > 80) return bad(res, 'A descrição pode ter no máximo 80 caracteres.');
    const nameKey = name.toLowerCase();
    if (await Community.exists({ nameKey })) {
      return res.status(409).json({ error: 'Já existe uma comunidade com este nome.' });
    }
    const c = await Community.create({
      name,
      nameKey,
      description,
      isPrivate: b.isPrivate === true,
      createdBy: me._id,
      admins: [me._id],
      members: [me._id],
    });
    res.status(201).json({ community: toJson(c, me) });
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    const me = req.user;
    const c = await load(req, res);
    if (!c) return;
    const manage = canManageCommunity(me, c);
    const canSee = !c.isPrivate || has(c.members, me._id) || manage;
    const members = canSee ? await people(c.members.slice(0, 50), c.admins) : [];
    const requests = manage ? await people(c.requests.slice(0, 50), c.admins) : [];
    res.json({ community: { ...toJson(c, me), canManage: manage, members, requests } });
  })
);
router.patch(
  '/:id',
  wrap(async (req, res) => {
    const me = req.user;
    const c = await load(req, res);
    if (!c) return;
    if (!canManageCommunity(me, c)) return forbidden(res);
    const b = req.body || {};
    const set = {};
    if (b.name !== undefined) {
      const name = cleanName(b.name);
      if (name.length < 3 || name.length > 40) return bad(res, 'O nome deve ter entre 3 e 40 caracteres.');
      const nameKey = name.toLowerCase();
      if (nameKey !== c.nameKey && (await Community.exists({ nameKey, _id: { $ne: c._id } }))) {
        return res.status(409).json({ error: 'Já existe uma comunidade com este nome.' });
      }
      set.name = name;
      set.nameKey = nameKey;
    }
    if (b.description !== undefined) {
      if (typeof b.description !== 'string') return bad(res, 'Descrição inválida.');
      const description = b.description.trim();
      if (description.length > 80) return bad(res, 'A descrição pode ter no máximo 80 caracteres.');
      set.description = description;
    }
    if (b.isPrivate !== undefined) {
      if (typeof b.isPrivate !== 'boolean') return bad(res, 'Privacidade inválida.');
      set.isPrivate = b.isPrivate;
    }
    const update = { $set: set };
    if (set.isPrivate === false && c.requests.length) {
      update.$addToSet = { members: { $each: c.requests } };
      set.requests = [];
    }
    await Community.updateOne({ _id: c._id }, update);
    await reply(res, c._id, me);
  })
);

router.post(
  '/:id/join',
  wrap(async (req, res) => {
    const me = req.user;
    if (!needMember(me, res)) return;
    const c = await load(req, res);
    if (!c) return;
    if (!has(c.members, me._id)) {
      const update = c.isPrivate
        ? { $addToSet: { requests: me._id } }
        : { $addToSet: { members: me._id }, $pull: { requests: me._id } };
      await Community.updateOne({ _id: c._id }, update);
    }
    await reply(res, c._id, me);
  })
);

router.delete(
  '/:id/join',
  wrap(async (req, res) => {
    const me = req.user;
    const c = await load(req, res);
    if (!c) return;
    if (has(c.admins, me._id) && c.admins.length === 1) {
      return bad(res, 'És o único administrador. Promove outro membro antes de sair.');
    }
    await Community.updateOne(
      { _id: c._id },
      { $pull: { members: me._id, admins: me._id, requests: me._id } }
    );
    await reply(res, c._id, me);
  })
);

async function manageTarget(req, res) {
  const c = await load(req, res);
  if (!c) return {};
  if (!canManageCommunity(req.user, c)) {
    forbidden(res);
    return {};
  }
  const username = String(req.params.username || '').toLowerCase();
  const u = await User.findOne({ username }).select('_id').lean();
  if (!u) {
    notFound(res, 'Utilizador não encontrado.');
    return {};
  }
  return { c, u };
}

router.post(
  '/:id/requests/:username',
  wrap(async (req, res) => {
    const { c, u } = await manageTarget(req, res);
    if (!c || !u) return;
    if (!has(c.requests, u._id)) return notFound(res, 'Pedido não encontrado.');
    await Community.updateOne(
      { _id: c._id },
      { $pull: { requests: u._id }, $addToSet: { members: u._id } }
    );
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/requests/:username',
  wrap(async (req, res) => {
    const { c, u } = await manageTarget(req, res);
    if (!c || !u) return;
    if (!has(c.requests, u._id)) return notFound(res, 'Pedido não encontrado.');
    await Community.updateOne({ _id: c._id }, { $pull: { requests: u._id } });
    res.json({ ok: true });
  })
);

router.post(
  '/:id/admins/:username',
  wrap(async (req, res) => {
    const { c, u } = await manageTarget(req, res);
    if (!c || !u) return;
    if (!has(c.members, u._id)) return bad(res, 'Só membros podem ser administradores.');
    await Community.updateOne({ _id: c._id }, { $addToSet: { admins: u._id } });
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/admins/:username',
  wrap(async (req, res) => {
    const { c, u } = await manageTarget(req, res);
    if (!c || !u) return;
    if (!has(c.admins, u._id)) return notFound(res, 'Este utilizador não é administrador.');
    if (c.admins.length === 1) return bad(res, 'Tem de haver pelo menos um administrador.');
    await Community.updateOne({ _id: c._id }, { $pull: { admins: u._id } });
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/members/:username',
  wrap(async (req, res) => {
    const { c, u } = await manageTarget(req, res);
    if (!c || !u) return;
    if (!has(c.members, u._id)) return notFound(res, 'Este utilizador não é membro.');
    if (String(u._id) === String(req.user._id)) return bad(res, 'Para saíres, usa a opção de sair.');
    if (has(c.admins, u._id)) return bad(res, 'Retira primeiro o papel de administrador.');
    await Community.updateOne({ _id: c._id }, { $pull: { members: u._id } });
    res.json({ ok: true });
  })
);

module.exports = router;
