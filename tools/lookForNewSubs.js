const User = require("../models/User");

const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

mongoose.connect(process.env.DB_CONNECTION, () => {
        console.log("Connected to DB!");
});

const emails = ["sam.halliday@gmail.com", "smithe4747@gmail.com", "ultraniffy@gmail.com", "tmeincell@gmail.com", "nickolasvduran@gmail.com"];

// if username or patreon_email is in the emails array, add isPaidUser to the user

(async () => {
        try {
                for (let i = 0; i < emails.length; i++) {
                        const email = emails[i];
                        const user = await User.findOne({ $or: [{ username: email }, { patreon_email: email }] });
                        if (user) {
                                user.isPaidUser = true;
                                await user.save();
                                console.log(`Updated ${user.username} with isPaidUser:`, user.isPaidUser);
                        }
                }
        } catch (err) {
                console.error(err);
        }

        // Schedule the exit after 10 seconds
        setTimeout(() => {
                console.log("Exiting after 10 seconds.");
                process.exit();
        }, 10000);
})();
