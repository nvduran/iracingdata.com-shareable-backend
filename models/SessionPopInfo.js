const mongoose = require("mongoose");

const SessionPopInfo = new mongoose.Schema({
        subsession_id: { type: Number, required: true, unique: true },
        season_id: Number,
        season_name: String,
        simsession_type_name: String,
        start_time: String,
        session_id: Number,
        corners_per_lap: Number,
        track_name: String,
        population: Number,
});

module.exports = mongoose.model("Session Pop Info", SessionPopInfo);
