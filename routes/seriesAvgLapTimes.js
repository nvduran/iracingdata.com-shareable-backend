const express = require("express");
const router = express.Router();
const AverageLapTimeStats = require("../models/AverageLapTimeStats");

// Route to get all data by season name
// http://localhost:3100/api/series-avg-lap-times/average-lap-time/Global%20Fanatec%20Challenge%20-%202023%20Season%204%20-%20Fixed
router.get("/average-lap-time/:seasonName", async (req, res) => {
        try {
                const seasonName = req.params.seasonName;
                const data = await AverageLapTimeStats.find({ season_name: seasonName });

                if (!data.length) {
                        return res.status(404).json({ message: "No data found for the given season name." });
                }

                res.json(data);
        } catch (err) {
                console.error(`Error fetching data for season ${req.params.seasonName}: ${err}`);
                res.status(500).json({ message: "Internal Server Error" });
        }
});

module.exports = router;
