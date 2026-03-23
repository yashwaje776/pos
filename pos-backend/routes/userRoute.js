const express = require("express");
const { register, login, getUserData, logout, registerRestaurant, getAllStaff } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();


// Authentication Routes
router.route("/register").post(isVerifiedUser, register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout)
router.route("/restaurant/register").post(registerRestaurant);

router.route("/").get(isVerifiedUser, getUserData);
router.route("/staff").get(isVerifiedUser, getAllStaff); // new route to get all staff members

module.exports = router;