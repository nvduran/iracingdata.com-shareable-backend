const express = require("express");
const router = express.Router();

// Function to get all session populations from the database
async function getSessionPopulations() {
        const populations = await SessionPopulation.find({});
        // const aggPopulations = populations.map((population) => population.AggSessionPopulation);
        return populations;
}

// Root endpoint to test if the router is working
router.get("/", (req, res) => {
        res.send("This is Session Population Aggregated endpoint!");
});

// Endpoint to retrieve all aggregated session populations
router.get("/session-pop-agg", async (req, res) => {
        console.log("GET /session-pop-agg");
        try {
                const populations = await getSessionPopulations();
                res.status(200).json(populations);
        } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch aggregated session populations" });
        }
});

module.exports = router;
