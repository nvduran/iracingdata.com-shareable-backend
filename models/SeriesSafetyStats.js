const mongoose = require("mongoose");

const seriesSafetyStats = new mongoose.Schema({
        season_name: { type: String, required: true, unique: true },
        totalIncidents: Number,
        totalEntrants: Number,
        totalLaps: Number,
        totalCorners: Number,
        last_updated: { type: Date, required: true, unique: true, default: Date.now },
});

module.exports = mongoose.model("Series Safety Stats", seriesSafetyStats);
