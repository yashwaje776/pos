const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/tableModel");
const moment = require("moment-timezone");

// ==============================
// DATE HELPERS
// ==============================
const TZ = "Asia/Kolkata";

// Start of Today
const startOfDay = () => {
    return moment().tz(TZ).startOf("day").toDate();
};

// Start of Week (Monday)
const startOfWeek = () => {
    return moment().tz(TZ).startOf("isoWeek").toDate();
};

// Start of Month
const startOfMonth = () => {
    return moment().tz(TZ).startOf("month").toDate();
};

// Start of Year
const startOfYear = () => {
    return moment().tz(TZ).startOf("year").toDate();
};

// ==============================
// MAIN CONTROLLER
// ==============================

exports.getAnalyticesData = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: "Invalid restaurantId" });
        }

        const restId = new mongoose.Types.ObjectId(restaurantId);

        const today = startOfDay();
        const week = startOfWeek();
        const month = startOfMonth();
        const year = startOfYear();

        const yesterday = moment(today).tz(TZ).subtract(1, "day").toDate();

        const lastWeek = moment(week).tz(TZ).subtract(1, "week").toDate();
        const lastMonth = moment(month).tz(TZ).subtract(1, "month").toDate();
        const lastYear = moment(year).tz(TZ).subtract(1, "year").toDate();

        // ✅ COMMON FILTER (IMPORTANT)
        const baseMatch = {
            restaurantId: restId,
            orderStatus: { $in: ["Completed"] },
            isPaid: true,
        };

        /* ================= BASIC STATS ================= */

        const [categories, dishes, activeOrders, tables] = await Promise.all([
            Category.countDocuments({ restaurantId }),
            MenuItem.countDocuments({ restaurantId }),
            Order.countDocuments({
                restaurantId,
                orderStatus: { $in: ["Pending", "Preparing", "Served"] },
            }),
            Table.countDocuments({ restaurantId }),
        ]);

        const stats = { categories, dishes, activeOrders, tables };

        /* ================= RANGE STATS ================= */

        const getRangeStats = async (currentStart, previousStart) => {
            const [current, previous] = await Promise.all([
                Order.find({
                    ...baseMatch,
                    createdAt: { $gte: currentStart },
                }).lean(),

                Order.find({
                    ...baseMatch,
                    createdAt: { $gte: previousStart, $lt: currentStart },
                }).lean(),
            ]);

            const sumRevenue = (orders) =>
                orders.reduce((a, o) => a + (o.bills?.total || 0), 0);

            const sumCustomers = (orders) =>
                orders.reduce((a, o) => a + (o.customerDetails?.guests || 0), 0);

            return {
                revenue: {
                    today: sumRevenue(current),
                    yesterday: sumRevenue(previous),
                },
                orders: {
                    today: current.length,
                    yesterday: previous.length,
                },
                customers: {
                    today: sumCustomers(current),
                    yesterday: sumCustomers(previous),
                },
            };
        };

        const statCards = {
            Day: await getRangeStats(today, yesterday),
            Week: await getRangeStats(week, lastWeek),
            Month: await getRangeStats(month, lastMonth),
            Year: await getRangeStats(year, lastYear),
            Overall: await getRangeStats(new Date(0), lastYear),
        };

        /* ================= TOP DISHES ================= */

        const topDishesRaw = await Order.aggregate([
            {
                $match: {
                    restaurantId: restId,
                    orderStatus: { $in: ["Completed"] },
                    isPaid: true
                }
            },
            { $unwind: "$items" },

            {
                $group: {
                    _id: "$items.menuItem",
                    name: { $first: "$items.name" },
                    totalOrders: { $sum: "$items.quantity" }
                }
            },

            {
                $lookup: {
                    from: "menuitems",
                    localField: "_id",
                    foreignField: "_id",
                    as: "menuItemData"
                }
            },

            { $unwind: { path: "$menuItemData", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    _id: 0,
                    name: 1,
                    totalOrders: 1,
                    image: "$menuItemData.image.url"
                }
            },

            { $sort: { totalOrders: -1 } },
            { $limit: 6 }
        ]);

        const totalDishOrders = topDishesRaw.reduce(
            (acc, d) => acc + d.totalOrders,
            0
        );

        const dishRows = topDishesRaw.map((d) => ({
            name: d.name,
            orders: d.totalOrders,
            image: d.image || null,
            percent: totalDishOrders
                ? Math.round((d.totalOrders / totalDishOrders) * 100)
                : 0,
        }));

        /* ================= CHART DATA ================= */

        // -------- DAY --------
        const dayRaw = await Order.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: today } } },
            {
                $group: {
                    _id: {
                        $hour: {
                            date: "$createdAt",
                            timezone: TZ
                        }
                    },
                    sales: { $sum: "$bills.total" },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const dayMap = {};
        dayRaw.forEach((d) => (dayMap[d._id] = d));

        const dayData = Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            sales: dayMap[i]?.sales || 0,
            orders: dayMap[i]?.orders || 0,
        }));

        // -------- WEEK --------
        const weekRaw = await Order.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: week } } },
            {
                $group: {
                    _id: {
                        $dayOfWeek: {
                            date: "$createdAt",
                            timezone: TZ
                        }
                    },
                    sales: { $sum: "$bills.total" },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const weekMap = {};
        weekRaw.forEach((d) => (weekMap[d._id] = d));

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const weekData = Array.from({ length: 7 }, (_, i) => ({
            name: dayNames[i],
            sales: weekMap[i + 1]?.sales || 0,
            orders: weekMap[i + 1]?.orders || 0,
        }));

        // -------- MONTH (FIXED) --------
        const monthRaw = await Order.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: month } } },
            {
                $addFields: {
                    weekOfMonth: {
                        $ceil: {
                            $divide: [
                                { $dayOfMonth: "$createdAt" },
                                7
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$weekOfMonth",
                    sales: { $sum: "$bills.total" },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const monthMap = {};
        monthRaw.forEach((d) => (monthMap[d._id] = d));

        const monthData = Array.from({ length: 5 }, (_, i) => ({
            name: `Week ${i + 1}`,
            sales: monthMap[i + 1]?.sales || 0,
            orders: monthMap[i + 1]?.orders || 0,
        }));

        // -------- YEAR --------
        const yearRaw = await Order.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: year } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    sales: { $sum: "$bills.total" },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const yearMap = {};
        yearRaw.forEach((d) => (yearMap[d._id] = d));

        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const yearData = Array.from({ length: 12 }, (_, i) => ({
            name: monthNames[i],
            sales: yearMap[i + 1]?.sales || 0,
            orders: yearMap[i + 1]?.orders || 0,
        }));

        // -------- OVERALL --------
        const overallRaw = await Order.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    sales: { $sum: "$bills.total" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const overallData = overallRaw.map((d) => ({
            name: d._id.toString(),
            sales: d.sales,
            orders: d.orders,
        }));

        const chartDataMap = {
            Day: dayData,
            Week: weekData,
            Month: monthData,
            Year: yearData,
            Overall: overallData,
        };

        /* ================= PEAK HOURS ================= */

        const peakRaw = await Order.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: {
                        $hour: {
                            date: "$createdAt",
                            timezone: TZ
                        }
                    },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const hourMap = {};
        for (let i = 0; i < 24; i++) hourMap[i] = 0;

        peakRaw.forEach((h) => {
            hourMap[h._id] = h.orders;
        });

        const sorted = Object.entries(hourMap)
            .map(([hour, orders]) => ({ hour: Number(hour), orders }))
            .sort((a, b) => b.orders - a.orders);

        const [lunchHour, eveningHour] = sorted;
        const slowHour = sorted[sorted.length - 1];

        const formatHour = (h) => {
            const suffix = h >= 12 ? "PM" : "AM";
            const hour = h % 12 || 12;
            return `${hour}${suffix}`;
        };

        const peakHours = [
            {
                label: "Lunch Rush",
                time: `${formatHour(lunchHour.hour)} - ${formatHour(lunchHour.hour + 1)}`,
                orders: lunchHour.orders,
            },
            {
                label: "Evening Rush",
                time: `${formatHour(eveningHour.hour)} - ${formatHour(eveningHour.hour + 1)}`,
                orders: eveningHour.orders,
            },
            {
                label: "Slow Hours",
                time: `${formatHour(slowHour.hour)} - ${formatHour(slowHour.hour + 1)}`,
                orders: slowHour.orders,
            },
        ];

        /* ================= RESPONSE ================= */

        res.json({
            success: true,
            stats,
            statCards,
            dishRows,
            chartDataMap,
            peakHours,
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};