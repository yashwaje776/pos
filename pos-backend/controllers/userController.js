const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const Restaurant = require("../models/RestaurantModel");

const register = async (req, res, next) => {
    try {
        console.log("📥 Register API called");

        const restaurantId = req.restaurantId;
        const loggedInUser = req.user;

        console.log("👤 Logged In User:", {
            id: loggedInUser?._id,
            role: loggedInUser?.role,
            restaurantId,
        });

        const { name, phone, email, password, role } = req.body;

        console.log("📝 Incoming Data:", {
            name,
            email,
            phone,
            role,
        });

        /* 🔐 ROLE PERMISSION CHECK */
        if (!["admin", "manager"].includes(loggedInUser.role)) {
            console.log("⛔ Access Denied - Unauthorized role");

            return res.status(403).json({
                success: false,
                message: "Only admin or manager can add staff",
            });
        }

        /* ✅ FIELD VALIDATION */
        if (!name || !phone || !email || !password) {
            console.log("⚠️ Missing required fields");

            return res.status(400).json({
                success: false,
                message: "Required fields are missing!",
            });
        }

        /* ✅ CHECK EXISTING USER (inside same restaurant) */
        const isUserPresent = await User.findOne({
            email,
            restaurantId,
        });

        if (isUserPresent) {
            console.log("⚠️ User already exists:", email);

            return res.status(400).json({
                success: false,
                message: "User already exists in this restaurant!",
            });
        }

        /* ✅ CREATE USER */
        const newUser = new User({
            name,
            phone,
            email,
            password,
            role: role || "waiter",
            restaurantId,
        });

        await newUser.save();

        console.log("✅ New Staff Created:", {
            id: newUser._id,
            name: newUser.name,
            role: newUser.role,
        });

        /* ❌ REMOVE PASSWORD FROM RESPONSE */
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: "New staff member created successfully!",
            data: userResponse,
        });

    } catch (error) {
        console.error("🔥 Register Error:", error.message);
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(createHttpError(400, "All fields are required!"));
        }

        const user = await User.findOne({ email });

        if (!user) {
            return next(createHttpError(401, "Invalid Credentials"));
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {

            return next(createHttpError(401, "Invalid Credentials not match!"));
        }

        const accessToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                restaurantId: user.restaurantId,
            },
            config.accessTokenSecret,
            { expiresIn: "1d" }
        );

        const isProd = process.env.NODE_ENV === "production";

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });

        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({
            success: true,
            message: "User login successfully!",
            accessToken,
            data: userData,
        });

    } catch (error) {
        next(error);
    }
};

const getUserData = async (req, res, next) => {
    try {

        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, data: user });

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {

        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: "User logout successfully!" });

    } catch (error) {
        next(error);
    }
}


const registerRestaurant = async (req, res) => {
    try {
        const {
            restaurantName,
            ownerName,
            email,
            phone,
            address,
            gstNumber,
            password,
        } = req.body;

        // Check if restaurant already exists
        const existingRestaurant = await Restaurant.findOne({ email });
        if (existingRestaurant) {
            return res.status(400).json({
                message: "Restaurant already registered with this email",
            });
        }

        // Hash password

        // Create Restaurant
        const newRestaurant = await Restaurant.create({
            name: restaurantName,
            email,
            phone,
            address,
            gstNumber,
        });

        // Create Admin User
        await User.create({
            restaurantId: newRestaurant._id,
            name: ownerName,
            email,
            phone,
            password: password,
            role: "admin",
        });

        return res.status(201).json({
            message: "Restaurant registered successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

const getAllStaff = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        const staff = await User.find({ restaurantId })
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: staff,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = { register, login, getUserData, logout, registerRestaurant, getAllStaff }