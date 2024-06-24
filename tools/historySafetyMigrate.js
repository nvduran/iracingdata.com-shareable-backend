const mongoose = require("mongoose");
const SeriesSafetyStats = require("../models/SeriesSafetyStats");
const SeriesSafetyStatsHistoric = require("../models/SeriesSafetyStatsHistoric");
require("dotenv").config({ path: "../.env" });

mongoose.connect(
        process.env.DB_CONNECTION,
        {
                useNewUrlParser: true,
                useUnifiedTopology: true,
        },
        () => {
                console.log("Connected to DB!");
                mongoose.set("strictQuery", true); // Handle deprecation warning
                updateAllHistoricCollections();
        }
);

// Add the current series safety stats to the historic collection by updating the historic collection with the additional data
async function updateAllHistoricCollections() {
        try {
                const currentStatsList = await SeriesSafetyStats.find({});

                if (currentStatsList.length === 0) {
                        console.error("No series safety stats found");
                        return;
                }

                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                for (const currentStats of currentStatsList) {
                        // Find the historic stats document
                        const historicStats = await SeriesSafetyStatsHistoric.findOne({ season_name: currentStats.season_name });

                        if (historicStats && historicStats.last_updated > oneWeekAgo) {
                                console.log(`Skipping update for ${currentStats.season_name} as it was updated within the last week`);
                                continue;
                        }

                        // Update the historic collection with the additional data or create a new document if it doesn't exist
                        await SeriesSafetyStatsHistoric.findOneAndUpdate(
                                { season_name: currentStats.season_name },
                                {
                                        $inc: {
                                                totalIncidents: currentStats.totalIncidents,
                                                totalEntrants: currentStats.totalEntrants,
                                                totalLaps: currentStats.totalLaps,
                                                totalCorners: currentStats.totalCorners,
                                        },
                                        $set: { last_updated: new Date() },
                                },
                                { upsert: true, new: true }
                        );
                }

                console.log("All historic series safety stats updated successfully");

                // exit the process after 2 seconds
                setTimeout(() => {
                        console.log("Exiting process...");
                        process.exit();
                }, 2000);
        } catch (error) {
                console.error("Error updating historic series safety stats:", error);
        }
}
