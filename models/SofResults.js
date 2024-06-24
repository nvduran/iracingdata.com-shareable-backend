const mongoose = require("mongoose");

const SofResultsSchema = new mongoose.Schema({
        subsession_id: { type: Number, required: true, unique: true },
        season_id: Number,
        season_name: String,
        simsession_type_name: String,
        session_id: Number,
        corners_per_lap: Number,
        race_week_num: Number,
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
        population: Number,
        precip_time_pct: Number,
});

SofResultsSchema.index({ session_id: 1, season_name: 1, track_name: 1, population: 1, event_strength_of_field: 1, event_average_lap: 1 });

module.exports = mongoose.model("SOF Result", SofResultsSchema);
