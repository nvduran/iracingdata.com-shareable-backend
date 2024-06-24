const express = require("express");
const router = express.Router();
const LegacyTimesByCar = require("../models/LegacyTimesByCar");

// Middleware for error handling
function asyncErrorHandler(fn) {
        return (req, res, next) => {
                Promise.resolve(fn(req, res, next)).catch((error) => {
                        console.error(error);
                        res.status(500).json({ message: "Error occurred" });
                });
        };
}

router.get(
        "/seasons/:season_name/tracks/:track_name/cars/:car_name",
        asyncErrorHandler(async (req, res) => {
                const { season_name, track_name, car_name } = req.params;
                const legacyTimesByCar = await LegacyTimesByCar.findOne({
                        season_name: season_name,
                        track_name: track_name,
                        car_name: car_name,
                });

                if (legacyTimesByCar) {
                        res.json(legacyTimesByCar);
                        console.log(`Returned legacy times by car data for season '${season_name}', track '${track_name}', and car '${car_name}'.`);
                } else {
                        res.status(404).json({ message: "Data not found for the specified parameters." });
                        console.log(`No data found for season '${season_name}', track '${track_name}', and car '${car_name}'.`);
                }
        })
);

router.get("/", async (req, res) => {
        try {
                const legacyTimesByCar = await LegacyTimesByCar.find();

                if (legacyTimesByCar && legacyTimesByCar.length > 0) {
                        res.json(legacyTimesByCar);
                        console.log("Returned all legacy times by car data.");
                } else {
                        res.status(404).json({ message: "No legacy times by car data found." });
                        console.log("No legacy times by car data found.");
                }
        } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Error occurred" });
        }
});

router.get("/seasons/:season_name/tracks/:track_name", async (req, res) => {
        try {
                const { season_name, track_name } = req.params;
                const legacyTimesByCar = await LegacyTimesByCar.find({
                        season_name: season_name,
                        track_name: track_name,
                });

                if (legacyTimesByCar && legacyTimesByCar.length > 0) {
                        res.json(legacyTimesByCar);
                        console.log(`Returned legacy times by car data for all cars in season '${season_name}' at track '${track_name}'.`);
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
