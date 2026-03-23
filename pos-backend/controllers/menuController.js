const Category = require("../models/Category");
const createHttpError = require("http-errors");
const MenuItem = require("../models/MenuItem");

const addCategory = async (req, res, next) => {
  try {

    const { name } = req.body;
    const role = req.userRole;

    // ✅ Role check (ONLY admin & manager)
    if (!["admin", "manager"].includes(role)) {
      return next(createHttpError(403, "Access denied. Only admin or manager can add category"));
    }

    // ✅ Validation
    if (!name) {
      return next(createHttpError(400, "Category name is required"));
    }

    if (!req.file) {
      return next(createHttpError(400, "Category image is required"));
    }

    const restaurantId = req.restaurantId;

    const existing = await Category.findOne({ restaurantId, name });

    if (existing) {
      return next(createHttpError(400, "Category already exists"));
    }

    let imageData = {};

    if (req.file) {
      imageData = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    const category = await Category.create({
      name,
      restaurantId,
      image: imageData
    });

    res.status(201).json({
      success: true,
      data: category
    });

  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;

    const categories = await Category.find({ restaurantId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: categories });

  } catch (error) {
    next(error);
  }
};
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, enabled } = req.body;
    const role = req.userRole;
    const restaurantId = req.restaurantId;

    // ✅ Role check (ONLY admin & manager)
    if (!["admin", "manager"].includes(role)) {
      return next(createHttpError(403, "Access denied. Only admin or manager can update category"));
    }

    // ✅ Find existing category
    const category = await Category.findOne({ _id: id, restaurantId });

    if (!category) {
      return next(createHttpError(404, "Category not found"));
    }

    // ✅ Update name (with duplicate check)
    if (name && name !== category.name) {
      const existing = await Category.findOne({
        restaurantId,
        name: { $regex: `^${name}$`, $options: "i" }
      });

      if (existing) {
        return next(createHttpError(400, "Category name already exists"));
      }

      category.name = name;
    }

    // ✅ Update enabled status safely
    if (typeof enabled !== "undefined") {
      category.enabled = enabled;
    }

    // ✅ Optional: Update image
    if (req.file) {
      category.image = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    });

  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId;

    const category = await Category.findOneAndDelete({
      _id: id,
      restaurantId,
    });

    if (!category) {
      return next(createHttpError(404, "Category not found"));
    }

    res.status(200).json({ success: true, message: "Category deleted" });

  } catch (error) {
    next(error);
  }
};
const addMenuItem = async (req, res, next) => {
  try {
    const { name, categoryId, isVeg, variants } = req.body;

    if (!name || !categoryId) {
      return next(createHttpError(400, "Name and category required"));
    }

    const restaurantId = req.restaurantId;

    let parsedVariants = [];

    if (variants) {
      parsedVariants = JSON.parse(variants);
    }

    const menuItem = await MenuItem.create({
      name,
      categoryId,
      restaurantId,
      isVeg: isVeg === "true" || isVeg === true,
      variants: parsedVariants,
      image: req.file
        ? {
          url: req.file.path,
          public_id: req.file.filename,
        }
        : undefined,
    });

    res.status(201).json({
      success: true,
      data: menuItem,
    });

  } catch (error) {
    next(error);
  }
};
const getMenuItems = async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId;

    const menu = await MenuItem.find({ restaurantId })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: menu });

  } catch (error) {
    next(error);
  }
};
const updateMenuItem = async (req, res, next) => {
  try {

    const { id } = req.params;
    const restaurantId = req.restaurantId;

    if (!id) {
      return next(createHttpError(400, "Menu item ID is required"));
    }

    const updateData = { ...req.body };

    if (req.body.variants) {
      updateData.variants = JSON.parse(req.body.variants);
    }

    if (req.file) {
      updateData.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: id, restaurantId },
      updateData,
      { new: true }
    );

    if (!menuItem) {
      return next(createHttpError(404, "Menu item not found"));
    }

    res.status(200).json({
      success: true,
      data: menuItem,
    });

  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId;

    const menuItem = await MenuItem.findOneAndDelete({
      _id: id,
      restaurantId,
    });

    if (!menuItem) {
      return next(createHttpError(404, "Menu item not found"));
    }

    res.status(200).json({ success: true, message: "Menu item deleted" });

  } catch (error) {
    next(error);
  }
};

module.exports = { addCategory, getCategories, updateCategory, deleteCategory, addMenuItem, getMenuItems, updateMenuItem, deleteMenuItem };