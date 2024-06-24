const mongoose = require("mongoose");

const LastUpdatedMulti = new mongoose.Schema({
        last_updated: { type: Date, required: true, unique: true },
});

module.exports = mongoose.model("Last Updated Multi", LastUpdatedMulti);
