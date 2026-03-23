const express = require("express");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { addCategory, getCategories, updateCategory, deleteCategory, addMenuItem, getMenuItems, updateMenuItem, deleteMenuItem } = require("../controllers/menuController");
const { getDashboardStats } = require("../controllers/orderController");
const { getAnalyticesData } = require("../controllers/dashboardController");
const router = express.Router();
const upload = require("../middlewares/upload");
router.post("/category", isVerifiedUser, upload.single("image"),
    addCategory);
router.get("/category", isVerifiedUser, getCategories);
router.put("/category/:id", isVerifiedUser, upload.single("image"), updateCategory);
router.delete("/category/:id", isVerifiedUser, deleteCategory);

router.post("/menu", isVerifiedUser, upload.single("image"), addMenuItem);
router.get("/menu", isVerifiedUser, getMenuItems);
router.put("/menu/:id", isVerifiedUser, upload.single("image"), updateMenuItem);
router.delete("/menu/:id", isVerifiedUser, deleteMenuItem);


router.get(
    "/dashboard/stats",
    isVerifiedUser,
    getDashboardStats);

router.get("/dashboard/analytics", isVerifiedUser, getAnalyticesData);

module.exports = router;