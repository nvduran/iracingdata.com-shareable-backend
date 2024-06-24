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
delayExecution("./newSofResultsUploader.js", 15 * 60 * 1000, 53 * 60 * 1000);
delayExecution("./freshSessionFullResults.js", 2 * 60 * 1000, 1 * 60 * 1000);
delayExecution("./scanTheUnscannedIds", 0 * 60 * 1000, 15 * 1000);
