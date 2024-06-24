const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
const SessionResultsFull = require("../models/SessionResultsFull");

getAuth();

async function getAuth() {
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
                // setTimeout(async () => await starter(), 3000);
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

router.get("/", (req, res) => {
        res.send("This is sessionData page!");
});

// http://localhost:3100/api/sessionData/results/66137575

router.get("/results/:subsession_id", async (req, res) => {
        const subsession_id = req.params.subsession_id;

        // Check if at least one field and category is provided
        if (!subsession_id) {
                return res.status(400).send("subsession_id is required.");
        }

        try {
                const sessionResultsFull = await SessionResultsFull.findOne({
                        subsession_id: subsession_id,
                });

                if (!sessionResultsFull) {
                        return res.status(404).send("No session results found for the given subsession_id.");
                }

                return res.json(sessionResultsFull);
        } catch (error) {
                if (error.kind == "Number") {
                        console.log("***race results undefined hit***");
                        return res.status(404).send("No subsession ID found.");
                }
                console.error(error);
                return res.status(500).send("Server Error.");
        }
});

// http://localhost:3100/api/sessionData/resultsrecent

router.get("/resultsrecent", async (req, res) => {
        // query how many to limit to
        const limit = req.query.limit;
        try {
                const sessionResultsFull = await SessionResultsFull.find().sort({ start_time: -1 }).limit(limit);
                if (!sessionResultsFull) {
                        return res.status(404).send("No session results found.");
                }

                // for each session results full, return only the season name, event_strength_of_field, and start_time

                var sessionResultsFullTrimmed = [];

                sessionResultsFull.forEach((session) => {
                        var sessionResultsFullTrimmedItem = {
                                season_name: session.season_name,
                                event_strength_of_field: session.event_strength_of_field,
                                start_time: session.start_time,
                                subsession_id: session.subsession_id,
                        };
                        // limit to only official races
                        if (session.results[2] && session.results[2].results.length > 7) {
                                sessionResultsFullTrimmed.push(sessionResultsFullTrimmedItem);
                        }
                });

                return res.json(sessionResultsFullTrimmed);
        } catch (error) {
                console.error(error);
                return res.status(500).send("Server Error.");
        }
});

module.exports = router;
