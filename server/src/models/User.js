const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    avatar: String,
    school: String,
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
