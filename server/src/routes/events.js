const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { SCHOOLS } = require('../constants');
const { notifyGoing } = require('../notify');
const { canManageEvent } = require('../permissions');

const router = express.Router();
router.use(requireAuth);

const ID_RE = /^[a-f\d]{24}$/i;
const URL_RE = /^https?:\/\/\S+$/i;
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/]+={0,2}$/i;
const PHOTO_MAX = 400000;
const THUMB_MAX = 60000;
const PHOTOS_LIMIT = 5;

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0];
      return res.status(400).json({ error: first ? first.message : 'Dados inválidos.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro interno.' });
  });

const bad = (res, error) => res.status(400).json({ error });

const isImage = (value, max) => typeof value === 'string' && value.length <= max && IMAGE_RE.test(value);

const photosJson = (e) => ({
  photos: (e.photos || []).map((p) => ({ id: String(p._id), src: p.data })),
  coverPhoto: e.coverPhoto ? String(e.coverPhoto) : null,
});

function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function visibleTo(me) {
  return { $or: [{ isPrivate: false }, { organizer: me._id }, { attendees: me._id }] };
}

function toJson(e, me) {
  const org = e.organizer && e.organizer._id ? e.organizer : null;
  const meId = String(me._id);
  return {
    id: String(e._id),
    title: e.title,
    description: e.description,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    school: e.school,
    location: {
      name: (e.location && e.location.name) || '',
      lat: e.location && e.location.lat != null ? e.location.lat : null,
      lng: e.location && e.location.lng != null ? e.location.lng : null,
    },
    ticketUrl: e.ticketUrl,
    thumb: (e.coverPhoto && e.thumb) || '',
    origin: e.origin,
    isPrivate: e.isPrivate,
    cancelled: e.cancelled,
    ended: e.endsAt < new Date(),
    organizer: org
      ? { username: org.username || null, displayName: org.displayName || '', avatar: org.avatar }
      : null,
    isMine: org ? String(org._id) === meId : false,
    attendeesCount: e.attendees.length,
    isGoing: e.attendees.some((a) => String(a) === meId),
    createdAt: e.createdAt,
  };
}

router.get(
  '/',
  wrap(async (req, res) => {
    const me = req.user;
    const { school, from, to, q, origin } = req.query;
    const past = req.query.past === '1';
    const now = new Date();
    const and = [visibleTo(me), { cancelled: false }];

    if (school !== undefined) {
      if (!SCHOOLS.includes(school)) return bad(res, 'Escola inválida.');
      and.push({ school });
    }
    if (origin !== undefined) {
      if (!['official', 'member'].includes(origin)) return bad(res, 'Origem inválida.');
      and.push({ origin });
    }
    if (from !== undefined) {
      const d = parseDate(from);
      if (!d) return bad(res, 'Data "from" inválida.');
      and.push({ startsAt: { $gte: d } });
    }
    if (to !== undefined) {
      const d = parseDate(to);
      if (!d) return bad(res, 'Data "to" inválida.');
      and.push({ startsAt: { $lte: d } });
    }
    if (past) and.push({ endsAt: { $lt: now } });
    else if (from === undefined) and.push({ endsAt: { $gte: now } });

    if (q !== undefined) {
      const text = typeof q === 'string' ? q.trim() : '';
      if (text.length < 2) return bad(res, 'A pesquisa precisa de pelo menos 2 caracteres.');
      and.push({ title: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
    }
    if (req.query.going === '1') and.push({ attendees: me._id });
    if (req.query.mine === '1') and.push({ organizer: me._id });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const events = await Event.find({ $and: and })
      .sort({ startsAt: past ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('organizer', 'username displayName')
      .lean();

    res.json({ events: events.map((e) => toJson(e, me)) });
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const me = req.user;
    const isAdmin = me.role === 'admin';
    if (!isAdmin && !me.username) {
      return res.status(403).json({ error: 'Conclui o registo antes de criar eventos.' });
    }
    const b = req.body || {};

    const title = typeof b.title === 'string' ? b.title.trim() : '';
    if (title.length < 3 || title.length > 100) {
      return bad(res, 'O título deve ter entre 3 e 100 caracteres.');
    }
    const description = typeof b.description === 'string' ? b.description.trim() : '';
    if (description.length > 2000) return bad(res, 'A descrição pode ter no máximo 2000 caracteres.');

    const startsAt = parseDate(b.startsAt);
    const endsAt = parseDate(b.endsAt);
    if (!startsAt || !endsAt) return bad(res, 'Datas inválidas.');
    if (endsAt <= startsAt) return bad(res, 'O fim do evento tem de ser depois do início.');

    const school = b.school || me.school;
    if (!SCHOOLS.includes(school)) return bad(res, 'Escola inválida.');

    if (b.origin !== undefined && !['official', 'member'].includes(b.origin)) {
      return bad(res, 'Origem inválida.');
    }
    if (b.origin === 'official' && !isAdmin) {
      return res.status(403).json({ error: 'Só a UniPVC pode criar eventos oficiais.' });
    }
    if (b.isPrivate || b.community) {
      return bad(res, 'Eventos privados e de comunidades ainda não estão disponíveis.');
    }

    const loc = b.location || {};
    const name = typeof loc.name === 'string' ? loc.name.trim() : '';
    if (name.length > 120) return bad(res, 'O nome do local pode ter no máximo 120 caracteres.');
    const location = { name };
    const hasLat = loc.lat !== undefined && loc.lat !== null;
    const hasLng = loc.lng !== undefined && loc.lng !== null;
    if (hasLat !== hasLng) return bad(res, 'Indica latitude e longitude em conjunto.');
    if (hasLat) {
      if (
        typeof loc.lat !== 'number' ||
        typeof loc.lng !== 'number' ||
        !Number.isFinite(loc.lat) ||
        !Number.isFinite(loc.lng) ||
        Math.abs(loc.lat) > 90 ||
        Math.abs(loc.lng) > 180
      ) {
        return bad(res, 'Coordenadas inválidas.');
      }
      location.lat = loc.lat;
      location.lng = loc.lng;
    }

    const ticketUrl = typeof b.ticketUrl === 'string' ? b.ticketUrl.trim() : '';
    if (ticketUrl && (ticketUrl.length > 300 || !URL_RE.test(ticketUrl))) {
      return bad(res, 'Ligação de bilhetes inválida.');
    }

    const created = await Event.create({
      title,
      description,
      startsAt,
      endsAt,
      organizer: me._id,
      school,
      origin: b.origin === 'official' ? 'official' : 'member',
      location,
      ticketUrl,
    });
    const event = await Event.findById(created._id)
      .populate('organizer', 'username displayName avatar')
      .lean();
    res.status(201).json({ event: { ...toJson(event, me), photos: [], coverPhoto: null } });
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    const me = req.user;
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Evento não encontrado.' });
    const e = await Event.findOne({ $and: [{ _id: req.params.id }, visibleTo(me)] })
      .select('+photos')
      .populate('organizer', 'username displayName avatar')
      .lean();
    if (!e) return res.status(404).json({ error: 'Evento não encontrado.' });

    const people = await User.find({ _id: { $in: e.attendees.slice(0, 20) } })
      .select('username displayName')
      .lean();
    const attendeesPreview = people
      .filter((p) => p.username)
      .map((p) => ({ username: p.username, displayName: p.displayName || '' }));

    res.json({ event: { ...toJson(e, me), ...photosJson(e), attendeesPreview } });
  })
);

async function setGoing(req, res, add) {
  const me = req.user;
  if (!me.username) {
    return res.status(403).json({ error: 'Conclui o registo antes de marcar «Eu vou».' });
  }
  if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Evento não encontrado.' });
  const e = await Event.findOne({ $and: [{ _id: req.params.id }, visibleTo(me)] })
    .select('cancelled endsAt title organizer')
    .lean();
  if (!e) return res.status(404).json({ error: 'Evento não encontrado.' });
  if (add && e.cancelled) return bad(res, 'Este evento foi cancelado.');
  if (add && e.endsAt < new Date()) return bad(res, 'Este evento já terminou.');

  const update = add ? { $addToSet: { attendees: me._id } } : { $pull: { attendees: me._id } };
  const result = await Event.updateOne({ _id: e._id }, update, { timestamps: false });
  const updated = await Event.findById(e._id).select('attendees').lean();
  if (add && result.modifiedCount === 1 && String(e.organizer) !== String(me._id)) {
    await notifyGoing({ organizerId: e.organizer, actor: me, event: e });
  }
  res.json({ going: add, attendeesCount: updated.attendees.length });
}

router.post('/:id/going', wrap((req, res) => setGoing(req, res, true)));
router.delete('/:id/going', wrap((req, res) => setGoing(req, res, false)));

router.post(
  '/:id/cancel',
  wrap(async (req, res) => {
    const me = req.user;
    if (!ID_RE.test(req.params.id)) return res.status(404).json({ error: 'Evento não encontrado.' });
    const e = await Event.findOne({ $and: [{ _id: req.params.id }, visibleTo(me)] })
      .select('organizer')
      .lean();
    if (!e) return res.status(404).json({ error: 'Evento não encontrado.' });
    const allowed = canManageEvent(me, e);
    if (!allowed) {
      return res.status(403).json({ error: 'Só o organizador pode cancelar o evento.' });
    }
    await Event.updateOne({ _id: e._id }, { cancelled: true });
    res.json({ cancelled: true });
  })
);

async function findManaged(req, res) {
  const me = req.user;
  if (!ID_RE.test(req.params.id)) {
    res.status(404).json({ error: 'Evento não encontrado.' });
    return null;
  }
  const e = await Event.findOne({ $and: [{ _id: req.params.id }, visibleTo(me)] })
    .select('organizer')
    .lean();
  if (!e) {
    res.status(404).json({ error: 'Evento não encontrado.' });
    return null;
  }
  if (!canManageEvent(me, e)) {
    res.status(403).json({ error: 'Só o organizador pode gerir as fotos.' });
    return null;
  }
  return e;
}

const loadPhotos = (id) => Event.findById(id).select('+photos').lean();

async function findPhoto(req, res) {
  const managed = await findManaged(req, res);
  if (!managed) return null;
  const event = await loadPhotos(managed._id);
  const photo = (event.photos || []).find((p) => String(p._id) === req.params.photoId);
  if (!photo) {
    res.status(404).json({ error: 'Foto não encontrada.' });
    return null;
  }
  return { event, photo };
}

router.post(
  '/:id/photos',
  wrap(async (req, res) => {
    const e = await findManaged(req, res);
    if (!e) return;
    const { data, thumb } = req.body || {};
    if (!isImage(data, PHOTO_MAX) || !isImage(thumb, THUMB_MAX)) {
      return bad(res, 'Foto inválida ou demasiado grande.');
    }
    const added = await Event.findOneAndUpdate(
      { _id: e._id, [`photos.${PHOTOS_LIMIT - 1}`]: { $exists: false } },
      { $push: { photos: { data, thumb } } },
      { returnDocument: 'after', projection: { photos: 1 } }
    ).lean();
    if (!added) return bad(res, `Cada evento pode ter no máximo ${PHOTOS_LIMIT} fotos.`);
    const last = added.photos[added.photos.length - 1];
    await Event.updateOne({ _id: e._id, coverPhoto: null }, { coverPhoto: last._id, thumb });
    res.status(201).json(photosJson(await loadPhotos(e._id)));
  })
);

router.put(
  '/:id/photos/:photoId/cover',
  wrap(async (req, res) => {
    const found = await findPhoto(req, res);
    if (!found) return;
    const { event, photo } = found;
    await Event.updateOne(
      { _id: event._id, 'photos._id': photo._id },
      { coverPhoto: photo._id, thumb: photo.thumb }
    );
    res.json(photosJson(await loadPhotos(event._id)));
  })
);

router.delete(
  '/:id/photos/:photoId',
  wrap(async (req, res) => {
    const found = await findPhoto(req, res);
    if (!found) return;
    const { event, photo } = found;
    await Event.updateOne({ _id: event._id }, { $pull: { photos: { _id: photo._id } } });
    const next = event.photos.find((p) => String(p._id) !== String(photo._id));
    await Event.updateOne(
      { _id: event._id, coverPhoto: photo._id },
      { coverPhoto: next ? next._id : null, thumb: next ? next.thumb : '' }
    );
    res.json(photosJson(await loadPhotos(event._id)));
  })
);

module.exports = router;
