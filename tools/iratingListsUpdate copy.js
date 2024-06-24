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

// node --max-old-space-size=20000 iratingListsUpdate.js

const saveIRatings = async (category, iratings) => {
        try {
                const update = {
                        category: category,
                        values: iratings,
                        oldestUpdate: 1,
                };
                const options = {
                        new: true,
                        upsert: true, // This creates a new document if one doesn't exist
                        setDefaultsOnInsert: true, // Applies default values defined in your schema
                };

                const result = await IratingLists.findOneAndUpdate({ category: category, oldestUpdate: 1 }, update, options);
                console.log(`Updated iRatings for ${category}:`, result);
        } catch (error) {
                console.error("Error updating iRatings:", error);
        }
};

const saveIRatings2023 = async (category, iratings, oldestUpdate) => {
        console.log("2023 iRatings");
        console.log(iratings);

        try {
                const update = {
                        category: category,
                        values: iratings,
                        oldestUpdate: oldestUpdate,
                };
                const options = {
                        new: true,
                        upsert: true, // This creates a new document if one doesn't exist
                        setDefaultsOnInsert: true, // Applies default values defined in your schema
                };

                const result = await IratingLists.findOneAndUpdate({ category: category, oldestUpdate: oldestUpdate }, update, options);
                console.log(`Updated 2023 iRatings for ${category} with oldestUpdate ${oldestUpdate}:`, result);
        } catch (error) {
                console.error("Error updating 2023 iRatings:", error);
        }
};

(async () => {
        try {
                const roadIRatings = await getIRatings("road");
                const roadIRatings2023 = await getIRatings("road", 2023);
                await saveIRatings("road", roadIRatings);
                await saveIRatings2023("road", roadIRatings2023, 2023);

                const ovalIRatings = await getIRatings("oval");
                await saveIRatings("oval", ovalIRatings);

                const dirtRoadIRatings = await getIRatings("dirt_road");
                await saveIRatings("dirt_road", dirtRoadIRatings);

                const dirtOvalIRatings = await getIRatings("dirt_oval");
                await saveIRatings("dirt_oval", dirtOvalIRatings);

                const sportsCarIRatings = await getIRatings("sports_car");
                await saveIRatings("sports_car", sportsCarIRatings);

                const formulaCarIRatings = await getIRatings("formula_car");
                await saveIRatings("formula_car", formulaCarIRatings);

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
        const iratings = await MemberCareerStats.find({}, { [`${category}.iRating.value`]: 1 });

        if ((year = 2023)) {
                return iratings
                        .map((entry) => entry[category]?.iRating)
                        .filter((value) => value && value.when <= 2023 && value.value !== 1350 && value.value !== 0 && value.value !== 1250)
                        .map((rating) => rating.value);
        } else {
                return iratings.map((entry) => entry[category].iRating.value).filter((value) => value !== 1350 && value !== 0 && value !== 1250 && value);
        }
}
