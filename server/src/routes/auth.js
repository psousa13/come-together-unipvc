const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginCode = require('../models/LoginCode');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const normalize = (value) => String(value || '').trim().toLowerCase();

const hashCode = (email, code) =>
  crypto
    .createHash('sha256')
    .update(`${email}:${code}:${process.env.JWT_SECRET}`)
    .digest('hex');

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  username: u.username,
  displayName: u.displayName,
  avatar: u.avatar,
  school: u.school,
  role: u.role,
});

function isAllowedEmail(email) {
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || 'ipvc.pt')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const match = /^[^\s@]+@([^\s@]+)$/.exec(email);
  if (!match) return false;
  const domain = match[1];
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}

// Step 1: ask for a code. Typing "admin" switches the client to the password field.
router.post('/request-code', async (req, res) => {
  const email = normalize(req.body.email);
  if (email === 'admin') return res.json({ requiresPassword: true });

  if (!isAllowedEmail(email)) {
    return res.status(400).json({ error: 'Usa o teu email institucional da UniPVC.' });
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await LoginCode.findOneAndUpdate(
    { email },
    {
      codeHash: hashCode(email, code),
      attempts: 0,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
    { upsert: true }
  );

  // TODO: send the code by email (Resend or Nodemailer). For now: dev console only.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Login code for ${email}: ${code}`);
  }

  res.json({ ok: true });
});

// Step 2: verify the code, create the user on first login, return a token.
router.post('/verify-code', async (req, res) => {
  const email = normalize(req.body.email);
  const code = String(req.body.code || '').trim();
  const invalid = { error: 'Código inválido ou expirado.' };

  const entry = await LoginCode.findOne({ email });
  if (!entry || entry.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json(invalid);
  }

  if (entry.codeHash !== hashCode(email, code)) {
    entry.attempts += 1;
    await entry.save();
    return res.status(400).json(invalid);
  }

  await entry.deleteOne();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, displayName: email.split('@')[0] });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

// Single app-admin account, password only.
router.post('/admin-login', async (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  const given = String(req.body.password || '');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected || '').digest();

  if (!expected || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  let user = await User.findOne({ email: 'admin' });
  if (!user) {
    user = await User.create({ email: 'admin', displayName: 'Administração', role: 'admin' });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
