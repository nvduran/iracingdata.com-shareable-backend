const SofResult = require("../models/SofResults");
const SessionResultFull = require("../models/SessionResultsFull");
const SeriesSafetyStats = require("../models/SeriesSafetyStats");
const AverageLapTimeStats = require("../models/AverageLapTimeStats");
const SeriesCarPercentiles = require("../models/SeriesCarPercentiles");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
        deleteAllSofResults();
        deleteAllSessionResultsFull();
        deleteAllSeriesSafetyStats();
        deleteAllAverageLapTimeStats();
        deleteAllSeriesCarPercentiles();
});

const deleteAllSofResults = async () => {
        try {
                await SofResult.deleteMany({});
                console.log("All SofResults deleted!");
        } catch (err) {
                console.log(err);
        }
};

const deleteAllSessionResultsFull = async () => {
        try {
                await SessionResultFull.deleteMany({});
                console.log("All SessionResultFull deleted!");
        } catch (err) {
                console.log(err);
        }
};

const deleteAllSeriesSafetyStats = async () => {
        try {
                await SeriesSafetyStats.deleteMany({});
                console.log("All SeriesSafetyStats deleted!");
        } catch (err) {
                console.log(err);
        }
};

const deleteAllAverageLapTimeStats = async () => {
        try {
                await AverageLapTimeStats.deleteMany({});
                console.log("All AverageLapTimeStats deleted!");
        } catch (err) {
                console.log(err);
        }
};

const deleteAllSeriesCarPercentiles = async () => {
        try {
                await SeriesCarPercentiles.deleteMany({});
                console.log("All SeriesCarPercentiles deleted!");
        } catch (err) {
                console.log(err);
        }
};
