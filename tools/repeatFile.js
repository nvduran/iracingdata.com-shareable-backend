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

// Run the first script every 1 minutes
executeScript("./scanTheUnscannedIds.js", 1 * 60 * 1000);
