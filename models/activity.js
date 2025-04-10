const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    totalTime: { type: Number, default: 0 },
    startTime: { type: Number, default: null }
});

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;