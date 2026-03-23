const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const { default: mongoose } = require("mongoose");
const MenuItem = require("../models/MenuItem");
const { io } = require("../app");

const addOrder = async (req, res, next) => {
  try {
    const { customerName, phone, guestCount, tableNo, orderType } = req.body;

    if (orderType === "DINE_IN") {
      if (!tableNo || !customerName || !guestCount) {
        return next(createHttpError(400, "All required fields must be provided"));
      }

      // 🔥 Find table inside same restaurant
      const table = await Table.findOne({
        tableNo,
        restaurantId: req.restaurantId,
        isActive: true,
      });

      if (!table) {
        return next(createHttpError(404, "Table not found"));
      }

      // 🔥 Check if table already has active order
      const existingOrder = await Order.findOne({
        table: table._id,
        restaurantId: req.restaurantId,
        orderStatus: { $nin: ["Completed", "Cancelled"] },
      });

      if (existingOrder) {
        return next(createHttpError(400, "Table already has active order"));
      }

      // 🔥 Create new order
      const order = await Order.create({
        restaurantId: req.restaurantId,
        customerDetails: {
          name: customerName,
          phone,
          guests: guestCount,
        },
        table: table._id,
        orderStatus: "Pending",
        orderType
      });

      // 🔥 Update table
      table.status = "Occupied";
      table.currentOrder = order._id; // 🔥 IMPORTANT
      await table.save();
      io.to(req.restaurantId.toString()).emit("orderCreated", {
        order: {
          ...order.toObject(),
          tableNo: table.tableNo,
        }
      });

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    }
    else {
      if (!phone || !customerName) {
        return next(createHttpError(400, "All required fields must be provided"));
      }
      const order = await Order.create({
        restaurantId: req.restaurantId,
        customerDetails: {
          name: customerName,
          phone,
        },
        orderStatus: "Pending",
        orderType
      });
      io.to(req.restaurantId.toString()).emit("orderCreated", {
        order: {
          ...order.toObject(),
        }
      });
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });

    }
  } catch (error) {
    next(error);
  }
};




const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id)
      .populate("table")
      .populate("items.menuItem")
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {

    const filter = {
      restaurantId: req.restaurantId, // 🔐 Important security
    };

    const orders = await Order.find(filter)
      .populate("table")
      .populate("items.menuItem")
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    let updateData = { orderStatus };

    // If order is cancelled, cancel all items
    if (orderStatus === "Cancelled") {
      updateData["items.$[].status"] = "Cancelled";
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Order updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
const TAX_PERCENTAGE = 5;

const addItemToOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const {
      menuItemId,
      variant,
      quantity = 1,
      notes
    } = req.body;

    if (!menuItemId) {
      return next(createHttpError(400, "Menu item is required"));
    }

    if (!variant || !variant.name || !variant.price) {
      return next(createHttpError(400, "Variant is required"));
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return next(createHttpError(400, "Quantity must be a positive integer"));
    }

    /* FIND ORDER */

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.restaurantId
    });

    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    if (["Completed", "Cancelled"].includes(order.orderStatus)) {
      return next(
        createHttpError(400, "Cannot modify completed or cancelled order")
      );
    }

    /* FIND MENU ITEM */

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      restaurantId: req.restaurantId,
      isAvailable: true
    });

    if (!menuItem) {
      return next(
        createHttpError(404, "Menu item not found or unavailable")
      );
    }

    /* VERIFY VARIANT EXISTS */

    const menuVariant = menuItem.variants.find(
      v => v.name === variant.name
    );

    if (!menuVariant) {
      return next(createHttpError(400, "Invalid variant selected"));
    }

    /* CALCULATE SUBTOTAL */

    const subtotal = menuVariant.price * quantity;

    /* ADD ITEM */

    order.items.push({
      menuItem: menuItem._id,
      name: menuItem.name,

      variant: {
        name: menuVariant.name,
        price: menuVariant.price
      },

      quantity,
      subtotal,
      notes,
      status: "Pending",
      addedAt: new Date()
    });

    /* RECALCULATE BILL */
    calculateBill(order);


    await order.save();
    const latestItem = order.items[order.items.length - 1];

    if (latestItem) {
      io.to(req.restaurantId.toString()).emit("itemAdded", {
        orderId: order._id,
        latestItem,
        menuItem
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item added successfully",
      data: order
    });

  } catch (error) {
    next(error);
  }
};


const removeItemFromOrder = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.restaurantId,
    });

    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    if (
      order.orderStatus === "Completed" ||
      order.orderStatus === "Cancelled"
    ) {
      return next(
        createHttpError(400, "Cannot modify completed or cancelled order")
      );
    }

    const item = order.items.find(
      (item) => item._id.toString() === itemId
    );
    const oldStatus = item?.status;
    if (!item) {
      return next(createHttpError(404, "Item not found in order"));
    }

    // ❌ Prevent cancelling served item
    if (item.status === "Served") {
      return next(
        createHttpError(400, "Cannot cancel a served item")
      );
    }

    // 🔥 Instead of deleting → mark as Cancelled
    item.status = "Cancelled";

    calculateBill(order);

    await order.save();
    io.to(req.restaurantId.toString()).emit("itemStatusUpdated", {
      orderId: order._id,
      item: item,
      oldStatus: oldStatus
    });


    res.status(200).json({
      success: true,
      message: "Item cancelled successfully",
      data: order,
    });

  } catch (error) {
    next(error);
  }
};


const moment = require("moment-timezone");

const getDashboardStats = async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurantId;

    /* ------------------ DATE RANGE ------------------ */

    const todayStart = moment()
      .tz("Asia/Kolkata")
      .startOf("day")
      .toDate();

    const todayEnd = moment()
      .tz("Asia/Kolkata")
      .endOf("day")
      .toDate();

    /* ------------------ TODAY ORDERS ------------------ */

    const todayOrdersPromise = Order.find({
      restaurantId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
      orderStatus: "Completed", // ✅ FIXED
    }).select("bills.total customerDetails.guests");
    /* ------------------ ACTIVE ORDERS ------------------ */

    const activeOrdersPromise = Order.countDocuments({
      restaurantId,
      orderStatus: { $nin: ["Completed", "Cancelled"] },
    });

    /* ------------------ PENDING ORDERS ------------------ */


    /* ------------------ ACTIVE TABLES ------------------ */

    const activeTablesPromise = Table.countDocuments({
      restaurantId,
      status: "Occupied",
      isActive: true,
    });

    /* ------------------ TABLE STATUS ------------------ */

    const tablesPromise = Table.find({
      restaurantId,
      isActive: true,
    }).select("tableNo status");

    /* ------------------ RECENT ORDERS ------------------ */

    const recentOrdersPromise = Order.find({
      restaurantId,
      orderStatus: { $ne: "Cancelled" },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("table", "tableNo")
      .select("customerDetails.name bills.total orderStatus createdAt table")
      .lean();

    /* ------------------ SALES CHART ------------------ */

    const salesChartPromise = Order.aggregate([
      {
        $match: {
          restaurantId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          orderStatus: "Completed",
        },
      },
      {
        $group: {
          _id: {
            $hour: {
              date: "$createdAt",
              timezone: "Asia/Kolkata", // ✅ FIX HERE
            },
          },
          revenue: { $sum: "$bills.total" },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);

    /* ------------------ TOP ITEMS ------------------ */

    const topItemsPromise = Order.aggregate([
      {
        $match: {
          restaurantId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          orderStatus: "Completed"
        },
      },

      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.menuItem", // group by menuItem ID
          name: { $first: "$items.name" },
          count: { $sum: "$items.quantity" },
        },
      },

      {
        $lookup: {
          from: "menuitems", // collection name
          localField: "_id",
          foreignField: "_id",
          as: "menuItem",
        },
      },

      {
        $unwind: {
          path: "$menuItem",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,
          menuItemId: "$_id",
          name: 1,
          count: 1,
          image: "$menuItem.image.url",
        },
      },
      { $sort: { count: -1 } },
    ]);

    /* ------------------ KITCHEN ACTIVITY ------------------ */

    const kitchenActivityPromise = Order.aggregate([
      {
        $match: {
          restaurantId,
          orderStatus: { $nin: ["Completed", "Cancelled"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.status",

          count: { $sum: 1 },
        },
      },
    ]);

    const [
      todayOrders,
      activeOrders,
      activeTables,
      tables,
      recentOrdersRaw,
      salesChart,
      topItems,
      kitchenActivity,
    ] = await Promise.all([
      todayOrdersPromise,
      activeOrdersPromise,
      activeTablesPromise,
      tablesPromise,
      recentOrdersPromise,
      salesChartPromise,
      topItemsPromise,
      kitchenActivityPromise,
    ]);

    const fullDaySales = Array.from({ length: 24 }, (_, hour) => {
      const found = salesChart.find((item) => item._id === hour);
      return {
        hour,
        revenue: found ? found.revenue : 0,
      };
    });

    /* ------------------ TODAY CALCULATIONS ------------------ */

    const todayOrdersCount = todayOrders.length;

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + (order.bills?.total || 0),
      0
    );

    const todayCustomers = todayOrders.reduce(
      (sum, order) => sum + (order.customerDetails?.guests || 0),
      0
    );

    /* ------------------ FORMAT RECENT ORDERS ------------------ */

    const recentOrders = recentOrdersRaw.map((order) => ({
      orderId: order._id,
      tableNo: order.table?.tableNo,
      customerName: order.customerDetails?.name,
      total: order.bills?.total || 0,
      status: order.orderStatus,
      createdAt: order.createdAt,
    }));

    /* ------------------ FORMAT KITCHEN ACTIVITY ------------------ */

    const kitchenStatus = {
      Pending: 0,
      Preparing: 0,
      Ready: 0,
    };

    kitchenActivity.forEach((item) => {
      kitchenStatus[item._id] = item.count;
    });

    /* ------------------ RESPONSE ------------------ */

    res.status(200).json({
      success: true,
      data: {
        summary: {
          todayRevenue,
          todayOrders: todayOrdersCount,
          todayCustomers,
          activeOrders,
          activeTables,
        },

        salesChart: fullDaySales,

        recentOrders,

        tableStatus: tables,

        topItems,

        kitchenActivity: kitchenStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

const closeOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.restaurantId,
    });

    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    if (order.items.length === 0) {
      return next(createHttpError(400, "Cannot close empty order"));
    }

    if (order.orderStatus === "Completed") {
      return next(createHttpError(400, "Order already completed"));
    }

    // ✅ Mark order completed
    order.orderStatus = "Completed";
    order.isPaid = true;
    order.closedAt = new Date();

    const closedOrder = await order.save();

    // ✅ Free the table properly
    const currTable = await Table.findByIdAndUpdate(order.table, {
      status: "Available",
      currentOrder: null,
    });
    io.to(req.restaurantId.toString()).emit("OrderClosed", {
      closedOrder: closedOrder,
      tableNo: currTable?.tableNo
    });

    res.status(200).json({
      success: true,
      message: "Order closed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
/*** 🔥 Update Entire Order Status*/
const calculateBill = (order) => {

  const validItems = order.items.filter(
    (item) => item.status !== "Cancelled"
  );

  const subtotal = validItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const tax = subtotal * 0.05;

  const total = subtotal + tax;

  order.bills.subtotal = subtotal;
  order.bills.tax = tax;
  order.bills.total = total;

};

const updateOrderStatus = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { status } = req.body;
    const restaurantId = req.restaurantId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Preparing",
      "Served",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (order.orderStatus === "Completed" || order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a completed or cancelled order",
      });
    }

    // ================= UPDATE STATUS =================
    order.orderStatus = status;

    /**
     * 🔥 If Order Cancelled
     */
    if (status === "Cancelled") {

      order.items.forEach((item) => {
        const oldStatus = item.status;
        item.status = "Cancelled";
        io.to(req.restaurantId.toString()).emit("itemStatusUpdated", {
          orderId: order._id,
          item: item,
          oldStatus: oldStatus
        });
      });


      calculateBill(order);

      order.closedAt = new Date();

      await Table.findByIdAndUpdate(order.table, {
        status: "Available",
        currentOrder: null,
      });

    }

    /**
     * 🔥 If Order Completed (Payment Done)
     */
    if (status === "Completed") {

      order.isPaid = true;
      order.closedAt = new Date();

      await Table.findByIdAndUpdate(order.table, {
        status: "Available",
        currentOrder: null,
      });

    }

    const updatedOrder = await order.save();
    io.to(req.restaurantId.toString()).emit("UpdatedOrderstatus", {
      order: updatedOrder
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });

  } catch (error) {

    console.error("Update Order Status Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

/*** 🔥 Update Individual Item Status*/
const updateItemStatus = async (req, res) => {

  try {

    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const allowedItemStatuses = [
      "Pending",
      "Preparing",
      "Ready",
      "Served",
      "Cancelled",
    ];

    if (!allowedItemStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);
    const oldStatus = item.status;

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in order",
      });
    }

    /**
     * 🔥 Update Item Status
     */
    item.status = status;

    /**
     * 🔥 Recalculate Bill
     */
    calculateBill(order);

    /**
     * 🔥 Auto Order Status Update
     */
    const anypreparing = order.items.some(
      (i) => i.status === "Preparing" || i.status === "Ready"
    );


    const allServed = order.items.every(
      (i) => i.status === "Served" || i.status === "Cancelled"
    );



    if (allServed) {
      order.orderStatus = "Served";
      io.to(req.restaurantId.toString()).emit("UpdatedOrderstatus", {
        order
      });
    }
    else if (anypreparing) {
      order.orderStatus = "Preparing";
      io.to(req.restaurantId.toString()).emit("UpdatedOrderstatus", {
        order
      });
    }

    await order.save();
    io.to(req.restaurantId.toString()).emit("itemStatusUpdated", {
      orderId: order._id,
      item: item,
      oldStatus: oldStatus,
    });


    res.status(200).json({
      success: true,
      message: "Item status updated successfully",
      order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = { updateItemStatus, updateOrderStatus, getDashboardStats, addOrder, getOrderById, getOrders, updateOrder, addItemToOrder, removeItemFromOrder, closeOrder };