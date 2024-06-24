const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const SessionResultFull = require("../models/SessionResultsFull");
const AverageLapTimeStats = require("../models/AverageLapTimeStats"); // Assuming you have a model for this
const SessionResultsFull = require("../models/SessionResultsFull");

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

function starter() {
        console.log("starting average lap time calc");
        getAverageLapTimePerIRating();
}

function generateId(season_name, i_rating_range, car_class_name) {
        return CryptoJS.SHA256(season_name + i_rating_range.join(",") + car_class_name).toString();
}

const getAverageLapTimePerIRating = async () => {
        const lapTimes = await SessionResultFull.aggregate([
                { $unwind: "$results" },
                { $match: { "results.simsession_name": "QUALIFY" } },
                { $unwind: "$results.results" },
                { $match: { "results.results.best_lap_time": { $gte: 0 } } }, // Exclude lap times less than 0
                {
                        $group: {
                                _id: {
                                        season: "$season_name",
                                        iRatingBucket: {
                                                $subtract: ["$results.results.oldi_rating", { $mod: ["$results.results.oldi_rating", 100] }],
                                        },
                                        carClassName: "$results.results.car_name",
                                },
                                averageBestLapTime: { $avg: "$results.results.best_lap_time" },
                        },
                },
                {
                        $project: {
                                season_name: "$_id.season",
                                i_rating_range: ["$_id.iRatingBucket", { $add: ["$_id.iRatingBucket", 100] }],
                                best_lap_time_avg: "$averageBestLapTime",
                                "compositeKey.season": "$_id.season",
                                "compositeKey.iRatingBucket": "$_id.iRatingBucket",
                                "compositeKey.carClassName": "$_id.carClassName",
                                car_class_name: "$_id.carClassName",
                        },
                },
        ]);

        for (let lapTime of lapTimes) {
                try {
                        if (!lapTime.season_name || lapTime.i_rating_range[0] === null || !lapTime.car_class_name) {
                                console.error(`Invalid data for season ${lapTime.season_name}, iRating range ${lapTime.i_rating_range}, and car class ${lapTime.car_class_name}`);
                                continue;
                        }

                        const id = generateId(lapTime.season_name, lapTime.i_rating_range, lapTime.car_class_name);
                        await AverageLapTimeStats.findOneAndUpdate(
                                { _id: id },
                                { ...lapTime, _id: id },
                                {
                                        upsert: true,
                                        new: true,
                                        runValidators: true,
                                }
                        );
                        console.log(`Upserted AverageLapTimeStats for season ${lapTime.season_name}, iRating range ${lapTime.i_rating_range}, and car class ${lapTime.car_class_name}`);
                } catch (err) {
                        console.error(
                                `Error upserting AverageLapTimeStats for season ${lapTime.season_name}, iRating range ${lapTime.i_rating_range}, and car class ${lapTime.car_class_name}: ${err}`
                        );
                }
        }

        console.log("*** Finished average lap time calc ***");

        setTimeout(() => {
                process.exit(0);
        }, 5000);

        return lapTimes;
};

starter();
