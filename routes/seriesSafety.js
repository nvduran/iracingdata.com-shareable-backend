const express = require("express");
const router = express.Router();
const SeriesSafetyStats = require("../models/SeriesSafetyStats");
const SeriesSafetyStatsHistoric = require("../models/SeriesSafetyStatsHistoric");

// http://localhost:3100/api/series-safety/
router.get("/", (req, res) => {
        SeriesSafetyStats.find({}, (err, seriesSafetyStats) => {
                if (err) {
                        console.log(err);
                } else {
                        res.json(seriesSafetyStats);
                }
        });
});

router.get("/historic", (req, res) => {
        SeriesSafetyStatsHistoric.find({}, (err, seriesSafetyStatsHistoric) => {
                if (err) {
                        console.log(err);
                } else {
                        res.json(seriesSafetyStatsHistoric);
                }
        });
});

module.exports = router;
