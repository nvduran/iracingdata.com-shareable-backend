const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionResult = require("../models/SessionResults");
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

async function starter() {
        console.log("starter");
        freshsession = false;
        // setTimeout(async () => await getAuth(), 900000);

        const seasonPromises = [
                SeasonToSessionsSaved(4894),
                SeasonToSessionsSaved(4895),
                SeasonToSessionsSaved(4880),
                SeasonToSessionsSaved(4881),
                SeasonToSessionsSaved(4900),
                SeasonToSessionsSaved(4901),
                SeasonToSessionsSaved(4878),
                SeasonToSessionsSaved(4879),
                SeasonToSessionsSaved(4892),
                SeasonToSessionsSaved(4869),
        ];
        // vrs = 4894
        // gt3 fixed = 4895
        // gt4 fixed = 4880
        // sports car challenge = 4881
        // IMSA = 4900
        // IMSA fixed = 4901
        // IMSA endurance =
        // TCR fixed = 4878
        // TCR open = 4879
        // GT = 4892
        // PCC = 4869

        //CHANGE THESE SEASON IDS TO THE ONES YOU WANT TO UPDATE

        await Promise.all(seasonPromises);

        console.log("******* session updater multiclass done *************");
        // add a 5 second delay before exit
        setTimeout(() => process.exit(0), 5000);
}

// return raw season stats for a given season ID
async function getSeasonInfo(seasonID) {
        if (seasonID > 10000) {
                // console.log("Reached maximum season ID.");
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
        var resultsObj = new SessionResult({
                subsession_id: subsessionObj.subsession_id,
                season_id: subsessionObj.season_id,
                season_name: subsessionObj.season_name,
                simsession_type_name: subsessionObj.simsession_type_name,
                session_id: subsessionObj.session_id,
                corners_per_lap: subsessionObj.corners_per_lap,
                start_time: subsessionObj.start_time,
                end_time: subsessionObj.end_time,
                points_type: subsessionObj.points_type,
                event_strength_of_field: subsessionObj.event_strength_of_field,
                event_average_lap: subsessionObj.event_average_lap,
                event_laps_complete: subsessionObj.event_laps_complete,
                num_cautions: subsessionObj.num_cautions,
                num_caution_laps: subsessionObj.num_caution_laps,
                num_lead_changes: subsessionObj.num_lead_changes,
                results: subsessionObj.session_results,
                track_name: subsessionObj.track.track_name,
        });

        // save result to db
        if (subsessionObj) {
                try {
                        await resultsObj.save();
                        // console.log("Saved to DB " + resultsObj.season_name + " " + resultsObj.season_id);
                        return true; // Returns true when the save is successful.
                } catch (err) {
                        if (err.code === 11000) {
                                // console.log("Duplicate subsession_id detected. Skipping...");
                                return false; // Returns false when a duplicate is found.
                        } else {
                                console.log(err);
                        }
                }
        }
}

//go from season id to saving subsession results
async function SeasonToSessionsSaved(seasonID) {
        const arrayOfSubSessions = await getSubSessionsFromSeason(seasonID);
        // console.log(arrayOfSubSessions);
        // sort array of subsessions highest to lowest
        arrayOfSubSessions.sort((a, b) => b - a);

        for (let i = 0; i < arrayOfSubSessions.length; i++) {
                try {
                        const subsessionObj = await getSessionResults(arrayOfSubSessions[i]);
                        // NOTE: TRIMMING DOWN TO RESULT BEFORE SENDING
                        const saveResult = await saveSessionToDB(subsessionObj.result); // saveSessionToDB now returns a boolean.
                        // log rate limit remaining
                        console.log(subsessionObj.rateLimitRemaining);
                        // log how many sessions are left
                        console.log(arrayOfSubSessions.length - i + " remaining");
                        // pause if nearing rate limit
                        if (subsessionObj.rateLimitRemaining <= 40) {
                                console.log("Nearing rate limit, pausing for 60 seconds...");
                                await new Promise((resolve) => setTimeout(resolve, 60000));
                        }
                        if (!saveResult) {
                                // If saveSessionToDB returned false, break the loop.
                                // console.log("Duplicate found, stopping search for this season.");
                                break;
                        }
                } catch (error) {
                        console.error(`Error processing subsession ${arrayOfSubSessions[i]}: ${error.message}`);
                }
        }
}
