const mongoose = require("mongoose");

const UserCareerStatsPercentileSchema = new mongoose.Schema({
        last_update: { type: Date, default: Date.now },
        field: String,
        category: String,
        percentiles: [Number],
        leaderboard: [Number],
});

module.exports = mongoose.model("User Career Stats Percentile", UserCareerStatsPercentileSchema);
