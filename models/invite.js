const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  guildId: String,
  invited_id: String,
  inviter_id: String,
  joinedAt: { type: Date, default: Date.now },
  left: { type: Boolean, default: false },
  fake: { type: Boolean, default: false },
  bonus: { type: Number, default: 0 },
});

module.exports = mongoose.model("invite", inviteSchema);
