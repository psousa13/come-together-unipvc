const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const LoginCode = require('../models/LoginCode');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('../serializers');

const router = express.Router();
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const makeLimiter = (limit, message, extra = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
    ...extra,
  });

const requestCodeLimiter = makeLimiter(
  5,
  'Demasiados pedidos de código. Tenta de novo dentro de 15 minutos.'
);
const verifyLimiter = makeLimiter(
  20,
  'Demasiadas tentativas. Tenta de novo dentro de 15 minutos.',
  { skipSuccessfulRequests: true }
);

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

async function sendLoginCode(email, code) {
  const minutes = CODE_TTL_MS / 60000;
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Come Together UNIPVC', email: process.env.MAIL_FROM },
      to: [{ email }],
      subject: `O teu código: ${code}`,
      htmlContent:
        `<p>O teu código de acesso ao Come Together é:</p>` +
        `<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>` +
        `<p>Expira em ${minutes} minutos. Se não pediste este código, ignora este email.</p>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Brevo ${response.status}: ${detail}`);
  }
}

router.post('/request-code', requestCodeLimiter, async (req, res) => {
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

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Login code for ${email}: ${code}`);
  }

  const mailConfigured = process.env.BREVO_API_KEY && process.env.MAIL_FROM;

  if (mailConfigured) {
    try {
      await sendLoginCode(email, code);
    } catch (err) {
      console.error('[MAIL] Falha ao enviar código:', err.message);
      return res.status(502).json({ error: 'Não foi possível enviar o email. Tenta de novo.' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[MAIL] BREVO_API_KEY ou MAIL_FROM em falta.');
    return res.status(500).json({ error: 'Envio de email não configurado.' });
  }

  res.json({ ok: true });
});

router.post('/verify-code', verifyLimiter, async (req, res) => {
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

router.post('/admin-login', verifyLimiter, async (req, res) => {
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