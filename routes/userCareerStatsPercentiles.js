const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
const UserCareerStatsPercentile = require("../models/UserCareerStatsPercentile");
const memberCareerStats = require("../models/MemberCareerStats");

// http://localhost:3100/api/user-career-stats-percentiles/?field=wins,top5&category=road,oval

router.get("/", async (req, res) => {
        const fields = req.query.field ? req.query.field.split(",") : [];
        const categories = req.query.category ? req.query.category.split(",") : [];

        // Check if at least one field and category is provided
        if (fields.length === 0 || categories.length === 0) {
                return res.status(400).send("Both field and category are required.");
        }

        try {
                const careerStats = await UserCareerStatsPercentile.find({
                        field: { $in: fields },
                        category: { $in: categories },
                });

                if (!careerStats || careerStats.length === 0) {
                        return res.status(404).send("No career stats found for the given fields and categories.");
                }

                const responseData = {};

                careerStats.forEach((stat) => {
                        if (!responseData[stat.category]) {
                                responseData[stat.category] = {};
                        }
                        responseData[stat.category][stat.field] = stat;
                });

                return res.json(responseData);
        } catch (error) {
                console.error(error);
                return res.status(500).send("Server Error.");
        }
});

module.exports = router;
