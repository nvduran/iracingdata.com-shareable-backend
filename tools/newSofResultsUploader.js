const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionResult = require("../models/SessionResults");
const SofResult = require("../models/SofResults");
const mongoose = require("mongoose");
let freshsession = true;
const moment = require("moment");

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

                        return cookiePart;
                })
                .join(";");
}

async function starter() {
        console.log("starter");
        freshsession = false;

        // getAuth after 15 minutes
        // setTimeout(async () => await getAuth(), 900000);

        const seasons = [];
        for (let i = 4860; i <= 5030; i++) {
                seasons.push(i);
        }
        let currentSeasonIndex = 0;

        await processSeason(seasons[currentSeasonIndex]);

        async function processSeason(seasonId) {
                try {
                        await SeasonToSessionsSaved(seasonId);
                        currentSeasonIndex++;
                        if (currentSeasonIndex < seasons.length) {
                                await processSeason(seasons[currentSeasonIndex]);
                        } else {
                                console.log("All seasons processed. Exiting...");
                                process.exit();
                        }
                } catch (err) {
                        // console.error(err);
                        console.log(`Error encountered in season ${seasons[currentSeasonIndex]}: ${err.message}`);
                        currentSeasonIndex++;
                        if (currentSeasonIndex < seasons.length) {
                                await processSeason(seasons[currentSeasonIndex]);
                        } else {
                                console.log("All seasons processed. Exiting...");
                                process.exit();
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

                // If the HTTP status is not 200, throw an error
                if (!accessReply.ok) {
                        throw new Error(`HTTP error! status: ${accessReply.status}`);
                }

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

// Function to get the most recent Tuesday
function getMostRecentTuesday() {
        const today = moment().utc();
        const dayOfWeek = today.day();
        const daysSinceTuesday = (dayOfWeek + 5) % 7; // Adjust the offset to correctly calculate the difference
        return today.subtract(daysSinceTuesday, "days").startOf("day").toISOString();
}

// take a subsession id and save all of its results to mongoDB
async function saveSessionToDB(subsessionObj) {
        console.log(subsessionObj.start_time + " " + subsessionObj.season_name);

        const mostRecentTuesday = getMostRecentTuesday();

        console.log("Most recent Tuesday: " + mostRecentTuesday);

        //  ADJUST WEEK DATE HERE $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
        //  ADJUST WEEK DATE HERE $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
        if (moment(subsessionObj.start_time).isBefore(mostRecentTuesday)) {
                throw new Error("start_time too early");
        }
        //  ADJUST WEEK DATE HERE $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
        //  ADJUST WEEK DATE HERE $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

        // CREATE OBNJ TO SAVE TO
        var resultsObj = new SofResult({
                subsession_id: subsessionObj.subsession_id,
                season_id: subsessionObj.season_id,
                season_name: subsessionObj.season_name,
                simsession_type_name: subsessionObj.simsession_type_name,
                session_id: subsessionObj.session_id,
                corners_per_lap: subsessionObj.corners_per_lap,
                race_week_num: subsessionObj.race_week_num,
                start_time: subsessionObj.start_time,
                end_time: subsessionObj.end_time,
                points_type: subsessionObj.points_type,
                event_strength_of_field: subsessionObj.event_strength_of_field,
                event_average_lap: subsessionObj.event_average_lap,
                event_laps_complete: subsessionObj.event_laps_complete,
                num_cautions: subsessionObj.num_cautions,
                num_caution_laps: subsessionObj.num_caution_laps,
                num_lead_changes: subsessionObj.num_lead_changes,
                track_name: subsessionObj.track.track_name,
                field_strength: subsessionObj.race_summary.field_strength,
                population: subsessionObj.session_results[2] ? subsessionObj.session_results[2].results.length : subsessionObj.session_results[1].results.length,
                precip_time_pct: subsessionObj.weather.precip_time_pct,
        });

        // save result to db
        if (subsessionObj) {
                try {
                        await resultsObj.save();
                        console.log("Session Result saved to DB " + resultsObj.season_name + " " + resultsObj.season_id + "-pop: " + resultsObj.population);
                } catch (err) {
                        if (err.code === 11000) {
                                console.log("Duplicate subsession_id detected. Skipping...");
                                throw err;
                        } else {
                                console.log(err);
                        }
                }
        }
}

// go from season id to saving subsession results
async function SeasonToSessionsSaved(seasonID) {
        const arrayOfSubSessions = await getSubSessionsFromSeason(seasonID);
        console.log(arrayOfSubSessions.length + " sessions found in season " + seasonID);
        // sort array of subsessions highest to lowest
        arrayOfSubSessions.sort((a, b) => b - a);

        for (let i = 0; i < arrayOfSubSessions.length; i++) {
                try {
                        const subsessionObj = await getSessionResults(arrayOfSubSessions[i]);
                        // If the result is "Lookup Error", skip to the next session
                        if (subsessionObj.result === "Lookup Error") {
                                console.log(`Skipping session ${arrayOfSubSessions[i]} due to lookup error.`);
                                continue;
                        }
                        // NOTE: TRIMMING DOWN TO RESULT BEFORE SENDING
                        await saveSessionToDB(subsessionObj.result);
                        console.log(subsessionObj.result.weather);
                        // log rate limit remaining
                        console.log(subsessionObj.rateLimitRemaining);
                        // pause if nearing rate limit
                        if (subsessionObj.rateLimitRemaining <= 40) {
                                console.log("Nearing rate limit, pausing for 60 seconds...");
                                await new Promise((resolve) => setTimeout(resolve, 60000));
                        }
                } catch (error) {
                        console.error(error.message);
                        // re-throw the error
                        throw error;
                }
        }
}
