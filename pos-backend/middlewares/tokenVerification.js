const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");

const isVerifiedUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createHttpError(401, "Access token required"));
    }

    const token = authHeader.split(" ")[1];

    // Verify Token
    const decoded = jwt.verify(token, config.accessTokenSecret);

    if (!decoded || !decoded.id) {
      return next(createHttpError(401, "Invalid token payload"));
    }

    // Find User (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(createHttpError(401, "User not found"));
    }

    // Attach user to request
    req.user = user;
    req.userRole = decoded.role;          // optional
    req.restaurantId = decoded.restaurantId; // optional

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(createHttpError(401, "Token expired"));
    }

    if (error.name === "JsonWebTokenError") {
      return next(createHttpError(401, "Invalid token"));
    }

    return next(createHttpError(500, "Authentication failed"));
  }
};

module.exports = { isVerifiedUser };