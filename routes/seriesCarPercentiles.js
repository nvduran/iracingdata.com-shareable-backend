const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
const SeriesCarPercentiles = require("../models/SeriesCarPercentiles");

// http://localhost:3100/api/series-car-percentiles/?seasonName=GT%20Sprint%20VRS%20Series%20-%202024%20Season%201&sessionType=RACE&carClassName=GT3%20Class

router.get("/", async (req, res) => {
        const seasonName = req.query.seasonName;
        const sessionType = req.query.sessionType;
        const carClassName = req.query.carClassName;

        // Check if seasonName and sessionType are provided
        if (!seasonName || !sessionType) {
                return res.status(400).send("Both seasonName and sessionType are required.");
        }

        try {
                let query = {
                        season_name: seasonName,
                        session_type: sessionType,
                };

                // Include car class name in the query if it's provided
                if (carClassName) {
                        query.car_class_name = carClassName;
                }
                const seriesCarPercentiles = await SeriesCarPercentiles.find(query);

                if (!seriesCarPercentiles || seriesCarPercentiles.length === 0) {
                        console.log("No series car percentiles found for the given fields and categories.");
                        return res.status(404).send("No series car percentiles found for the given fields and categories.");
                }

                return res.json(seriesCarPercentiles);
        } catch (error) {
                console.error(error);
                return res.status(500).send("Server Error.");
        }
});

module.exports = router;
