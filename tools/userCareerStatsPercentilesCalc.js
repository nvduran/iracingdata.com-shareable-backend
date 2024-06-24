const express = require("express");
const fetch = require("node-fetch");
var CryptoJS = require("crypto-js");
const UserCareerStatsPercentile = require("../models/UserCareerStatsPercentile");
const MemberCareerStats = require("../models/MemberCareerStats");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

async function getMemberCareerStats() {
        console.log("getting memberCareerStats");
        const stats = await MemberCareerStats.find({});
        return stats;
}

function percentile(arr, p) {
        if (arr.length === 0) return 0;
        if (typeof p !== "number") throw new TypeError("p must be a number");
        if (p <= 0) return arr[0];
        if (p >= 1) return arr[arr.length - 1];

        arr.sort(function (a, b) {
                return a - b;
        });
        var index = (arr.length - 1) * p;
        var lower = Math.floor(index);
        var upper = lower + 1;
        var weight = index % 1;

        if (upper >= arr.length) return arr[lower];
        return arr[lower] * (1 - weight) + arr[upper] * weight;
}

async function calculateAndStorePercentiles() {
        try {
                const stats = await getMemberCareerStats();

                const fields = [
                        "starts",
                        "wins",
                        "top5",
                        "poles",
                        "avg_start_position",
                        "avg_finish_position",
                        "laps",
                        "laps_led",
                        "avg_incidents",
                        "avg_points",
                        "win_percentage",
                        "top5_percentage",
                        "laps_led_percentage",
                        "total_club_points",
                        "starts_per_win",
                ];

                const categories = ["sports_car", "formula_car", "oval", "dirt_road", "dirt_oval", "road"];

                for (let category of categories) {
                        let percentiles = {};
                        let leaderboards = {};
                        fields.forEach((field) => {
                                percentiles[field] = [];
                                leaderboards[field] = [];
                        });

                        for (let stat of stats) {
                                fields.forEach((field) => {
                                        if (field === "starts_per_win") {
                                                if (stat[category]["wins"] !== 0) {
                                                        let value = stat[category]["starts"] / stat[category]["wins"];
                                                        percentiles[field].push(value);
                                                }
                                        } else {
                                                let value = stat[category][field];
                                                if (typeof value === "number" && value !== 0) percentiles[field].push(value);
                                        }
                                });
                        }

                        for (let field of fields) {
                                let values = percentiles[field];
                                if (field === "starts_per_win") {
                                        leaderboards[field] = values.sort((a, b) => a - b).slice(0, 100);
                                } else {
                                        leaderboards[field] = values.sort((a, b) => b - a).slice(0, 100);
                                }

                                let percentileValues = [];
                                for (let i = 1; i <= 100; i++) {
                                        let percentileValue = percentile(values, i / 100);
                                        percentileValues.push(percentileValue);
                                }

                                // Filter out NaN values from percentileValues
                                percentileValues = percentileValues.filter((value) => !isNaN(value));

                                await UserCareerStatsPercentile.deleteMany({ field: field, category: category });

                                const userCareerStatsPercentile = new UserCareerStatsPercentile({
                                        field: field,
                                        category: category,
                                        percentiles: percentileValues,
                                        leaderboard: leaderboards[field],
                                });

                                await userCareerStatsPercentile.save();
                                console.log(`Saved ${field} percentiles and leaderboard for ${category} to database`);
                        }
                }
        } catch (error) {
                console.error(error);
        }
}

calculateAndStorePercentiles();

// node --max-old-space-size=20000 userCareerStatsPercentilesCalc.js
