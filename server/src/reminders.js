const Event = require('./models/Event');
const User = require('./models/User');
const Notification = require('./models/Notification');
const { emitToUser } = require('./realtime');
const { toJson } = require('./notify');

const LEAD_MS = 60 * 60 * 1000;
const EVERY_MS = 60 * 1000;

async function sendDue() {
  const now = new Date();
  const events = await Event.find({
    cancelled: false,
    remindersSentAt: null,
    startsAt: { $gt: now, $lte: new Date(now.getTime() + LEAD_MS) },
  })
    .select('title startsAt attendees')
    .limit(200)
    .lean();

  for (const ev of events) {
    const claim = await Event.updateOne(
      { _id: ev._id, remindersSentAt: null },
      { $set: { remindersSentAt: now } },
      { timestamps: false }
    );
    if (claim.modifiedCount !== 1) continue;
    if (!ev.attendees.length) continue;

    const users = await User.find({
      _id: { $in: ev.attendees },
      'notificationPrefs.reminders': { $ne: false },
    })
      .select('_id')
      .lean();
    if (!users.length) continue;

    const created = await Notification.insertMany(
      users.map((u) => ({
        user: u._id,
        type: 'reminder',
        event: ev._id,
        eventTitle: ev.title,
        eventStartsAt: ev.startsAt,
      }))
    );
    for (const n of created) emitToUser(n.user, 'notification', toJson(n));
  }
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await sendDue();
  } catch (err) {
    console.error('[REMINDERS]', err);
  } finally {
    running = false;
  }
}

function startReminders() {
  tick();
  return setInterval(tick, EVERY_MS);
}

module.exports = { startReminders };