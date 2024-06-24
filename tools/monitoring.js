const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionResult = require("../models/SessionResults");
const MemberCareerStats = require("../models/MemberCareerStats");
const SessionResultFull = require("../models/SessionResultsFull");
const mongoose = require("mongoose");
const SofResults = require("../models/SofResults");
const TimeByCar = require("../models/TimesByCar");

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
        // getSeriesNamesAndSeasonIdsFromDb();
        // getSessionResults(67650187);
        // logMostRecentStartTimes();
        // checkSeasons();
        // getSeriesNamesFromDb();
        // checkSeasonsForMulticlass();
        // getSeasonIdBySubsessionId(69363432);
        // getSeriesNamesFromNewSofResults();
        // logFirstSessionResultFull();
        // logFirstSessionResults();
        // getiRatingLinkData(393396);
        // testMemCareer(393396);
        // memberInfoLookup(393396);
        // checkForCorruprtCareerStats();
        // checkSofResultsTrackNames();
        // logSeasonNamesFromSofResults();
        // getSeriesNamesAndSeasonIdsFromSofResults();
        // logTrackNamesFromSofResults();
        // logTimesByCar();
        // getSeriesNamesAndSeasonIdsFromDb();
        // checkMemberCareerStatsFirstNames();
        // logSofResult(67555486);
        getSeriesNamesFromResults();
}

async function getiRatingLinkData(cust_id) {
        // let url =
        //   "https://members-ng.iracing.com/data/member/chart_data?cust_id=" +
        //   cust_id +
        //   "&category_id=2" +
        //   "&chart_type=1";
        let url = "https://members-ng.iracing.com/data/stats/member_career?cust_ids=" + cust_id;

        let accessReply = await fetch(url, {
                method: "get",
                headers: { Accept: "application/json", cookie: loginCookies },
                cache: "no-store",
        });

        var replyBody = await accessReply;
        var statusCode = await accessReply.status;

        console.log("Status code: " + statusCode);
        console.log(replyBody);
}

//console log the first sessionresultfull
async function logFirstSessionResultFull() {
        const sessionResults = await SessionResultFull.find({}).limit(1);
        console.log(sessionResults[0]);
}

// log all times by car season names
async function logTimesByCar() {
        const timesByCar = await TimeByCar.find({}).distinct("season_name");
        console.log(timesByCar);
}

const util = require("util");
const SessionResultsFull = require("../models/SessionResultsFull");
// Adjust these options as needed
util.inspect.defaultOptions.maxArrayLength = null; // Show all array elements
util.inspect.defaultOptions.depth = null; // Recursively print nested objects

// console log all season names in sof results
async function logSeasonNamesFromSofResults() {
        const seasonNames = await SofResults.find({}).distinct("season_name");
        console.log(seasonNames);
}

// console log all track names in sof results
async function logTrackNamesFromSofResults() {
        const trackNames = await SofResults.find({}).distinct("track_name");
        console.log(trackNames);
}

//console log the names of all of the series saved in db and their season IDs
async function getSeriesNamesFromResults() {
        const seriesData = await SessionResultsFull.aggregate([
                {
                        $group: {
                                _id: {
                                        season_name: "$season_name",
                                },
                        },
                },
        ]);

        seriesData.forEach((series) => {
                console.log(`"${series._id.season_name}",`);
        });
}

//console log the names of all of the series saved in db and their season IDs
async function getSeriesNamesAndSeasonIdsFromDb() {
        const seriesData = await SessionResultsFull.aggregate([
                {
                        $group: {
                                _id: {
                                        season_name: "$season_name",
                                        season_id: "$season_id",
                                },
                        },
                },
        ]);

        seriesData.forEach((series) => {
                console.log(`Series Name: ${series._id.season_name}, Season ID: ${series._id.season_id}`);
        });
}

// console log the series names and season IDs of all of the sof results in sofresults
async function getSeriesNamesAndSeasonIdsFromSofResults() {
        const seriesData = await SofResults.aggregate([
                {
                        $group: {
                                _id: {
                                        season_name: "$season_name",
                                        season_id: "$season_id",
                                },
                        },
                },
        ]);

        seriesData.forEach((series) => {
                console.log(`Series Name: ${series._id.season_name}, Season ID: ${series._id.season_id}`);
        });
}

// check for all of the different track names in sof results
async function checkSofResultsTrackNames() {
        const sofResults = await SofResults.find({});
        const trackNames = [];
        sofResults.forEach((result) => {
                trackNames.push(result.track_name);
        });

        const uniqueTrackNames = [...new Set(trackNames)];
        console.log(uniqueTrackNames);
}

// check for season id that return data
async function checkSeasons() {
        const startSeasonID = 4500;
        const endSeasonID = 10000;
        // last season ID: 4224

        for (let seasonID = startSeasonID; seasonID <= endSeasonID; seasonID++) {
                const { result, rateLimitRemaining } = await getSeasonInfo(seasonID);

                console.log(rateLimitRemaining);

                if (rateLimitRemaining <= 10) {
                        console.log("Nearing rate limit, pausing for 60 seconds...");
                        await new Promise((resolve) => setTimeout(resolve, 60000));
                }

                if (result === "season not found?" || result === "Lookup Error") {
                        console.log(`Stopped searching at season ID ${seasonID}`);
                        break;
                } else {
                        console.log(result.results_list[0]);
                        console.log(`season ${seasonID} good`);
                }
        }
}

// get the names of all of the series in sof results in db as well as their season IDs. log them in order of season ID
async function getSeriesNamesFromNewSofResults() {
        const seriesData = await SofResults.aggregate([
                {
                        $group: {
                                _id: {
                                        season_name: "$season_name",
                                        season_id: "$season_id",
                                },
                        },
                },
                {
                        $sort: { "_id.season_id": 1 },
                },
        ]);

        seriesData.forEach((series) => {
                console.log(`Series Name: ${series._id.season_name}, Season ID: ${series._id.season_id}`);
        });
}

async function checkForCorruprtCareerStats() {
        // look for memberCareerStats in the db that do not have Road.iRating.value or Oval.iRating.value
        const corruptCareerStats = await MemberCareerStats.find({
                $or: [{ "road.iRating.value": null }, { "oval.iRating.value": null }],
        });

        console.log(corruptCareerStats);
        // log how many of them thre are
        console.log(`Found ${corruptCareerStats.length} corrupt career stats`);

        // if found, delete them (working)
        // if (corruptCareerStats.length > 0) {
        //         console.log("deleting corrupt career stats");
        //         await MemberCareerStats.deleteMany({
        //                 $or: [{ "road.iRating.value": null }, { "oval.iRating.value": null }],
        //         });
        // }
}

// check all MemberCareerStats and list the most common display_name first names for each club_name
async function checkMemberCareerStatsFirstNames() {
        const memberCareerStats = await MemberCareerStats.find({});

        const firstNamesByClub = {};

        memberCareerStats.forEach((member) => {
                const clubName = member.club_name;
                const displayName = member.display_name;
                const firstName = displayName.split(" ")[0];

                if (!firstNamesByClub[clubName]) {
                        firstNamesByClub[clubName] = {};
                }

                if (!firstNamesByClub[clubName][firstName]) {
                        firstNamesByClub[clubName][firstName] = 1;
                } else {
                        firstNamesByClub[clubName][firstName]++;
                }
        });

        console.log(firstNamesByClub);
}

// check for a specific series ids. doesn't work
async function checkSeasonsForMulticlass() {
        const startSeasonID = 4180;
        const endSeasonID = 10000;

        for (let seasonID = startSeasonID; seasonID <= endSeasonID; seasonID++) {
                const { result, rateLimitRemaining } = await getSeasonInfo(seasonID);

                console.log(rateLimitRemaining);

                if (rateLimitRemaining <= 10) {
                        console.log("Nearing rate limit, pausing for 60 seconds...");
                        await new Promise((resolve) => setTimeout(resolve, 60000));
                }

                if (result === "season not found?" || result === "Lookup Error") {
                        console.log(`no data for ${seasonID}`);
                        // break;
                } else {
                        console.log(result);
                        // Check if the season_name contains "VRS" or "GT3"
                        if (result.season_name && (result.season_name.includes("GT4") || result.season_name.includes("GT3"))) {
                                console.log(`**************Found matching season: ID: ${seasonID}, Name: ${result.season_name}`);
                        } else {
                                console.log(`not ${seasonID}`);
                        }
                }
        }
}

// return raw season stats for a given season ID
async function getSeasonInfo(seasonID) {
        if (seasonID > 10000) {
                console.log("Reached maximum season ID.");
                return { result: null, rateLimitRemaining: 0 };
        }

        var url = "https://members-ng.iracing.com/data/results/season_results?season_id=" + seasonID + "&event_type=5";

        try {
                var accessReply = await fetch(url, {
                        method: "get",
                        headers: { Accept: "application/json", cookie: loginCookies },
                        cache: "no-store",
                });

                var replyBody = await accessReply.json();
                var rateLimitRemaining = parseInt(accessReply.headers.get("x-ratelimit-remaining"));

                if (replyBody.link != null) {
                        var resultLink = replyBody.link;

                        const amazonReply = await fetch(resultLink, {
                                method: "get",
                                headers: { Accept: "application/json" },
                                cache: "no-store",
                        });
                        var seasonInfoBody = await amazonReply.json();

                        return { result: seasonInfoBody, rateLimitRemaining };
                } else {
                        console.log("season not found?");
                        return { result: "season not found?", rateLimitRemaining };
                }
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return { result: "Lookup Error", rateLimitRemaining: 0 };
        }
}

async function getMostRecentStartTimeForSeasons() {
        const mostRecentStartTimes = await SessionResult.aggregate([
                {
                        $group: {
                                _id: "$season_name",
                                most_recent_start_time: { $max: "$start_time" },
                        },
                },
                {
                        $sort: { most_recent_start_time: -1 },
                },
        ]);

        return mostRecentStartTimes;
}

async function logMostRecentStartTimes() {
        const mostRecentStartTimes = await getMostRecentStartTimeForSeasons();

        mostRecentStartTimes.forEach((season) => {
                console.log(`Season Name: ${season._id}, Most Recent Start Time: ${season.most_recent_start_time}`);
        });
}

async function getSeasonIdBySubsessionId(subsessionId) {
        try {
                const subsessionObj = await getSessionResults(subsessionId);
                const seasonId = subsessionObj.result.season_id;
                console.log(`Season ID for subsession ID ${subsessionId} is ${seasonId}`);
                return seasonId;
        } catch (error) {
                console.error("Error fetching season ID for subsession ID:", subsessionId);
                console.error(error.message);
                console.error(error.stack);
                return null;
        }
}

// get and return subsession results
async function getSessionResults(subsession_id) {
        let url = "https://members-ng.iracing.com/data/results/get?subsession_id=" + subsession_id;
        try {
                var accessReply = await fetch(url, {
                        method: "get",
                        headers: { Accept: "application/json", cookie: loginCookies },
                        cache: "no-store",
                });

                var replyBody = await accessReply.json();
                var rateLimitRemaining = parseInt(accessReply.headers.get("x-ratelimit-remaining"));

                if (replyBody.link != null) {
                        var resultLink = replyBody.link;

                        const amazonReply = await fetch(resultLink, {
                                method: "get",
                                headers: { Accept: "application/json" },
                                cache: "no-store",
                        });
                        var sessionInfoBody = await amazonReply.json();
                        console.log(sessionInfoBody);

                        return { result: sessionInfoBody, rateLimitRemaining };
                } else {
                        console.log("session not found?");
                        return { result: "session not found?", rateLimitRemaining };
                }
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return { result: "Lookup Error", rateLimitRemaining: 0 };
        }
}

// console log the first session results
async function logFirstSessionResults() {
        const sessionResults = await SessionResult.find({}).limit(1);
        console.log(sessionResults[0].results);
}

// log a sof result of a given subsession ID
async function logSofResult(subsessionId) {
        const sofResult = await SofResults.findOne({ subsession_id: subsessionId });
        console.log(sofResult);
}

//console log the names of all of the series saved in db
async function getSeriesNamesFromDb() {
        const seriesNames = await SessionResult.find({}).distinct("season_name");
        console.log(seriesNames);
}

// look up member career stats and send to pushMemberYearly
async function testMemCareer(memId) {
        let url = "https://members-ng.iracing.com/data/stats/member_career?cust_id=" + memId.toString();

        try {
                let accessReply = await fetch(url, {
                        method: "get",
                        headers: { Accept: "application/json", cookie: loginCookies },
                        cache: "no-store",
                });

                var replyBody = await accessReply.json();
                var statusCode = await accessReply.status;

                if (replyBody.link != null) {
                        var resultLink = replyBody.link;

                        const amazonReply = await fetch(resultLink, {
                                method: "get",
                                headers: { Accept: "application/json" },
                                cache: "no-store",
                        });
                        var resultsBody = await amazonReply.json();
                        var amazonStatus = await amazonReply.status;

                        console.log(resultsBody);
                }
                return "Member not found?";
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return "Lookup Error";
        }
}

async function memberInfoLookup(cust_id) {
        console.log("memberInfoLookup");
        let url = "https://members-ng.iracing.com/data/member/get?cust_ids=" + cust_id;

        try {
                let accessReply = await fetch(url, {
                        method: "get",
                        headers: { Accept: "application/json", cookie: loginCookies },
                        cache: "no-store",
                });

                var replyBody = await accessReply.json();
                var statusCode = await accessReply.status;
                console.log(accessReply.headers.get("x-ratelimit-remaining"));

                if (replyBody.link != null) {
                        var resultLink = replyBody.link;

                        const amazonReply = await fetch(resultLink, {
                                method: "get",
                                headers: { Accept: "application/json" },
                                cache: "no-store",
                        });
                        var resultsBody = await amazonReply.json();
                        var amazonStatus = await amazonReply.status;

                        if (resultsBody.members[0].cust_id) {
                                // display_name
                                console.log(resultsBody.members[0].display_name);
                        }
                }
                return "Member not found?";
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return "Lookup Error";
        }
}
