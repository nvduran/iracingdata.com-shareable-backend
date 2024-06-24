const mongoose = require("mongoose");
const MemberCareerStats = require("../models/MemberCareerStats");
require("dotenv").config({ path: "../.env" }); // Load environment variables

require("dotenv").config(); // Load environment variables

// MongoDB Connection
mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
        // findMostCommonFirstNames();
        findMostCommonFirstNameAcrossClubs();
});

// Function to extract and aggregate the most common first names by club
async function findMostCommonFirstNames() {
        try {
                const aggregation = [
                        {
                                $addFields: {
                                        // Assuming the first name is the first part of the display_name
                                        first_name: { $arrayElemAt: [{ $split: ["$display_name", " "] }, 0] },
                                },
                        },
                        {
                                $group: {
                                        _id: {
                                                club_name: "$club_name",
                                                first_name: "$first_name",
                                        },
                                        count: { $sum: 1 },
                                },
                        },
                        {
                                $sort: { count: -1 },
                        },
                        {
                                $group: {
                                        _id: "$_id.club_name",
                                        mostCommonFirstName: { $first: "$_id.first_name" },
                                        count: { $first: "$count" },
                                        totalMembers: { $sum: "$count" }, // Sum all occurrences to get total members
                                },
                        },
                        {
                                $project: {
                                        _id: 0,
                                        club_name: "$_id",
                                        mostCommonFirstName: 1,
                                        count: 1,
                                        percentage: {
                                                $multiply: [{ $divide: ["$count", "$totalMembers"] }, 100],
                                        },
                                },
                        },
                ];

                const result = await MemberCareerStats.aggregate(aggregation);
                console.log(
                        result.map((item) => ({
                                ...item,
                                percentage: item.percentage.toFixed(2) + "%", // Format percentage
                        }))
                );
        } catch (err) {
                console.error("Error finding most common first names", err);
        }
}

async function findMostCommonFirstNameAcrossClubs() {
        try {
                const aggregation = [
                        {
                                $addFields: {
                                        // Assuming the first name is the first part of the display_name
                                        first_name: { $arrayElemAt: [{ $split: ["$display_name", " "] }, 0] },
                                },
                        },
                        {
                                $group: {
                                        _id: "$first_name",
                                        count: { $sum: 1 },
                                },
                        },
                        {
                                $sort: { count: -1 },
                        },
                        {
                                $limit: 1, // Limit to the most common first name
                        },
                        {
                                $project: {
                                        _id: 0,
                                        mostCommonFirstName: "$_id",
                                        count: 1,
                                },
                        },
                ];

                const result = await MemberCareerStats.aggregate(aggregation);
                console.log(result);
        } catch (err) {
                console.error("Error finding the most common first name across all clubs", err);
        }
}
