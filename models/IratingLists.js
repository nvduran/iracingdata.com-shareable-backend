const mongoose = require("mongoose");

const iRatingListsSchema = new mongoose.Schema({
        category: {
                type: String,
                enum: ["road", "oval", "dirt_road", "dirt_oval", "sports_car", "formula_car"],
                required: true,
        },
        values: {
                type: [Number],
                required: true,
        },
        oldestUpdate: {
                type: Number,
        },
});

// category values oldestUpdate combo is unique
iRatingListsSchema.index({ category: 1, values: 1, oldestUpdate: 1 }, { unique: true });

const IratingList = mongoose.model("iRating List", iRatingListsSchema);

module.exports = IratingList;
