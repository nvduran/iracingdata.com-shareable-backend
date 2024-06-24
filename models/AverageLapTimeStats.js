const mongoose = require("mongoose");

// Define the schema
const AverageLapTimeStatsSchema = new mongoose.Schema({
        _id: {
                type: String,
                required: true,
        },
        compositeKey: {
                season: {
                        type: String,
                        required: true,
                },
                iRatingBucket: {
                        type: Number,
                        required: true,
                },
                carClassName: {
                        type: String,
                        required: true,
                },
        },
        season_name: {
                type: String,
                required: true,
        },
        i_rating_range: {
                type: [Number],
                required: true,
        },
        best_lap_time_avg: {
                type: Number,
                required: true,
        },
        car_name: {
                type: String,
                required: false,
        },
});

// Create a unique index on compositeKey to ensure no duplicate entries
AverageLapTimeStatsSchema.index({ "compositeKey.season": 1, "compositeKey.iRatingBucket": 1, "compositeKey.carClassName": 1 }, { unique: true });

// Create the model
const AverageLapTimeStats = mongoose.model("AverageLapTimeStats", AverageLapTimeStatsSchema);

module.exports = AverageLapTimeStats;
