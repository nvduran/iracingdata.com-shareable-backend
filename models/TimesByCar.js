const mongoose = require("mongoose");

const TimesByCarSchema = new mongoose.Schema({
        car_id: Number,
        car_name: String,
        track_name: String,
        season_name: String,
        race_best: [],
        race_avg: [],
        qual_best: [],
});
TimesByCarSchema.index({ car_name: 1, track_name: 1, season_name: 1 }, { unique: true });

module.exports = mongoose.model("Times By Car", TimesByCarSchema);
