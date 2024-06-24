const express = require("express");
const router = express.Router();
const MemberCareerStats = require("../models/MemberCareerStats");
const UnscannedCustId = require("../models/UnscannedCustId");
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

getAuth();

async function getAuth() {
        console.log(process.env.IR_USERNAME);
        console.log("getting auth, series safety calc");
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
        console.log("starting");
        pullAndSaveCareerStats();
}

async function pullAndSaveCareerStats() {
        try {
                // Generate 200 random cust_ids between 100000 and 999999
                let unscannedIds = generateRandomCustIds(300, 20000, 999999);

                // Loop over each cust_id
                for (let cust_id of unscannedIds) {
                        try {
                                // Call createMemberCareerStats with the cust_id
                                let memberCareerStats = await createMemberCareerStats(cust_id);

                                // Log the result (optional)
                                console.log(memberCareerStats.display_name, "/////", memberCareerStats.club_name, "/////", memberCareerStats.sports_car.iRating.value);
                        } catch (error) {
                                console.error(`Error while creating MemberCareerStats for cust_id ${cust_id}: ${error}`);
                                continue; // Skip to the next iteration if an error occurred
                        }
                }
                console.log("All cust_ids processed. Exiting in 10 seconds...");
                setTimeout(() => {
                        process.exit(0);
                }, 10000);
        } catch (error) {
                console.error(`Error while processing cust_ids: ${error}`);
        }
}

function generateRandomCustIds(num, min, max) {
        let ids = new Set();
        while (ids.size < num) {
                let randomId = Math.floor(Math.random() * (max - min + 1) + min);
                ids.add(randomId);
        }
        return Array.from(ids);
}

async function createMemberCareerStats(cust_id) {
        const memberInfo = await getMemberNameAndInfo(cust_id);

        if (!memberInfo || !memberInfo.display_name) {
                console.log(`Member with cust_id ${cust_id} does not have a valid display name.`);
                return null; // Exit the function if there's no valid display name
        }

        const memberCareer = await getMemberCareer(cust_id);

        let newMemberCareerStats = new MemberCareerStats({
                cust_id: cust_id,
                display_name: memberInfo.display_name,
                last_login: memberInfo.last_login,
                member_since: memberInfo.member_since,
                club_id: memberInfo.club_id,
                club_name: memberInfo.club_name,
        });

        const statsMap = {
                Road: { category: "road", id: 2 },
                Oval: { category: "oval", id: 1 },
                "Dirt Road": { category: "dirt_road", id: 4 },
                "Dirt Oval": { category: "dirt_oval", id: 3 },
                "Sports Car": { category: "sports_car", id: 5 }, // new
                "Formula Car": { category: "formula_car", id: 6 }, // new
        };

        for (let stat of memberCareer.stats) {
                let { category, id } = statsMap[stat.category];
                const iRatingData = (await getiRatingData(cust_id, id)) || { when: "", value: 0 };

                newMemberCareerStats[category] = {
                        iRating: iRatingData,
                        starts: stat.starts,
                        wins: stat.wins,
                        top5: stat.top5,
                        poles: stat.poles,
                        avg_start_position: stat.avg_start_position,
                        avg_finish_position: stat.avg_finish_position,
                        laps: stat.laps,
                        laps_led: stat.laps_led,
                        avg_incidents: stat.avg_incidents,
                        avg_points: stat.avg_points,
                        win_percentage: stat.win_percentage,
                        top5_percentage: stat.top5_percentage,
                        laps_led_percentage: stat.laps_led_percentage,
                        total_club_points: stat.total_club_points,
                };
        }

        // Convert the Mongoose document to a plain object
        let plainObject = newMemberCareerStats.toObject();

        // Remove the '_id' property from the plain object, so that Mongoose will use the _id of the existing document when replacing
        delete plainObject._id;

        await MemberCareerStats.findOneAndReplace({ cust_id: cust_id }, plainObject, { upsert: true });
        console.log(`MemberCareerStats for ${cust_id} created or updated successfully!`);
        return newMemberCareerStats;
}

//return member Info (demographics)
async function getMemberNameAndInfo(cust_id) {
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
                                return resultsBody.members[0];
                        }
                }
                return "Member not found?";
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return "Lookup Error";
        }
}

// return member career stats
async function getMemberCareer(memId) {
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

                        if (resultsBody.cust_id) {
                                return resultsBody;
                        }
                }
                return "Member not found?";
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return "Lookup Error";
        }
}

async function getiRatingData(cust_id, category_id) {
        let url = `https://members-ng.iracing.com/data/member/chart_data?cust_id=${cust_id}&category_id=${category_id}&chart_type=1`;

        try {
                let accessReply = await fetch(url, {
                        method: "get",
                        headers: { Accept: "application/json", cookie: loginCookies },
                        cache: "no-store",
                });

                var replyBody = await accessReply.json();
                var statusCode = await accessReply.status;

                if (replyBody.link != null) {
                        console.log(accessReply.headers.get("x-ratelimit-remaining"));
                        var resultLink = replyBody.link;

                        const amazonReply = await fetch(resultLink, {
                                method: "get",
                                headers: { Accept: "application/json" },
                                cache: "no-store",
                        });
                        var resultsBody = await amazonReply.json();
                        var amazonStatus = await amazonReply.status;
                        return resultsBody.data[resultsBody.data.length - 1];
                }
                return "Member not found?";
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return "Lookup Error";
        }
}
