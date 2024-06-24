const mongoose = require("mongoose");

const MemberCareerStatsSchema = new mongoose.Schema({
        last_update: { type: Date, default: Date.now },
        cust_id: { type: Number, required: true, unique: true },
        display_name: String,
        last_login: String,
        member_since: String,
        club_id: Number,
        club_name: String,
        road: {
                iRating: { when: String, value: Number },
                starts: Number,
                wins: Number,
                top5: Number,
                poles: Number,
                avg_start_position: Number,
                avg_finish_position: Number,
                laps: Number,
                laps_led: Number,
                avg_incidents: Number,
                avg_points: Number,
                win_percentage: Number,
                top5_percentage: Number,
                laps_led_percentage: Number,
                total_club_points: Number,
        },
        oval: {
                iRating: { when: String, value: Number },
                starts: Number,
                wins: Number,
                top5: Number,
                poles: Number,
                avg_start_position: Number,
                avg_finish_position: Number,
                laps: Number,
                laps_led: Number,
                avg_incidents: Number,
                avg_points: Number,
                win_percentage: Number,
                top5_percentage: Number,
                laps_led_percentage: Number,
                total_club_points: Number,
        },
        dirt_road: {
                iRating: { when: String, value: Number },
                starts: Number,
                wins: Number,
                top5: Number,
                poles: Number,
                avg_start_position: Number,
                avg_finish_position: Number,
                laps: Number,
                laps_led: Number,
                avg_incidents: Number,
                avg_points: Number,
                win_percentage: Number,
                top5_percentage: Number,
                laps_led_percentage: Number,
                total_club_points: Number,
        },
        dirt_oval: {
                iRating: { when: String, value: Number },
                starts: Number,
                wins: Number,
                top5: Number,
                poles: Number,
                avg_start_position: Number,
                avg_finish_position: Number,
                laps: Number,
                laps_led: Number,
                avg_incidents: Number,
                avg_points: Number,
                win_percentage: Number,
                top5_percentage: Number,
                laps_led_percentage: Number,
                total_club_points: Number,
        },
        sports_car: {
                iRating: { when: String, value: Number },
                starts: Number,
                wins: Number,
                top5: Number,
                poles: Number,
                avg_start_position: Number,
                avg_finish_position: Number,
                laps: Number,
                laps_led: Number,
                avg_incidents: Number,
                avg_points: Number,
                win_percentage: Number,
                top5_percentage: Number,
                laps_led_percentage: Number,
                total_club_points: Number,
        },
        formula_car: {
                iRating: { when: String, value: Number },
                starts: Number,
                wins: Number,
                top5: Number,
                poles: Number,
                avg_start_position: Number,
                avg_finish_position: Number,
                laps: Number,
                laps_led: Number,
                avg_incidents: Number,
                avg_points: Number,
                win_percentage: Number,
                top5_percentage: Number,
                laps_led_percentage: Number,
                total_club_points: Number,
        },
});

module.exports = mongoose.model("Member Career Stats", MemberCareerStatsSchema);
