const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionResult = require("../models/SessionResults");
const MemberInfo = require("../models/MemberInfo");
const MemberCareerStats = require("../models/MemberCareerStats");
const SofResults = require("../models/SofResults");
const mongoose = require("mongoose");

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

getAuth();

async function getAuth() {
        console.log(process.env.IR_USERNAME);
        console.log("getting auth, sessionData");
        var hash = CryptoJS.SHA256(process.env.IR_PASSWORD + process.env.IR_USERNAME.toLowerCase());
        // The values in parenthesis evaluate to ("MyPassWord"+"clunky@iracing.com")
        // Notice the password value maintains its case, while the lowercase username is used here

        //Then we need to enc the hash in Base64
        var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

        const accessReply = await fetch("https://members-ng.iracing.com/auth", {
                method: "POST",
                body: JSON.stringify({
                        email: "nvduran@gmail.com",
                        password: hashInBase64,
                }),
                credentials: "include",
                headers: { Accept: "*/*", "Content-type": "application/json" },
        });
        const replyBody = await accessReply.json();
        var statusCode = await accessReply.status;
        console.log("Auth status code sessionData: " + statusCode);
        if (statusCode == 200) {
                // delay = originalDelay;
                setTimeout(async () => await starter(), 3000);
        }
        if (statusCode == 503) {
                // delay = maintenceDelay;
        }
        loginCookies = parseCookies(accessReply);
        return statusCode;
}

function parseCookies(response) {
        const raw = response.headers.raw()["set-cookie"];
        return raw
                .map((entry) => {
                        const parts = entry.split(";");
                        const cookiePart = parts[0];
                        // console.log("parseCookies" + cookiePart);

                        return cookiePart;
                })
                .join(";");
}

function starter() {
        console.log("starter");
        // findAndRemoveDuplicates();
        // findAndRemoveInvalid();
        // deleteDocumentsFrom2022();
        // deleteDocumentsWithSeason1();
        // deleteMemberInfosWithoutLastLogin();
        // deleteMembersWithIRating(1350)
        //         .then((result) => console.log(`Deleted ${result.deletedCount} member(s) with iRating value 1350`))
        //         .catch((error) => console.error("Error deleting members with iRating value 1350:", error));

        // deleteMembersWithOldLogins2017();
        // deleteMembersWithoutIRating();
        // logMembersWithZeroIRating();
        // logMembersWithIRatingInRange();
        // removeSpecificSofSeason();
        logMembersWithoutDisplayName();
}

// check db for duplicate subsession_id, console log the duplicates and delete them
async function findAndRemoveDuplicates() {
        try {
                // Find duplicate subsession_ids
                const duplicates = await SessionResult.aggregate([
                        {
                                $group: {
                                        _id: "$subsession_id",
                                        uniqueIds: { $addToSet: "$_id" },
                                        count: { $sum: 1 },
                                },
                        },
                        {
                                $match: {
                                        count: { $gt: 1 },
                                },
                        },
                ]);

                // Log duplicates
                console.log("Found duplicates:", duplicates);

                // Iterate through the duplicates, and delete all but the first document for each duplicate subsession_id
                for (const duplicate of duplicates) {
                        const idsToDelete = duplicate.uniqueIds.slice(1); // Keep the first document, and delete the rest
                        await SessionResult.deleteMany({ _id: { $in: idsToDelete } });
                        console.log(`Deleted duplicates for subsession_id ${duplicate._id}`);
                }

                console.log("All duplicates removed.");
        } catch (error) {
                console.error("Error removing duplicates:", error);
        }
}

// check db for sessions that don't have valid start_time and remove them
async function findAndRemoveInvalid() {
        try {
                // Find all sessions with an invalid start_time
                const invalidSessions = await SessionResult.find({ start_time: { $exists: false } });

                // Log the invalid sessions
                console.log("Invalid sessions:", invalidSessions);

                // Remove the invalid sessions
                for (const session of invalidSessions) {
                        await session.remove();
                }

                console.log("Invalid sessions removed successfully");
        } catch (error) {
                console.error("Error removing invalid sessions:", error);
        }
}

// Find and delete any documents with a start time in 2022
async function deleteDocumentsFrom2022() {
        try {
                const year2022 = new RegExp("^2022-", "i");

                // Find all sessions with a start_time in 2022
                const sessions2022 = await SessionResult.find({ start_time: { $regex: year2022 } });

                // Log the sessions
                console.log("Sessions with start time in 2022:", sessions2022);

                // Remove the sessions
                for (const session of sessions2022) {
                        await session.remove();
                }

                console.log("Sessions with start time in 2022 removed successfully");
        } catch (error) {
                console.error("Error removing sessions with start time in 2022:", error);
        }
}

// Find and delete any documents with a season_name containing "Season 2"
// requires "node --max-old-space-size=8192 dbCleaner.js" to run
async function deleteDocumentsWithSeason1() {
        try {
                const season1Regex = new RegExp("Season 2", "i");

                // Find all sessions with a season_name containing "Season 2"
                const sessionsWithSeason1 = await SessionResult.find({ season_name: { $regex: season1Regex } });

                // Log the sessions
                console.log("Sessions with season_name containing 'Season 2':", sessionsWithSeason1);

                // Remove the sessions
                for (const session of sessionsWithSeason1) {
                        await session.remove();
                }

                console.log("Sessions with season_name containing 'Season 2' removed successfully");
        } catch (error) {
                console.error("Error removing sessions with season_name containing 'Season 2':", error);
        }
}

// find and delete any Member Infos that don't have a last_login
async function deleteMemberInfosWithoutLastLogin() {
        try {
                const noLastLogin = await MemberInfo.find({ last_login: { $exists: false } });

                // Log the sessions
                console.log("Member Infos without last_login:", noLastLogin);

                // Remove the sessions
                for (const memberInfo of noLastLogin) {
                        // await memberInfo.remove();
                }

                console.log("Member Infos without last_login removed successfully");
        } catch (error) {
                console.error("Error removing Member Infos without last_login:", error);
        }
}

async function deleteMembersWithIRating(targetIRating) {
        const result = await MemberInfo.deleteMany({ "iRating.value": targetIRating });
        return result;
}

async function deleteMembersWithOldLogins2017() {
        // Regex to match years from 2000 to 2020
        const yearreg = new RegExp("^(200[0-9]|201[0-9]|202[0-0])-", "i");

        const membersDeleting = await MemberInfo.find({ last_login: { $regex: yearreg } });

        // Log the members
        console.log("last logins in or before 2021:", membersDeleting);

        let removedCount = 0; // Initialize count of removed members

        // Remove the members
        for (const member of membersDeleting) {
                // Uncomment the next line to actually remove the member
                // await member.remove();
                // console.log("member removed");
                removedCount++; // Increment count after each removal
        }

        // Log how many members were removed
        console.log(`${removedCount} members were removed.`);
}

async function deleteMembersWithoutIRating() {
        try {
                const deleteResult = await MemberInfo.deleteMany({ "iRating.value": { $exists: false } });

                console.log(`Successfully removed ${deleteResult.deletedCount} MemberInfo documents without iRating.value`);
        } catch (error) {
                console.error("Error removing Member Infos without iRating.value:", error);
        }
}

async function logMembersWithZeroIRating() {
        try {
                const membersWithZeroIRating = await MemberInfo.find({ "iRating.value": 0 });

                // Log the members
                console.log("Members with iRating value 0:", membersWithZeroIRating);
        } catch (error) {
                console.error("Error logging members with iRating value 0:", error);
        }
}
async function logMembersWithIRatingInRange() {
        try {
                const memberCountWithIRatingInRange = await MemberInfo.countDocuments({
                        "iRating.value": { $gte: 100, $lte: 200 },
                });

                // Log the count
                console.log("Number of members with iRating value from 0 to 100:", memberCountWithIRatingInRange);
        } catch (error) {
                console.error("Error counting members with iRating value from 0 to 100:", error);
        }
}

async function removeSpecificSofSeason() {
        try {
                // Find all SofResults without a season_name
                const sofResultsWithoutSeasonName = await SofResults.find({ season_name: "2023 6 Hours of the Glen Presented by VCO" });

                // Log the SofResults
                console.log("SofResults without season_name:", sofResultsWithoutSeasonName);
                // delete the SofResults
                for (const sofResult of sofResultsWithoutSeasonName) {
                        await sofResult.remove();
                }
                console.log("SofResults without season_name removed successfully");
        } catch (error) {
                console.error("Error finding SofResults without season_name:", error);
        }
}

// console log all member career stats without a display_name
async function logMembersWithoutDisplayName() {
        try {
                const membersWithoutDisplayName = await MemberCareerStats.find({ display_name: { $exists: false } });

                // Log the members
                console.log("Members without display_name:", membersWithoutDisplayName);
                // delete them
                for (const member of membersWithoutDisplayName) {
                        await member.remove();
                }
        } catch (error) {
                console.error("Error logging members without display_name:", error);
        }
}
