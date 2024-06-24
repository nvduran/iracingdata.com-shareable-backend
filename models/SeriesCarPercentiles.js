const mongoose = require("mongoose");

const seriesCarPercentilesSchema = new mongoose.Schema({
        season_name: { type: String, required: true },
        session_type: String,
        car_class_name: String,
        percentiles: [],
        leaderboard: [],

        last_update: { type: Date, default: Date.now },
});

const SeriesCarPercentiles = mongoose.model("SeriesCarPercentiles", seriesCarPercentilesSchema);

module.exports = SeriesCarPercentiles;
