const fetch = require("node-fetch"); //this may be outdated with the newest node.js, but plenty of docs exist for including other files
const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const app = express();
var cors = require("cors");
const bodyParser = require("body-parser");
var loginCookies = "";
const sessionData = require("./routes/sessionData");
const timesByCarRoutes = require("./routes/timesByCar");
const iratingDataRoutes = require("./routes/iratingData");
const SeriesPopRoutes = require("./routes/SeriesPop");
const averageIratingPerClubRoutes = require("./routes/averageIratingPerClub");
const sofResultsRoutes = require("./routes/sofResults");
const legacyTimesByCarRoutes = require("./routes/legacyTimesByCar");
const memberCareerStats = require("./routes/memberCareerStats");
const averageIncidentsPerClubRoutes = require("./routes/averageIncidentsPerClub");
const UserCareerStatsPercintilesRoutes = require("./routes/userCareerStatsPercentiles");
const SeriesSafetyRoutes = require("./routes/seriesSafety");
const InternalToolsRoutes = require("./routes/InternalTools");
const seriesAvgLapTimes = require("./routes/seriesAvgLapTimes");
const userLoginRoutes = require("./routes/userLogin");
const seriesCarPercentilesRoutes = require("./routes/seriesCarPercentiles");

var CryptoJS = require("crypto-js");
var AES = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var Base64 = require("crypto-js/enc-base64");

// CORS error fix
app.use(cors());

// middleware to parse res.body
app.use(bodyParser.json());

// ROUTING
app.use("/api/sessionData", sessionData);
app.use("/api/times-by-car", timesByCarRoutes);
app.use("/api/irating-data", iratingDataRoutes);
app.use("/api/series-pop", SeriesPopRoutes);
app.use("/api/average-irating-per-club", averageIratingPerClubRoutes);
app.use("/api/sof-results", sofResultsRoutes);
app.use("/api/legacy-times-by-car", legacyTimesByCarRoutes);
app.use("/api/member-career-stats", memberCareerStats);
app.use("/api/average-incidents-per-club", averageIncidentsPerClubRoutes);
app.use("/api/user-career-stats-percentiles", UserCareerStatsPercintilesRoutes);
app.use("/api/series-safety", SeriesSafetyRoutes);
app.use("/api/internal-tools", InternalToolsRoutes);
app.use("/api/series-avg-lap-times", seriesAvgLapTimes);
app.use("/api/user-login", userLoginRoutes);
app.use("/api/series-car-percentiles", seriesCarPercentilesRoutes);

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

// Call getAuth immediately on server start
getAuth();

// Set a timer to call getAuth every 15 minutes
// setInterval(getAuth, 15 * 60 * 1000);

app.get("/", (req, res) => {
        res.send("This is home page!");
});

async function getAuth() {
        var hash = CryptoJS.SHA256(process.env.IR_PASSWORD + process.env.IR_USERNAME.toLowerCase());
        // The values in parenthesis evaluate to ("MyPassWord"+"clunky@iracing.com")
        // Notice the password value maintains its case, while the lowercase username is used here

        //Then we need to enc the hash in Base64
        var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
        console.log("getting auth, server.js");
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
        console.log("Auth status code server.js: " + statusCode);
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
                        console.log("parseCookies" + cookiePart);

                        return cookiePart;
                })
                .join(";");
}

//**********START**********
async function starter() {
        console.log("STARTING");
}

app.listen(process.env.PORT || 3100, () => {
        console.log("*****Server started*****");
});
