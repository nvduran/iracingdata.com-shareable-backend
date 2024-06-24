const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
        username: {
                type: String,
                required: true,
                min: 1,
                max: 250,
                unique: true,
        },
        password: {
                type: String,
                required: true,
                min: 6,
        },
        security_question: {
                type: String,
                required: true,
                min: 1,
                max: 250,
        },
        security_answer: {
                type: String,
                required: true,
                min: 1,
                max: 250,
        },
        isPaidUser: {
                type: Boolean,
                default: false,
        },
        patreon_email: {
                type: String,
                default: "",
        },
});

module.exports = mongoose.model("User", UserSchema);
