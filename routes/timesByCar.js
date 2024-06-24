const express = require("express");
const router = express.Router();
const TimeByCar = require("../models/TimesByCar");
const LastUpdatedMulti = require("../models/LastUpdatedMulti");

// Endpoint for getting times by car for a specific season, track, and car

// Middleware for error handling
function asyncErrorHandler(fn) {
        return (req, res, next) => {
                Promise.resolve(fn(req, res, next)).catch((error) => {
                        console.error(error);
                        res.status(500).json({ message: "Error occurred" });
                });
        };
}

// example:
// http://localhost:3100/api/times-by-car/seasons/{season_name}/tracks/{track_name}/cars/{car_name}
// http://localhost:3100/api/times-by-car/seasons/GT%20Sprint%20VRS%20Series%20-%202023%20Season%201/tracks/Circuit%20de%20Spa-Francorchamps/cars/BMW%20M4%20GT3
router.get(
        "/seasons/:season_name/tracks/:track_name/cars/:car_name",
        asyncErrorHandler(async (req, res) => {
                const { season_name, track_name, car_name } = req.params;
                const timesByCar = await TimeByCar.findOne({
                        season_name: season_name,
                        track_name: track_name,
                        car_name: car_name,
                });

                if (timesByCar) {
                        res.json(timesByCar);
                        console.log(`Returned times by car data for season '${season_name}', track '${track_name}', and car '${car_name}'.`);
                } else {
                        res.status(404).json({ message: "Data not found for the specified parameters." });
                        console.log(`No data found for season '${season_name}', track '${track_name}', and car '${car_name}'.`);
                }
        })
);

// New endpoint for getting all times by car
// example:
// http://localhost:3100/api/times-by-car
router.get("/", async (req, res) => {
        try {
                const timesByCar = await TimeByCar.find();

                if (timesByCar && timesByCar.length > 0) {
                        res.json(timesByCar);
                        console.log("Returned all times by car data.");
                } else {
                        res.status(404).json({ message: "No times by car data found." });
                        console.log("No times by car data found.");
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error occurred" });
        }
});

// New endpoint for getting the last updated time from db
router.get("/last-updated", async (req, res) => {
        try {
                const lastUpdated = await LastUpdatedMulti.findOne();

                if (lastUpdated) {
                        // Format date to a string with timezone
                        const formattedDate = new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                timeZoneName: "short",
                        }).format(lastUpdated.last_updated);

                        res.json({ last_updated: formattedDate });
                        console.log("Returned last updated time.");
                } else {
                        res.status(404).json({ message: "No last updated time found." });
                        console.log("No last updated time found.");
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error occurred" });
        }
});

// New endpoint for getting times for all cars at a certain track in a specific season
// example:
// http://localhost:3100/api/times-by-car/seasons/{season_name}/tracks/{track_name}
// http://localhost:3100/api/times-by-car/seasons/GT%20Sprint%20VRS%20Series%20-%202023%20Season%201/tracks/Circuit%20de%20Spa-Francorchamps
router.get("/seasons/:season_name/tracks/:track_name", async (req, res) => {
        try {
                const { season_name, track_name } = req.params;
                const timesByCar = await TimeByCar.find({
                        season_name: season_name,
                        track_name: track_name,
                });

                if (timesByCar && timesByCar.length > 0) {
                        res.json(timesByCar);
                        console.log(`Returned times by car data for all cars in season '${season_name}' at track '${track_name}'.`);
                } else {
                        res.status(404).json({ message: "Data not found for the specified parameters." });
                        console.log(`No data found for season '${season_name}' and track '${track_name}'.`);
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error occurred" });
        }
});

module.exports = router;
