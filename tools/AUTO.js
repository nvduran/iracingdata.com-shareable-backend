const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

console.log("Starting Auto-Compiler...");

function executeScript(scriptPath, interval) {
        console.log("Executing script: " + scriptPath);
        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
                if (error) {
                        console.error(`exec error: ${error}`);
                        // return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                // Schedules the next execution
                setTimeout(executeScript, interval, scriptPath, interval);
        });
}

function delayExecution(scriptPath, initialDelay, interval) {
        // Delay the initial execution
        setTimeout(() => {
                executeScript(scriptPath, interval);
        }, initialDelay);
}

// Run the first script after a specific delay
delayExecution("./sessionUpdaterMulticlass.js", 0 * 60 * 1000, 73 * 60 * 1000);
delayExecution("./refreshTimesByCar.js", 5 * 60 * 1000, 169 * 60 * 1000);
delayExecution("./seriesSafetyCalc.js", 20 * 60 * 1000, 131 * 60 * 1000);
delayExecution("./newSofResultsUploader.js", 6 * 60 * 1000, 4 * 60 * 1000);
delayExecution("./freshSessionFullResults.js", 2 * 60 * 1000, 1 * 60 * 1000);
delayExecution("./scanTheUnscannedIds", 0 * 60 * 1000, 15 * 1000);
// delayExecution("./userCareerStatsPercentilesCalc.js", 30 * 60 * 1000, 521 * 60 * 1000);
delayExecution("./seriesAvgQual.js", 115 * 60 * 1000, 187 * 60 * 1000);
delayExecution("./seriesCarPercentilesCalc.js", 40 * 60 * 1000, 42 * 81 * 1000);
// delayExecution("./iratingListsUpdate.js", 45 * 60 * 1000, 400 * 60 * 1000);
delayExecution("./lookForNewSubs.js", 30 * 60 * 1000, 30 * 60 * 1000);
delayExecution("./historySafetyMigrate.js", 120 * 60 * 1000, 119 * 60 * 1000);
