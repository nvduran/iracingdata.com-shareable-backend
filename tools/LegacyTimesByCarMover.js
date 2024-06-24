const mongoose = require("mongoose");
const TimesByCar = require("../models/TimesByCar");
const LegacyTimesByCar = require("../models/LegacyTimesByCar");

require("dotenv").config({ path: "../.env" });

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

async function moveResultsToLegacy() {
        try {
                const timesByCarResults = await TimesByCar.find({});

                for (const result of timesByCarResults) {
                        const legacyTimesByCarResult = new LegacyTimesByCar({
                                // Assign the properties from the TimesByCar document to the new LegacyTimesByCar document.
                                // You will need to replace `...result` with the actual properties you want to copy over,
                                // if they are not identical between the two schemas
                                ...result._doc,
                        });

                        await legacyTimesByCarResult.save();
                        console.log(`TimesByCar with id ${result._id} moved to LegacyTimesByCar`);
                }

                console.log("Migration completed!");
        } catch (error) {
                console.error("Error moving TimesByCar to LegacyTimesByCar:", error);
        }
}

// Start the process
moveResultsToLegacy();
