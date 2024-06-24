require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const MemberInfo = require("../models/MemberInfo");
const MemberCareerStats = require("../models/MemberCareerStats");
// Update to use the new model
const IratingLists = require("../models/IratingLists");

router.get("/", (req, res) => {
        res.send("This is iRating Data endpoint!");
});

router.get("/iratingsRoad/:year", async (req, res, next) => {
        const year = req.params.year;
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        try {
                const iratings = await getIRatings("road", year);
                res.status(200).json(iratings);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch iRatings" });
        }
});

router.get("/iratingsOval/:year", async (req, res, next) => {
        const year = req.params.year;
        try {
                const iratings = await getIRatings("oval", year);
                res.status(200).json(iratings);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch iRatings" });
        }
});

router.get("/iratingsDirtRoad/:year", async (req, res, next) => {
        const year = req.params.year;
        try {
                const iratings = await getIRatings("dirt_road", year);
                res.status(200).json(iratings);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch iRatings" });
        }
});

router.get("/iratingsDirtOval/:year", async (req, res, next) => {
        const year = req.params.year;
        try {
                const iratings = await getIRatings("dirt_oval", year);
                res.status(200).json(iratings);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch iRatings" });
        }
});

router.get("/iratingsSportsCar/:year", async (req, res, next) => {
        const year = req.params.year;
        try {
                const iratings = await getIRatings("sports_car", year);
                res.status(200).json(iratings);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch iRatings" });
        }
});

router.get("/iratingsFormulaCar/:year", async (req, res, next) => {
        const year = req.params.year;
        try {
                const iratings = await getIRatings("formula_car", year);
                res.status(200).json(iratings);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch iRatings" });
        }
});

async function getIRatings(category, year) {
        console.log(year);
        if (year === "1") {
                const result = await IratingLists.findOne({ category: category, oldestUpdate: 1 });
                if (!result) return [];
                return result.values.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }

        if (year === "2021") {
                console.log("2021 is the year");
                const result = await IratingLists.findOne({ category: category, oldestUpdate: 2021 });
                if (!result) return [];
                return result.values.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }

        if (year === "2022") {
                console.log("2022 is the year");
                const result = await IratingLists.findOne({ category: category, oldestUpdate: 2022 });
                if (!result) return [];
                return result.values.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }
        if (year === "2023") {
                console.log("2023 is the year");
                const result = await IratingLists.findOne({ category: category, oldestUpdate: 2023 });
                if (!result) return [];
                return result.values.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }
        if (year === "2024") {
                console.log("2024 is the year");
                const result = await IratingLists.findOne({ category: category, oldestUpdate: 2024 });
                if (!result) return [];
                return result.values.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }
}

module.exports = router;
