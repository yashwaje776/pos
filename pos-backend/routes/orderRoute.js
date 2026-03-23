const express = require("express");
const { addOrder, getOrders, getOrderById, updateOrder, addItemToOrder, removeItemFromOrder, closeOrder, getDashboardStats, updateOrderStatus, updateItemStatus } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();


router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/:id").get(isVerifiedUser, getOrderById);

router.route("/:id").put(isVerifiedUser, updateOrder);
router.post(
  "/:orderId/add-item",
  isVerifiedUser,
  addItemToOrder
);
router.patch(
  "/:orderId/close",
  isVerifiedUser,
  closeOrder
);
router.delete(
  "/:orderId/items/:itemId",
  isVerifiedUser,
  removeItemFromOrder
);




router.put("/:orderId/status", isVerifiedUser, updateOrderStatus);

// Update single item status
router.put("/:orderId/item/:itemId/status", isVerifiedUser, updateItemStatus);

module.exports = router;