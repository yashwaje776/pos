// models/MenuItem.js

const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String, // Half, Full, Regular, Large
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
    },

    // Veg / Non-Veg flag
    isVeg: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Food variants
    variants: {
      type: [variantSchema],
      default: [],
    },

    image: {
      url: String,
      public_id: String,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);