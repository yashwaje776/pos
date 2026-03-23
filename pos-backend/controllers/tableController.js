const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose")

const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats } = req.body;

    if (!tableNo || !seats) {
      return next(createHttpError(400, "Table number and seats are required!"));
    }

    // Get restaurantId from verified user middleware
    const restaurantId = req.restaurantId;

    if (!restaurantId) {
      return next(createHttpError(400, "Restaurant not identified"));
    }

    // ✅ Check table inside same restaurant only
    const isTablePresent = await Table.findOne({
      restaurantId,
      tableNo,
    });

    if (isTablePresent) {
      return next(createHttpError(400, "Table already exists in this restaurant!"));
    }

    // ✅ Create table with restaurantId
    const newTable = await Table.create({
      restaurantId,
      tableNo,
      seats,
    });

    res.status(201).json({
      success: true,
      message: "Table added successfully!",
      data: newTable,
    });

  } catch (error) {

    // Handle duplicate key error (extra safety)
    if (error.code === 11000) {
      return next(createHttpError(400, "Table number already exists!"));
    }

    next(error);
  }
};
const getTables = async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;

    if (!restaurantId) {
      return next(createHttpError(400, "Restaurant not identified"));
    }

    const tables = await Table.find({
      restaurantId,
      isActive: true,
    })
      .populate({
        path: "currentOrder",
        select: "customerDetails orderNumber totalAmount status",
      })
      .sort({ tableNo: 1 });

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};
const updateTable = async (req, res, next) => {
  try {
    const { status, orderId } = req.body;

    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        const error = createHttpError(404, "Invalid id!");
        return next(error);
    }

    const table = await Table.findByIdAndUpdate(
        id,
      { status, currentOrder: orderId },
      { new: true }
    );

    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return error;
    }

    res.status(200).json({success: true, message: "Table updated!", data: table});

  } catch (error) {
    next(error);
  }
};

module.exports = { addTable, getTables, updateTable };
