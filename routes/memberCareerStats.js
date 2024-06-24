const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const CryptoJS = require("crypto-js");
const MemberCareerStats = require("../models/MemberCareerStats");
const UnscannedCustId = require("../models/UnscannedCustId");
var loginCookies = "";

// return member irating data for a specific category
// 1 - Oval;
// 2 - Road;
// 3 - Dirt oval;
// 4 - Dirt road;

// Root endpoint to test if the router is working
router.get("/", (req, res) => {
        res.send("This is career stats endpoint!");
});

router.get("/career/:cust_id", async (req, res) => {
        try {
                const cust_id = req.params.cust_id;
                let memberCareerStats = await MemberCareerStats.findOne({ cust_id: cust_id });

                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                // if memberCareerStats exists in db and it's not outdated, return it
                if (memberCareerStats && memberCareerStats.last_update > sevenDaysAgo) {
                        console.log("memberCareerStats exists in db and it's not outdated, return it");
                        return res.status(200).json(memberCareerStats);
                }

                // else, add the cust id to the db using UnscannedCustId and return 202
                else {
                        console.log("memberCareerStats doesn't exist in db, add it");
                        const newUnscannedCustId = new UnscannedCustId({ cust_id: cust_id });
                        await newUnscannedCustId.save();
                        return res.status(202).json({ message: "Member not found in db, added to queue" });
                }
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch member career stats" });
        }
});

router.post("/rescan/:cust_id", async (req, res) => {
        try {
                const cust_id = req.params.cust_id;

                // Check if a document with that cust_id exists in the MemberCareerStats collection
                const existingMember = await MemberCareerStats.findOne({ cust_id: cust_id });
                if (existingMember) {
                        // If it exists, delete it
                        await MemberCareerStats.deleteOne({ cust_id: cust_id });
                }

                // Check if the cust_id already exists in the UnscannedCustId collection
                const existingUnscanned = await UnscannedCustId.findOne({ cust_id: cust_id });
                if (!existingUnscanned) {
                        // If it doesn't exist, add the cust_id to the UnscannedCustId collection
                        const newUnscannedCustId = new UnscannedCustId({ cust_id: cust_id });
                        await newUnscannedCustId.save();
                }

                res.status(200).json({ message: "Rescan requested successfully" });
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to request rescan" });
        }
});

module.exports = router;
