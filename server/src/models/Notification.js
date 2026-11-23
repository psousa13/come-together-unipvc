const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['going'], required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorUsername: { type: String, default: '' },
    actorName: { type: String, default: '' },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);