const Notification = require('./models/Notification');
const User = require('./models/User');
const { emitToUser } = require('./realtime');

function toJson(n) {
  return {
    id: String(n._id),
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    actorUsername: n.actorUsername,
    actorName: n.actorName,
    eventId: String(n.event),
    eventTitle: n.eventTitle,
    eventStartsAt: n.eventStartsAt || null,
  };
}

async function notifyGoing({ organizerId, actor, event }) {
  try {
    const organizer = await User.findById(organizerId).select('notificationPrefs');
    if (organizer?.notificationPrefs?.going === false) return;
    const seen = await Notification.exists({
      user: organizerId,
      type: 'going',
      actor: actor._id,
      event: event._id,
    });
    if (seen) return;
    const n = await Notification.create({
      user: organizerId,
      type: 'going',
      actor: actor._id,
      actorUsername: actor.username,
      actorName: actor.displayName || actor.username,
      event: event._id,
      eventTitle: event.title,
    });
    emitToUser(organizerId, 'notification', toJson(n));
  } catch (err) {
    console.error('[NOTIFY]', err);
  }
}

module.exports = { notifyGoing, toJson };