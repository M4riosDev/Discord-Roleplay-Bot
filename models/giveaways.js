const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    channel_id: { type: String, required: true },
    message_id: { type: String, required: true },
    prize: { type: String, required: true },
    winners: { type: Number, required: true },
    end_time: { type: Number, required: true },
    participants: { type: [String], default: [] },
    host_id: { type: String, required: true }
});

module.exports = mongoose.model('Giveaway', giveawaySchema);
