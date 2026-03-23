// models/Restaurant.js

const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: String,
    address: String,
    gstNumber: String,

    subscriptionPlan: {
        type: String,
        enum: ["basic", "pro", "enterprise"],
        default: "basic",
    },

    isActive: {
        type: Boolean,
        default: true,
    }

}, { timestamps: true });

module.exports = mongoose.model("Restaurant", restaurantSchema);