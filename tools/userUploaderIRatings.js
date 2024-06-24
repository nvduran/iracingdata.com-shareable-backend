const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
var loginCookies = "";
var CryptoJS = require("crypto-js");
require("dotenv").config({ path: "../.env" });
const SessionResult = require("../models/SessionResults");
const MemberInfo = require("../models/MemberInfo");
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
        freshsession = false;
        console.log("starter");
        // setTimeout(async () => await getAuth(), 900000);
        // memberInfoLookup(393396);
        // getiRatingLinkData(393396);
        // loopAndSaveData();
        loopAndSaveDataRandom();
        // AddOvaliRatings();
}

// look up member info (name)
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
                                // console.log(resultsBody);
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

// get iRating link data
async function getiRatingLinkData(cust_id) {
        //category:  "1 - Oval; 2 - Road; 3 - Dirt oval; 4 - Dirt road"
        // chart: "1 - iRating; 2 - TT Rating; 3 - License/SR"
        let url = "https://members-ng.iracing.com/data/member/chart_data?cust_id=" + cust_id + "&category_id=2" + "&chart_type=1";

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

                        // this is the latest iRating value
                        console.log(resultsBody.data[resultsBody.data.length - 1]);
                        return resultsBody.data[resultsBody.data.length - 1];
                }
                return "Member not found?";
        } catch (error) {
                console.error(error.message);
                console.error(error.stack);
                return "Lookup Error";
        }
}

// save random users iratings
async function loopAndSaveDataRandom() {
        const num_iterations = 10000;
        const min_cust_id = 100000;
        const max_cust_id = 900000;

        for (let i = 0; i < num_iterations; i++) {
                try {
                        let cust_id = Math.floor(Math.random() * (max_cust_id - min_cust_id + 1) + min_cust_id);

                        const memberInfo = await memberInfoLookup(cust_id);
                        const iRatingRoadData = await getiRatingLinkData(cust_id);

                        let memberData = {
                                cust_id: String(cust_id),
                                display_name: memberInfo.display_name,
                                last_login: memberInfo.last_login,
                                member_since: memberInfo.member_since,
                                club_id: memberInfo.club_id,
                                club_name: memberInfo.club_name,
                        };

                        if (iRatingRoadData.value && iRatingRoadData.value != 1350) {
                                memberData.iRating = {
                                        when: iRatingRoadData.when,
                                        value: iRatingRoadData.value,
                                        category: "Road",
                                };
                        }

                        let url = "https://members-ng.iracing.com/data/member/chart_data?cust_id=" + cust_id + "&category_id=1" + "&chart_type=1";

                        let accessReply = await fetch(url, {
                                method: "get",
                                headers: { Accept: "application/json", cookie: loginCookies },
                                cache: "no-store",
                        });

                        var replyBody = await accessReply.json();

                        if (replyBody.link != null) {
                                var resultLink = replyBody.link;

                                const amazonReply = await fetch(resultLink, {
                                        method: "get",
                                        headers: { Accept: "application/json" },
                                        cache: "no-store",
                                });

                                var iRatingOvalData = await amazonReply.json();
                                iRatingOvalData = iRatingOvalData.data[iRatingOvalData.data.length - 1];

                                if (iRatingOvalData.value && iRatingOvalData.value != 1350) {
                                        memberData.iRatingOval = {
                                                when: iRatingOvalData.when,
                                                value: iRatingOvalData.value,
                                                category: "Oval",
                                        };
                                }

                                const member = new MemberInfo(memberData);

                                await member.save((err) => {
                                        if (err) {
                                                console.log("Error saving data to the database:", err);
                                        } else {
                                                console.log("Data saved successfully");
                                                console.log(member);
                                        }
                                });
                        }
                } catch (error) {
                        console.error(`Error processing cust_id ${cust_id}:`, error.message);
                }
        }
}

async function AddOvaliRatings() {
        // Fetch all existing Member Info documents
        const members = await MemberInfo.find({});

        for (let member of members) {
                try {
                        // If member already has an Oval iRating, skip to the next member
                        if (member.iRatingOval && member.iRatingOval.value) {
                                console.log(`Skipping cust_id ${member.cust_id} due to existing Oval iRating.`);
                                continue;
                        }

                        // Fetch the Oval iRating data
                        let url = "https://members-ng.iracing.com/data/member/chart_data?cust_id=" + member.cust_id + "&category_id=1" + "&chart_type=1";

                        let accessReply = await fetch(url, {
                                method: "get",
                                headers: { Accept: "application/json", cookie: loginCookies },
                                cache: "no-store",
                        });

                        var replyBody = await accessReply.json();

                        if (replyBody.link != null) {
                                var resultLink = replyBody.link;

                                const amazonReply = await fetch(resultLink, {
                                        method: "get",
                                        headers: { Accept: "application/json" },
                                        cache: "no-store",
                                });
                                var resultsBody = await amazonReply.json();

                                // This is the latest iRating value for the Oval category
                                let iRatingOval = resultsBody.data[resultsBody.data.length - 1];

                                // Skip saving if iRatingOval is 1350
                                if (iRatingOval && iRatingOval.value == 1350) {
                                        console.log(`Skipping cust_id ${member.cust_id} due to Oval iRating of 1350.`);
                                        continue;
                                }

                                // Update the iRatingOval field for the member
                                member.iRatingOval = {
                                        when: iRatingOval.when,
                                        value: iRatingOval.value,
                                        category: "Oval",
                                };

                                // Save the changes
                                await member.save((err) => {
                                        if (err) {
                                                console.log("Error saving Oval iRating to the database:", err);
                                        } else {
                                                console.log("Oval iRating saved successfully for cust_id:", member.cust_id);
                                        }
                                });
                        }
                } catch (error) {
                        console.error(`Error processing cust_id ${member.cust_id}:`, error.message);
                }
        }
}
