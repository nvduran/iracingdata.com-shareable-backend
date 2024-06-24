const mongoose = require("mongoose");
const SofResults = require("../models/SofResults");
const LegacySofResults = require("../models/LegacySofResults");

require("dotenv").config({ path: "../.env" });

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

async function moveResultsToLegacy() {
        try {
                const sofResults = await SofResults.find({});

                for (const result of sofResults) {
                        const legacySofResult = new LegacySofResults({
                                ...result._doc,
                        });

                        await legacySofResult.save();
                        console.log(`SofResult with id ${result._id} moved to LegacySofResults`);

                        // Now delete the SofResult
                        // await SofResults.deleteOne({ _id: result._id });
                        // console.log(`SofResult with id ${result._id} deleted from SofResults`);
                }

                console.log("Migration completed!");
        } catch (error) {
                console.error("Error moving SofResults to LegacySofResults:", error);
        }
}

// Start the process
moveResultsToLegacy();
