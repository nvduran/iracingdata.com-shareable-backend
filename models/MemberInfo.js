const mongoose = require("mongoose");

const MemberInfoSchema = new mongoose.Schema({
        cust_id: { type: Number, required: true, unique: true },
        display_name: String,
        last_login: String,
        member_since: String,
        club_id: Number,
        club_name: String,
        iRating: { when: String, value: { type: Number, index: true }, category: String },
        iRatingOval: { when: String, value: Number, category: String },
});

module.exports = mongoose.model("Member Info", MemberInfoSchema);
