const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionResult = require("../models/SessionResults");
const TimeByCar = require("../models/TimesByCar");
const LastUpdatedMulti = require("../models/LastUpdatedMulti");
const mongoose = require("mongoose");

let freshsession = true;
let trackNames = new Set();

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

getAuth();

async function getAuth() {
        console.log(process.env.IR_USERNAME);
        console.log("getting auth, sessionData");
        const hash = CryptoJS.SHA256(process.env.IR_PASSWORD + process.env.IR_USERNAME.toLowerCase());
        const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

        const accessReply = await fetch("https://members-ng.iracing.com/auth", {
                method: "POST",
                body: JSON.stringify({
                        email: "nvduran@gmail.com",
                        password: hashInBase64,
                }),
                credentials: "include",
                headers: { Accept: "*/*", "Content-type": "application/json" },
        });

        const statusCode = accessReply.status;
        console.log("Auth status code sessionData: " + statusCode);

        if (statusCode === 200 && freshsession) {
                setTimeout(starter, 3000);
        }
        if (statusCode === 503) {
                // Handle maintenance delay if needed
        }

        loginCookies = parseCookies(accessReply);
        return statusCode;
}

function parseCookies(response) {
        const raw = response.headers.raw()["set-cookie"];
        return raw.map((entry) => entry.split(";")[0]).join(";");
}

const seasons = [
        "GT3 Fanatec Challenge - Fixed - 2024 Season 3 - Fixed",
        "GT Sprint Simucube Series - 2024 Season 3",
        "GT4 Falken Tyre Challenge - 2024 Season 3 Fixed",
        "Falken Tyre Sports Car Challenge - 2024 Season 3",
        "IMSA Endurance Series - 2024 Season 3",
        "IMSA iRacing Series - 2024 Season 3",
        "IMSA iRacing Series - Fixed - 2024 Season 3",
        "TCR Virtual Challenge - 2024 Season 3",
        "TCR Virtual Challenge - Fixed - 2024 Season 3",
        "Production Car Sim-Lab Challenge - 2024 Season 3",
        "Proto-GT Thrustmaster Challenge - 2024 Season 3",
];

async function starter() {
        console.log("starter");

        for (const seasonName of seasons) {
                console.log(`Processing season: ${seasonName}`);

                const raceResultsByTrack = await getAllSessionResultsBySeasonName(seasonName);
                const qualResultsByTrack = await getAllSessionResultsBySeasonNameQUALI(seasonName);

                if (raceResultsByTrack) {
                        for (const trackName in raceResultsByTrack) {
                                trackNames.add(trackName);

                                const raceBestLapTimesByCar = parseResultsByTrack(raceResultsByTrack[trackName].results);
                                const qualBestLapTimesByCar = qualResultsByTrack[trackName] ? parseResultsByTrack(qualResultsByTrack[trackName].results) : {};

                                console.log(`Saving best lap times for track: ${trackName}, season: ${seasonName}`);
                                await saveBestLapTimesToDB(trackName, seasonName, raceBestLapTimesByCar, qualBestLapTimesByCar);
                                await saveLastUpdated();
                        }
                }

                await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay for 2 seconds
        }

        mongoose.connection.close(() => {
                console.log("Mongoose connection disconnected");
                setTimeout(() => {
                        console.log("*** refresh times by car done ******");
                        process.exit(0);
                }, 5000); // 5 seconds delay
        });
}

async function saveLastUpdated() {
        try {
                const currentTimestamp = new Date();
                const existingLastUpdatedMulti = await LastUpdatedMulti.findOne();

                if (existingLastUpdatedMulti) {
                        existingLastUpdatedMulti.last_updated = currentTimestamp;
                        await existingLastUpdatedMulti.save();
                } else {
                        const lastUpdatedMulti = new LastUpdatedMulti({ last_updated: currentTimestamp });
                        await lastUpdatedMulti.save();
                }
        } catch (error) {
                console.error("Error while saving/updating LastUpdatedMulti:", error);
        }
}

async function getAllSessionResultsBySeasonNameQUALI(seasonName) {
        try {
                const results = await SessionResult.find({ season_name: seasonName });
                if (results.length > 0) {
                        const raceResultsByTrack = {};

                        for (const result of results) {
                                const raceResults = result.results.filter((session) => session.simsession_type_name === "Lone Qualifying");
                                if (raceResults.length > 0) {
                                        if (!raceResultsByTrack[result.track_name]) {
                                                raceResultsByTrack[result.track_name] = { track_name: result.track_name, results: [] };
                                        }
                                        raceResultsByTrack[result.track_name].results.push(...raceResults);
                                }
                        }
                        return raceResultsByTrack;
                } else {
                        return null;
                }
        } catch (error) {
                console.error("Error while searching for SessionResults:", error);
                return null;
        }
}

async function getAllSessionResultsBySeasonName(seasonName) {
        try {
                const results = await SessionResult.find({ season_name: seasonName });
                if (results.length > 0) {
                        const raceResultsByTrack = {};

                        for (const result of results) {
                                const raceResults = result.results.filter((session) => session.simsession_type_name === "Race");
                                if (raceResults.length > 0) {
                                        if (!raceResultsByTrack[result.track_name]) {
                                                raceResultsByTrack[result.track_name] = { track_name: result.track_name, results: [] };
                                        }
                                        raceResultsByTrack[result.track_name].results.push(...raceResults);
                                }
                        }
                        return raceResultsByTrack;
                } else {
                        return null;
                }
        } catch (error) {
                console.error("Error while searching for SessionResults:", error);
                return null;
        }
}

function parseResultsByTrack(raceSessions) {
        const bestLapTimesByCar = {};

        for (const raceSession of raceSessions) {
                for (const result of raceSession.results) {
                        const carName = result.car_name;
                        const bestLapTime = result.best_lap_time;

                        if (bestLapTime === -1) {
                                continue; // Skip this iteration if best_lap_time is -1
                        }

                        if (!bestLapTimesByCar[carName]) {
                                bestLapTimesByCar[carName] = [];
                        }

                        bestLapTimesByCar[carName].push(bestLapTime);
                }
        }

        return bestLapTimesByCar;
}

async function saveBestLapTimesToDB(trackName, seasonName, raceBestLapTimesByCar, qualBestLapTimesByCar) {
        for (const carName in raceBestLapTimesByCar) {
                try {
                        const existingTimeByCar = await TimeByCar.findOne({ car_name: carName, track_name: trackName, season_name: seasonName });

                        if (existingTimeByCar) {
                                await TimeByCar.deleteOne({ _id: existingTimeByCar._id });
                        }

                        const timesByCar = new TimeByCar({
                                car_name: carName,
                                track_name: trackName,
                                season_name: seasonName,
                                race_best: raceBestLapTimesByCar[carName],
                                qual_best: qualBestLapTimesByCar[carName] || [], // Provide an empty array if no qual_best times are available
                        });

                        console.log(timesByCar);

                        await timesByCar.save();
                        console.log(`Saved best lap times for car '${carName}' on track '${trackName}' in season '${seasonName}' to the database.`);
                } catch (error) {
                        console.error(`Error while saving best lap times for car '${carName}' on track '${trackName}' in season '${seasonName}':`, error);
                }
        }
}
