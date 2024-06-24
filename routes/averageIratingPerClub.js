const express = require("express");
const router = express.Router();
const MemberInfo = require("../models/MemberInfo");

router.get("/", async (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        try {
                const result = await MemberInfo.aggregate([
                        { $match: { "iRating.value": { $ne: null } } },
                        {
                                $group: {
                                        _id: "$club_name",
                                        average: { $avg: "$iRating.value" },
                                        count: { $sum: 1 },
                                },
                        },
                        {
                                $project: {
                                        club_name: "$_id",
                                        average: 1,
                                        _id: 0,
                                },
                        },
                ]);

                const clubAverages = {};
                for (let club of result) {
                        clubAverages[club.club_name] = club.average;
                }

                res.status(200).json(clubAverages);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to calculate average iRating per club" });
        }
});

module.exports = router;
