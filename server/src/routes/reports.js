const express = require('express');
const Report = require('../models/Report');
const Event = require('../models/Event');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const ID_RE = /^[a-f\d]{24}$/i;
const REASONS = Report.schema.path('reason').enumValues;

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  });

const bad = (res, error) => res.status(400).json({ error });

function toJson(r) {
  return {
    id: String(r._id),
    targetType: r.targetType,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.createdAt,
    reporter: r.reporter
      ? { username: r.reporter.username || null, displayName: r.reporter.displayName || '' }
      : null,
    event: r.event
      ? { id: String(r.event._id), title: r.event.title, cancelled: !!r.event.cancelled }
      : null,
    user: r.targetUser
      ? { username: r.targetUser.username || null, displayName: r.targetUser.displayName || '' }
      : null,
  };
}

router.post(
  '/',
  wrap(async (req, res) => {
    const me = req.user;
    if (me.role === 'admin') {
      return res.status(403).json({ error: 'O administrador não pode denunciar.' });
    }
    if (!me.username) {
      return res.status(403).json({ error: 'Conclui o registo antes de denunciar.' });
    }
    const b = req.body || {};
    if (!['event', 'user'].includes(b.targetType)) return bad(res, 'Tipo de denúncia inválido.');
    if (!REASONS.includes(b.reason)) return bad(res, 'Motivo inválido.');
    const details = typeof b.details === 'string' ? b.details.trim() : '';
    if (details.length > 300) return bad(res, 'O texto pode ter no máximo 300 caracteres.');
    const targetId = typeof b.targetId === 'string' ? b.targetId.trim() : '';

    let target;
    if (b.targetType === 'event') {
      if (!ID_RE.test(targetId)) return res.status(404).json({ error: 'Evento não encontrado.' });
      const e = await Event.findOne({
        $and: [
          { _id: targetId },
          { $or: [{ isPrivate: false }, { organizer: me._id }, { attendees: me._id }] },
        ],
      })
        .select('organizer')
        .lean();
      if (!e) return res.status(404).json({ error: 'Evento não encontrado.' });
      if (String(e.organizer) === String(me._id)) return bad(res, 'Não podes denunciar um evento teu.');
      target = { event: e._id };
    } else {
      const u = await User.findOne({ username: targetId.toLowerCase() }).select('_id').lean();
      if (!u) return res.status(404).json({ error: 'Utilizador não encontrado.' });
      if (String(u._id) === String(me._id)) return bad(res, 'Não podes denunciar-te a ti próprio.');
      target = { targetUser: u._id };
    }

    const dup = await Report.exists({ reporter: me._id, status: 'open', ...target });
    if (dup) {
      return res.status(409).json({ error: 'Já denunciaste isto. A denúncia está em análise.' });
    }

    await Report.create({
      reporter: me._id,
      targetType: b.targetType,
      reason: b.reason,
      details,
      ...target,
    });
    res.status(201).json({ ok: true });
  })
);

router.get(
  '/',
  requireAdmin,
  wrap(async (req, res) => {
    const reports = await Report.find({ status: 'open' })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('reporter', 'username displayName')
      .populate('event', 'title cancelled')
      .populate('targetUser', 'username displayName')
      .lean();
    res.json({ reports: reports.map(toJson) });
  })
);

router.patch(
  '/:id',
  requireAdmin,
  wrap(async (req, res) => {
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Denúncia não encontrada.' });
    const status = req.body && req.body.status;
    if (!['resolved', 'dismissed'].includes(status)) return bad(res, 'Estado inválido.');
    const r = await Report.findOneAndUpdate(
      { _id: req.params.id, status: 'open' },
      { status, handledBy: req.user._id, handledAt: new Date() }
    );
    if (!r) return res.status(404).json({ error: 'Denúncia não encontrada ou já tratada.' });
    res.json({ ok: true, status });
  })
);

module.exports = router;