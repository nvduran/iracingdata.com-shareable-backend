const SeriesCarPercentiles = require("../models/SeriesCarPercentiles");
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const SessionResultFull = require("../models/SessionResultsFull");

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
        starter();
});

function starter() {
        // console.log("Starting series car percentiles calculation");
        getSeriesCarPercentiles().catch((error) => {
                console.error("Error in getSeriesCarPercentiles:", error);
        });
}

const getSeriesCarPercentiles = async () => {
        try {
                // console.log("getSeriesCarPercentiles function started");

                // Define a cursor for the required data
                const pipelineQuali = [
                        { $unwind: "$results" },
                        { $match: { "results.simsession_name": "QUALIFY" } },
                        { $unwind: "$results.results" },
                        { $match: { "results.results.best_qual_lap_time": { $ne: -1 } } },
                        {
                                $group: {
                                        _id: {
                                                season: "$season_name",
                                                carClass: "$results.results.car_class_name",
                                        },
                                        best_qual_lap_times: {
                                                $push: "$results.results.best_qual_lap_time",
                                        },
                                },
                        },
                ];

                const pipelineRace = [
                        { $unwind: "$results" },
                        { $match: { "results.simsession_name": "RACE" } },
                        { $unwind: "$results.results" },
                        { $match: { "results.results.best_lap_time": { $ne: -1 } } },
                        {
                                $group: {
                                        _id: {
                                                season: "$season_name",
                                                carClass: "$results.results.car_class_name",
                                        },
                                        best_lap_times: {
                                                $push: "$results.results.best_lap_time",
                                        },
                                },
                        },
                ];

                const cursorQuali = SessionResultFull.aggregate(pipelineQuali);
                const cursorRace = SessionResultFull.aggregate(pipelineRace);

                const seasonIdBestQualLapTimes = {};
                const seasonIdBestRaceLapTimes = {};

                // Process each group as it comes in
                for await (const group of cursorQuali) {
                        // add season name to seasonIdBestQualLapTimes if it doesnt exist
                        if (!seasonIdBestQualLapTimes[group._id.season]) {
                                seasonIdBestQualLapTimes[group._id.season] = {};
                        }

                        // add car class to seasonIdBestQualLapTimes if it doesnt exist
                        if (!seasonIdBestQualLapTimes[group._id.season][group._id.carClass]) {
                                seasonIdBestQualLapTimes[group._id.season][group._id.carClass] = {};
                        }

                        // add best qual lap times to seasonIdBestQualLapTimes if it doesnt exist
                        if (!seasonIdBestQualLapTimes[group._id.season][group._id.carClass].bestQualLapTimes) {
                                seasonIdBestQualLapTimes[group._id.season][group._id.carClass].bestQualLapTimes = group.best_qual_lap_times;
                        }
                }

                // Process each group as it comes in
                for await (const group of cursorRace) {
                        // console.log(group);
                        // add season name to seasonIdBestRaceLapTimes if it doesnt exist
                        if (!seasonIdBestRaceLapTimes[group._id.season]) {
                                seasonIdBestRaceLapTimes[group._id.season] = {};
                        }

                        // add car class to seasonIdBestRaceLapTimes if it doesnt exist
                        if (!seasonIdBestRaceLapTimes[group._id.season][group._id.carClass]) {
                                seasonIdBestRaceLapTimes[group._id.season][group._id.carClass] = {};
                        }

                        // add best lap times to seasonIdBestRaceLapTimes if it doesnt exist
                        if (!seasonIdBestRaceLapTimes[group._id.season][group._id.carClass].bestRaceLapTimes) {
                                seasonIdBestRaceLapTimes[group._id.season][group._id.carClass].bestRaceLapTimes = group.best_lap_times;
                        }
                }

                // for each eason car combination, calculate percentiles from the bestQualLapTimes array. List the percentiles in an array 1,2,3, etc.
                const seasonCarPercentilesQuali = {};
                const seasonCarPercentilesRace = {};

                for (const seasonName in seasonIdBestQualLapTimes) {
                        seasonCarPercentilesQuali[seasonName] = {};
                        for (const carClass in seasonIdBestQualLapTimes[seasonName]) {
                                seasonCarPercentilesQuali[seasonName][carClass] = {};
                                seasonCarPercentilesQuali[seasonName][carClass].percentiles = [];
                                seasonCarPercentilesQuali[seasonName][carClass].leaderboard = [];
                                const bestQualLapTimes = seasonIdBestQualLapTimes[seasonName][carClass].bestQualLapTimes;
                                const sortedBestQualLapTimes = bestQualLapTimes.sort((a, b) => a - b);
                                const totalBestQualLapTimes = sortedBestQualLapTimes.length;
                                const percentileInterval = Math.floor(totalBestQualLapTimes / 100);
                                const percentileArray = [];
                                for (let i = 0; i < 100; i++) {
                                        percentileArray.push(sortedBestQualLapTimes[i * percentileInterval]);
                                }
                                seasonCarPercentilesQuali[seasonName][carClass].percentiles = percentileArray;
                                seasonCarPercentilesQuali[seasonName][carClass].leaderboard = sortedBestQualLapTimes;
                        }
                }

                for (const seasonName in seasonIdBestRaceLapTimes) {
                        seasonCarPercentilesRace[seasonName] = {};
                        for (const carClass in seasonIdBestRaceLapTimes[seasonName]) {
                                seasonCarPercentilesRace[seasonName][carClass] = {};
                                seasonCarPercentilesRace[seasonName][carClass].percentiles = [];
                                seasonCarPercentilesRace[seasonName][carClass].leaderboard = [];
                                const bestRaceLapTimes = seasonIdBestRaceLapTimes[seasonName][carClass].bestRaceLapTimes;
                                const sortedBestRaceLapTimes = bestRaceLapTimes.sort((a, b) => a - b);
                                const totalBestRaceLapTimes = sortedBestRaceLapTimes.length;
                                const percentileInterval = Math.floor(totalBestRaceLapTimes / 100);
                                const percentileArray = [];
                                for (let i = 0; i < 100; i++) {
                                        percentileArray.push(sortedBestRaceLapTimes[i * percentileInterval]);
                                }
                                seasonCarPercentilesRace[seasonName][carClass].percentiles = percentileArray;
                                seasonCarPercentilesRace[seasonName][carClass].leaderboard = sortedBestRaceLapTimes;
                        }
                }

                // save seasonCarPercentilesQuali to the database, or update if it already exists
                for (const seasonName in seasonCarPercentilesQuali) {
                        for (const carClass in seasonCarPercentilesQuali[seasonName]) {
                                const seasonCarPercentilesQualiDoc = await SeriesCarPercentiles.findOne({
                                        season_name: seasonName,
                                        session_type: "QUALIFY",
                                        car_class_name: carClass,
                                });
                                if (!seasonCarPercentilesQualiDoc) {
                                        const newseasonCarPercentilesQualiDoc = new SeriesCarPercentiles({
                                                season_name: seasonName,
                                                session_type: "QUALIFY",
                                                car_class_name: carClass,
                                                percentiles: seasonCarPercentilesQuali[seasonName][carClass].percentiles,
                                                leaderboard: seasonCarPercentilesQuali[seasonName][carClass].leaderboard,
                                        });
                                        await newseasonCarPercentilesQualiDoc.save();
                                        // console.log("New season car percentiles doc saved QUALI");
                                } else {
                                        seasonCarPercentilesQualiDoc.percentiles = seasonCarPercentilesQuali[seasonName][carClass].percentiles;
                                        seasonCarPercentilesQualiDoc.leaderboard = seasonCarPercentilesQuali[seasonName][carClass].leaderboard;
                                        await seasonCarPercentilesQualiDoc.save();
                                        // console.log("Existing season car percentiles doc updated QUALI");
                                }
                        }
                }

                // console.log(seasonCarPercentilesRace);
                // save seasonCarPercentilesRace to the database, or update if it already exists
                for (const seasonName in seasonCarPercentilesRace) {
                        for (const carClass in seasonCarPercentilesRace[seasonName]) {
                                const seasonCarPercentilesRaceDoc = await SeriesCarPercentiles.findOne({
                                        season_name: seasonName,
                                        session_type: "RACE",
                                        car_class_name: carClass,
                                });
                                if (!seasonCarPercentilesRaceDoc) {
                                        const newseasonCarPercentilesRaceDoc = new SeriesCarPercentiles({
                                                season_name: seasonName,
                                                session_type: "RACE",
                                                car_class_name: carClass,
                                                percentiles: seasonCarPercentilesRace[seasonName][carClass].percentiles,
                                                leaderboard: seasonCarPercentilesRace[seasonName][carClass].leaderboard,
                                        });
                                        await newseasonCarPercentilesRaceDoc.save();
                                        // console.log("New season car percentiles doc saved RACE");
                                } else {
                                        seasonCarPercentilesRaceDoc.percentiles = seasonCarPercentilesRace[seasonName][carClass].percentiles;
                                        seasonCarPercentilesRaceDoc.leaderboard = seasonCarPercentilesRace[seasonName][carClass].leaderboard;
                                        await seasonCarPercentilesRaceDoc.save();
                                        // console.log("Existing season car percentiles doc updated RACE");
                                }
                        }
                }

                console.log("*************Series Car Percentiles finished**************");

                // exit
                process.exit(0);

                // then calculate percentiles for each season name
        } catch (error) {
                console.error("Error in aggregation:", error);
                throw error;
        }
};

// node --max-old-space-size=8192 seriesCarPercentilesCalc.js

module.exports = router;
