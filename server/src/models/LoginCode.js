const { Schema, model } = require('mongoose');

const loginCodeSchema = new Schema({
  email: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  // MongoDB deletes the document automatically once expiresAt has passed
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

module.exports = model('LoginCode', loginCodeSchema);
