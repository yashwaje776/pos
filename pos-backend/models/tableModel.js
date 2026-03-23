const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    tableNo: {
      type: Number,
      required: true,
    },

    seats: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Available", "Occupied", "Reserved", "Cleaning"],
      default: "Available",
    },

    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


// ✅ Compound index (VERY IMPORTANT)
tableSchema.index({ restaurantId: 1, tableNo: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);