const mongoose = require('mongoose');

const dmCampaignSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  authorId: String,
  target: String,
  message: String,
  members: [String],
  lastSentIndex: { type: Number, default: 0 },
  isRunning: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('DMCampaign', dmCampaignSchema);