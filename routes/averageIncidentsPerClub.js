const express = require("express");
const router = express.Router();
const MemberCareerStats = require("../models/MemberCareerStats");

// create a route for road
router.get("/road", async (req, res) => {
        try {
                const result = await MemberCareerStats.aggregate([
                        { $unwind: "$road" },
                        { $match: { "road.avg_incidents": { $gt: 0 } } }, // Exclude all non-number and zero values
                        {
                                $group: {
                                        _id: "$club_name",
                                        avg_incidents: { $avg: "$road.avg_incidents" },
                                },
                        },
                ]);

                res.status(200).json(result);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to calculate average road incidents per club" });
        }
});

// create a route for oval
router.get("/oval", async (req, res) => {
        try {
                const result = await MemberCareerStats.aggregate([
                        { $unwind: "$oval" },
                        { $match: { "oval.avg_incidents": { $gt: 0 } } }, // Exclude all non-number and zero values
                        {
                                $group: {
                                        _id: "$club_name",
                                        avg_incidents: { $avg: "$oval.avg_incidents" },
                                },
                        },
                ]);

                res.status(200).json(result);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to calculate average oval incidents per club" });
        }
});

// create a route for dirt road
router.get("/dirt-road", async (req, res) => {
        try {
                const result = await MemberCareerStats.aggregate([
                        { $unwind: "$dirt_road" },
                        { $match: { "dirt_road.avg_incidents": { $gt: 0 } } }, // Exclude all non-number and zero values
                        {
                                $group: {
                                        _id: "$club_name",
                                        avg_incidents: { $avg: "$dirt_road.avg_incidents" },
                                },
                        },
                ]);

                res.status(200).json(result);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to calculate average dirt road incidents per club" });
        }
});

// create a route for dirt oval
router.get("/dirt-oval", async (req, res) => {
        try {
                const result = await MemberCareerStats.aggregate([
                        { $unwind: "$dirt_oval" },
                        { $match: { "dirt_oval.avg_incidents": { $gt: 0 } } }, // Exclude all non-number and zero values
                        {
                                $group: {
                                        _id: "$club_name",
                                        avg_incidents: { $avg: "$dirt_oval.avg_incidents" },
                                },
                        },
                ]);

                res.status(200).json(result);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to calculate average dirt oval incidents per club" });
        }
});

module.exports = router;
