const mongoose = require("mongoose");

const UnscannedCustId = new mongoose.Schema({
        requested: { type: Date, default: Date.now() },
        cust_id: { type: Number, required: true, unique: true },
});

module.exports = mongoose.model("Unscanned Cust Id", UnscannedCustId);
