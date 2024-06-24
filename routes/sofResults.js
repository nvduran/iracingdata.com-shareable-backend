const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
const SofResults = require("../models/SofResults");

async function getSofResults() {
        const sofResults = await SofResults.find(
                {},
                {
                        season_name: 1,
                        population: 1,
                        event_strength_of_field: 1,
                        event_average_lap: 1,
                        session_id: 1,
                        track_name: 1,
                        start_time: 1,
                        precip_time_pct: 1,
                }
        );

        const results = sofResults.map((result) => {
                return {
                        season_name: result.season_name,
                        population: result.population,
                        event_strength_of_field: result.event_strength_of_field,
                        event_average_lap: result.event_average_lap,
                        session_id: result.session_id,
                        track_name: result.track_name,
                        start_time: result.start_time,
                        precip_time_pct: result.precip_time_pct,
                };
        });

        return results;
}

router.get("/", (req, res) => {
        res.send("This is sof results endpoint!");
});

// example:
// http://localhost:3100/api/sof-results/sofresults
router.get("/sofresults", async (req, res) => {
        console.log("sofresults endpoint hit");
        try {
                const sofResults = await getSofResults();
                res.status(200).json(sofResults);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch sof results" });
        }
});

module.exports = router;
