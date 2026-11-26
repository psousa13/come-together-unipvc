const { Schema, model } = require('mongoose');

const communitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 40 },
    nameKey: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 80, default: '' },
    isPrivate: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    requests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

communitySchema.index({ members: 1 });

module.exports = model('Community', communitySchema);