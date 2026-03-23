// models/Category.js

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        image: {
            url: {
                type: String,
                required: false,
            },
            public_id: {
                type: String,
                required: false,
            },
        },

        enabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate category name for same restaurant
categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);