const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionPopInfo = require("../models/SessionPopInfo");
const mongoose = require("mongoose");
let freshsession = true;

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
        if (statusCode == 200 && freshsession) {
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
        freshsession = false;
        // getAuth after 15 minutes
        // setTimeout(async () => await getAuth(), 900000);
        // SeasonToSessionsSaved(4137);
        // vrs = 4174, gt3 fixed = 4173, gt4 fixed = 4128, gt4 open = 4129, IMSA = 4171, fefe = 4132
        getSessionsForMultipleSeasons();
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

// getSeasonInfo and return an array of the subsession IDs
async function getSubSessionsFromSeason(seasonID) {
        let arrayOfSubSessions = [];
        const seasonObj = await getSeasonInfo(seasonID);
        const seasonData = seasonObj.result.results_list;
        // console.log(seasonData[0]);

        // For each seasonData, add the subsession_id to an array
        for (let i = 0; i < seasonData.length; i++) {
                arrayOfSubSessions.push(seasonData[i].subsession_id);
        }

        // Return arrayOfSubSessions
        // console.log(arrayOfSubSessions);
        return arrayOfSubSessions;
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

//take a subsession id and save all of its results to mongoDB
async function saveSessionToDB(subsessionObj) {
        // CREATE OBNJ TO SAVE TO
        var resultsObj = new SessionPopInfo({
                subsession_id: subsessionObj.subsession_id,
                season_id: subsessionObj.season_id,
                season_name: subsessionObj.season_name,
                simsession_type_name: subsessionObj.simsession_type_name,
                session_id: subsessionObj.session_id,
                corners_per_lap: subsessionObj.corners_per_lap,
                start_time: subsessionObj.start_time,
                population: subsessionObj.session_results[2] ? subsessionObj.session_results[2].results.length : subsessionObj.session_results[1].results.length,
                track_name: subsessionObj.track.track_name,
        });

        // save result to db
        if (subsessionObj) {
                try {
                        await resultsObj.save();
                        console.log(resultsObj);
                        console.log("Saved subsession_id: " + subsessionObj.subsession_id + subsessionObj.season_name + " to DB.");
                } catch (err) {
                        if (err.code === 11000) {
                                console.log("Duplicate subsession_id detected. Skipping...");
                                throw new Error("Duplicate subsession_id");
                        } else {
                                console.log(err);
                        }
                }
        }
}

//go from season id to saving subsession results
async function SeasonToSessionsSaved(seasonID) {
        const arrayOfSubSessions = await getSubSessionsFromSeason(seasonID);
        console.log(arrayOfSubSessions);
        // sort array of subsessions highest to lowest
        arrayOfSubSessions.sort((a, b) => b - a);

        let skipSeason = false;
        for (let i = 0; i < arrayOfSubSessions.length; i++) {
                try {
                        const subsessionObj = await getSessionResults(arrayOfSubSessions[i]);
                        // NOTE: TRIMMING DOWN TO RESULT BEFORE SENDING
                        await saveSessionToDB(subsessionObj.result);
                        // log rate limit remaining
                        console.log(subsessionObj.rateLimitRemaining);
                        // log how many sessions are left
                        console.log(arrayOfSubSessions.length - i + " remaining");
                        // pause if nearing rate limit
                        if (subsessionObj.rateLimitRemaining <= 40) {
                                console.log("Nearing rate limit, pausing for 60 seconds...");
                                await new Promise((resolve) => setTimeout(resolve, 60000));
                        }
                } catch (error) {
                        if (error.message === "Duplicate subsession_id") {
                                console.log(arrayOfSubSessions[i].season_name + " already saved.");
                                console.log(`Duplicate subsession detected, skipping to next season.`);
                                skipSeason = true;
                                break;
                        } else {
                                console.error(`Error processing subsession ${arrayOfSubSessions[i]}: ${error.message}`);
                        }
                }
        }
        return skipSeason;
}

async function getSessionsForMultipleSeasons() {
        for (let seasonID = 4100; seasonID <= 4400; seasonID++) {
                try {
                        const skipSeason = await SeasonToSessionsSaved(seasonID);
                        if (skipSeason) {
                                continue;
                        }
                        console.log(`Completed fetching and saving data for season ${seasonID}`);
                } catch (error) {
                        console.error(`Error processing season ${seasonID}: ${error.message}`);
                }
        }
}
