const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        variant: {
            name: {
                type: String, // Half / Full / Regular
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
        },

        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },

        subtotal: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: ["Pending", "Preparing", "Ready", "Served", "Cancelled"],
            default: "Pending",
        },

        notes: {
            type: String, // Extra cheese, No onion
            trim: true,
        },

        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const orderSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true,
        },
        orderType: {
            type: String,
            enum: ["DINE_IN", "TAKEAWAY"],
            required: true,
            default: "DINE_IN",
        },

        table: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Table",
            required: function () {
                return this.orderType === "DINE_IN";
            },
        },

        customerDetails: {
            name: {
                type: String,
                default: "Walk-in Customer",
            },
            phone: {
                type: String,
                default: "0000000000",
            },
            guests: {
                type: Number,
                default: 1,
            },
        },

        orderStatus: {
            type: String,
            enum: ["Pending", "Preparing", "Served", "Completed", "Cancelled"],
            default: "Pending",
            index: true,
        },

        items: [orderItemSchema],

        bills: {
            subtotal: {
                type: Number,
                default: 0,
            },

            tax: {
                type: Number,
                default: 0,
            },

            discount: {
                type: Number,
                default: 0,
            },

            total: {
                type: Number,
                default: 0,
            },
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "Card", "UPI", "Razorpay"],
            default: null,
        },

        paymentData: {
            razorpay_order_id: String,
            razorpay_payment_id: String,
        },

        isPaid: {
            type: Boolean,
            default: false,
        },

        closedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);