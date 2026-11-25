const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['event', 'user'], required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, enum: ['spam', 'offensive', 'misleading', 'other'], required: true },
    details: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    handledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);