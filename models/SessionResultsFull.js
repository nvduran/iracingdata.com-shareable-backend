const mongoose = require("mongoose");

const SessionResultsFullSchema = new mongoose.Schema({
        subsession_id: { type: Number, required: true, unique: true },
        season_id: Number,
        season_name: String,
        simsession_type_name: String,
        session_id: Number,
        corners_per_lap: Number,
        start_time: String,
        end_time: String,
        points_type: String,
        event_strength_of_field: Number,
        event_average_lap: Number,
        event_laps_complete: Number,
        num_cautions: Number,
        num_caution_laps: Number,
        num_lead_changes: Number,
        track_name: String,
        results: [],
});

module.exports = mongoose.model("Session Full Result", SessionResultsFullSchema);
