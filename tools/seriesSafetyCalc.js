const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const SessionResultFull = require("../models/SessionResultsFull");
const SeriesSafetyStats = require("../models/SeriesSafetyStats");

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

function starter() {
        console.log("starting series safety calc");
        getIncidentsPerSeasonName();
}

const getIncidentsPerSeasonName = async () => {
        const seasons = await SessionResultFull.aggregate([
                { $unwind: "$results" },
                { $match: { "results.simsession_name": "RACE" } },
                { $unwind: "$results.results" },
                {
                        $group: {
                                _id: "$season_name",
                                totalIncidents: { $sum: "$results.results.incidents" },
                                totalEntrants: { $sum: 1 },
                                totalLaps: { $sum: "$event_laps_complete" },
                                totalCorners: { $sum: { $multiply: ["$corners_per_lap", "$event_laps_complete"] } },
                        },
                },
        ]);

        for (let season of seasons) {
                try {
                        await SeriesSafetyStats.findOneAndUpdate(
                                { season_name: season._id }, // find a document with that filter
                                {
                                        season_name: season._id,
                                        totalIncidents: season.totalIncidents,
                                        totalEntrants: season.totalEntrants,
                                        totalLaps: season.totalLaps,
                                        totalCorners: season.totalCorners,
                                }, // document to insert when nothing was found
                                { upsert: true, new: true, runValidators: true } // options
                        );
                        // console.log(`Upserted SeriesSafetyStats for season ${season._id}`);
                } catch (err) {
                        console.error(`Error upserting SeriesSafetyStats for season ${season._id}: ${err}`);
                }
        }

        console.log("*** Finished series safety calc ***");

        // Delay the process exit for 5 seconds to allow all tasks to complete
        setTimeout(() => {
                process.exit(0);
        }, 5000);

        return seasons;
};

starter();
