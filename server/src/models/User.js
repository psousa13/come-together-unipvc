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
  },
  { timestamps: true }
);

userSchema.index({ following: 1 });

module.exports = model('User', userSchema);