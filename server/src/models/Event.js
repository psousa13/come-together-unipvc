const mongoose = require('mongoose');
const { SCHOOLS } = require('../constants');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    startsAt: { type: Date, required: true, index: true },
    endsAt: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.startsAt || value > this.startsAt;
        },
        message: 'O fim do evento tem de ser depois do início.',
      },
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null, index: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPrivate: { type: Boolean, default: false },
    origin: { type: String, enum: ['official', 'member'], default: 'member' },
    school: { type: String, enum: SCHOOLS, required: true, index: true },
    location: {
      name: { type: String, trim: true, maxlength: 120, default: '' },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    ticketUrl: { type: String, trim: true, maxlength: 300, default: '' },
    cancelled: { type: Boolean, default: false },
    remindersSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

eventSchema.index({ attendees: 1 });

module.exports = mongoose.model('Event', eventSchema);