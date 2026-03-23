// config/razorpay.js
const Razorpay = require("razorpay");
const config = require("./config");


const razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpaySecretKey,
});

module.exports = razorpay;