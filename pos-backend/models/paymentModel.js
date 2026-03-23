const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        status: {
            type: String,
            enum: ["Pending", "Success", "Failed", "Refunded"],
            default: "Pending",
            index: true,
        },

        method: {
            type: String,
            enum: ["Cash", "Card", "UPI", "Razorpay"],
            required: true,
        },

        transactionId: {
            type: String, // generic transaction id
        },

        razorpay: {
            order_id: String,
            payment_id: String,
            signature: String,
        },

        customer: {
            name: String,
            email: String,
            contact: String,
        },

        paidAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);