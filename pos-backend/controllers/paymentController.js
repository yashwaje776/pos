// controllers/paymentController.js
const razorpay = require("../config/razorpay");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const crypto = require("crypto");


const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const options = {
      amount: order.bills.total * 100, // in paise
      currency: "INR",
      receipt: `receipt_${order._id}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save pending payment
    const payment = await Payment.create({
      order: order._id,
      restaurantId: order.restaurantId,
      amount: order.bills.total,
      method: "Razorpay",
      status: "Pending",
      razorpay: {
        order_id: razorpayOrder.id,
      },
    });

    res.status(200).json({
      success: true,
      razorpayOrder,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update payment
    const payment = await Payment.findOneAndUpdate(
      { "razorpay.order_id": razorpay_order_id },
      {
        status: "Success",
        transactionId: razorpay_payment_id,
        razorpay: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
        },
        paidAt: new Date(),
      },
      { new: true }
    );

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      isPaid: true,
      paymentMethod: "Razorpay",
      paymentData: {
        razorpay_order_id,
        razorpay_payment_id,
      },
      orderStatus: "Completed",
      closedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Payment successful",
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment };

