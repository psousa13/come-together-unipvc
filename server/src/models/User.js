const { Schema, model } = require('mongoose');
const { MEMBER_TYPES } = require('../constants');

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    avatar: String,
    school: String,
    memberType: { type: String, enum: MEMBER_TYPES },
    course: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 160, default: '' },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followedCommunities: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
    notificationPrefs: {
      going: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.index({ following: 1 });
userSchema.index({ followedCommunities: 1 });

module.exports = model('User', userSchema);
