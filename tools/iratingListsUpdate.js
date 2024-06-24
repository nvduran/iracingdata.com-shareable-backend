require("dotenv").config();
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
const IratingLists = require("../models/IratingLists");
const MemberCareerStats = require("../models/MemberCareerStats");
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

//node --max-old-space-size=20000 iratingListsUpdate.js

const saveIRatings = async (category, iratings, oldest) => {
        try {
                const update = {
                        category: category,
                        values: iratings,
                        oldestUpdate: oldest,
                };
                const options = {
                        new: true,
                        upsert: true, // This creates a new document if one doesn't exist
                        setDefaultsOnInsert: true, // Applies default values defined in your schema
                };

                const result = await IratingLists.findOneAndUpdate({ category: category, oldestUpdate: oldest }, update, options);
                console.log(`Updated iRatings for ${category}:`, result);
        } catch (error) {
                console.error("Error updating iRatings:", error);
        }
};
//node --max-old-space-size=20000 iratingListsUpdate.js

(async () => {
        try {
                const sportsCarIRatings = await getIRatings("sports_car");
                await saveIRatings("sports_car", sportsCarIRatings, 1);

                const sportsCarIRatings2021 = await getIRatings("sports_car", 2021);
                await saveIRatings("sports_car", sportsCarIRatings2021, 2021);

                const sportsCarIRatings2022 = await getIRatings("sports_car", 2022);
                await saveIRatings("sports_car", sportsCarIRatings2022, 2022);

                const sportsCarIRatings2023 = await getIRatings("sports_car", 2023);
                await saveIRatings("sports_car", sportsCarIRatings2023, 2023);

                const sportsCarIRatings2024 = await getIRatings("sports_car", 2024);
                await saveIRatings("sports_car", sportsCarIRatings2024, 2024);

                const formulaCarIRatings = await getIRatings("formula_car");
                await saveIRatings("formula_car", formulaCarIRatings, 1);

                const formulaCarIRatings2021 = await getIRatings("formula_car", 2021);
                await saveIRatings("formula_car", formulaCarIRatings2021, 2021);

                const formulaCarIRatings2022 = await getIRatings("formula_car", 2022);
                await saveIRatings("formula_car", formulaCarIRatings2022, 2022);

                const formulaCarIRatings2023 = await getIRatings("formula_car", 2023);
                await saveIRatings("formula_car", formulaCarIRatings2023, 2023);

                const formulaCarIRatings2024 = await getIRatings("formula_car", 2024);
                await saveIRatings("formula_car", formulaCarIRatings2024, 2024);

                const roadIRatings = await getIRatings("road");
                await saveIRatings("road", roadIRatings, 1);

                const roadIRatings2021 = await getIRatings("road", 2021);
                await saveIRatings("road", roadIRatings2021, 2021);

                const roadIRatings2022 = await getIRatings("road", 2022);
                await saveIRatings("road", roadIRatings2022, 2022);

                const roadIRatings2023 = await getIRatings("road", 2023);
                await saveIRatings("road", roadIRatings2023, 2023);

                const roadIRatings2024 = await getIRatings("road", 2024);
                await saveIRatings("road", roadIRatings2024, 2024);

                const ovalIRatings = await getIRatings("oval");
                await saveIRatings("oval", ovalIRatings, 1);

                const ovalIRatings2021 = await getIRatings("oval", 2021);
                await saveIRatings("oval", ovalIRatings2021, 2021);

                const ovalIRatings2022 = await getIRatings("oval", 2022);
                await saveIRatings("oval", ovalIRatings2022, 2022);

                const ovalIRatings2023 = await getIRatings("oval", 2023);
                await saveIRatings("oval", ovalIRatings2023, 2023);

                const ovalIRatings2024 = await getIRatings("oval", 2024);
                await saveIRatings("oval", ovalIRatings2024, 2024);

                const dirtRoadIRatings = await getIRatings("dirt_road");
                await saveIRatings("dirt_road", dirtRoadIRatings, 1);

                const dirtRoadIRatings2021 = await getIRatings("dirt_road", 2021);
                await saveIRatings("dirt_road", dirtRoadIRatings2021, 2021);

                const dirtRoadIRatings2022 = await getIRatings("dirt_road", 2022);
                await saveIRatings("dirt_road", dirtRoadIRatings2022, 2022);

                const dirtRoadIRatings2023 = await getIRatings("dirt_road", 2023);
                await saveIRatings("dirt_road", dirtRoadIRatings2023, 2023);

                const dirtRoadIRatings2024 = await getIRatings("dirt_road", 2024);
                await saveIRatings("dirt_road", dirtRoadIRatings2024, 2024);

                const dirtOvalIRatings = await getIRatings("dirt_oval");
                await saveIRatings("dirt_oval", dirtOvalIRatings, 1);

                const dirtOvalIRatings2021 = await getIRatings("dirt_oval", 2021);
                await saveIRatings("dirt_oval", dirtOvalIRatings2021, 2021);

                const dirtOvalIRatings2022 = await getIRatings("dirt_oval", 2022);
                await saveIRatings("dirt_oval", dirtOvalIRatings2022, 2022);

                const dirtOvalIRatings2023 = await getIRatings("dirt_oval", 2023);
                await saveIRatings("dirt_oval", dirtOvalIRatings2023, 2023);

                const dirtOvalIRatings2024 = await getIRatings("dirt_oval", 2024);
                await saveIRatings("dirt_oval", dirtOvalIRatings2024, 2024);

                // Schedule the exit after 10 seconds
                setTimeout(() => {
                        console.log("Exiting after 10 seconds.");
                        process.exit();
                }, 10000);
        } catch (err) {
                console.error(err);
        }
})();

async function getIRatings(category, year) {
        let iratings = [];

        if (category === "sports_car" || category === "formula_car") {
                console.log("sports_car or formula_car");
                let category1 = "road";
                iratings = await MemberCareerStats.find({}, { [`${category}.iRating.value`]: 1, [`${category1}.iRating.when`]: 1 });
        } else {
                iratings = await MemberCareerStats.find({}, { [`${category}.iRating.value`]: 1, [`${category}.iRating.when`]: 1 });
        }

        if (year === 2021) {
                let filteredReturn = [];

                iratings.forEach((entry) => {
                        if (category === "sports_car" || category === "formula_car") {
                                // this will eventually need to be phased out some day
                                const iRatingDate = new Date(entry.road.iRating.when);
                                const comparisonDate = new Date("2021-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        } else {
                                const iRatingDate = new Date(entry[category].iRating.when);
                                const comparisonDate = new Date("2021-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        }
                });
                console.log("2021 iRatings length");
                console.log(filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250).length);
                return filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }

        if (year === 2022) {
                let filteredReturn = [];

                iratings.forEach((entry) => {
                        if (category === "sports_car" || category === "formula_car") {
                                // this will eventually need to be phased out some day
                                const iRatingDate = new Date(entry.road.iRating.when);
                                const comparisonDate = new Date("2022-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        } else {
                                const iRatingDate = new Date(entry[category].iRating.when);
                                const comparisonDate = new Date("2022-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        }
                });
                console.log("2022 iRatings length");
                console.log(filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250).length);
                return filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }

        if (year === 2023) {
                let filteredReturn = [];

                iratings.forEach((entry) => {
                        if (category === "sports_car" || category === "formula_car") {
                                // this will eventually need to be phased out some day
                                const iRatingDate = new Date(entry.road.iRating.when);
                                const comparisonDate = new Date("2023-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        } else {
                                const iRatingDate = new Date(entry[category].iRating.when);
                                const comparisonDate = new Date("2023-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        }
                });
                console.log("2023 iRatings length");
                console.log(filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250).length);
                return filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }

        if (year === 2024) {
                let filteredReturn = [];

                iratings.forEach((entry) => {
                        if (category === "sports_car" || category === "formula_car") {
                                // this will eventually need to be phased out some day
                                const iRatingDate = new Date(entry.road.iRating.when);
                                const comparisonDate = new Date("2024-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        } else {
                                const iRatingDate = new Date(entry[category].iRating.when);
                                const comparisonDate = new Date("2024-01-01");

                                if (iRatingDate >= comparisonDate) {
                                        filteredReturn.push(entry[category].iRating.value);
                                }
                        }
                });
                console.log("2024 iRatings length");
                console.log(filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250).length);
                return filteredReturn.filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }

        return iratings.map((entry) => entry[category].iRating.value).filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
}

// node --max-old-space-size=24000 iratingListsUpdate.js
