import React, { useEffect, useState } from "react";
import { Home, ShoppingCart, Table2, Layers, UtensilsCrossed, Grid3x3, Activity } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PeakHoursCard from "../components/shared/PeakHoursCard";
import { getDashboardAnalytics } from "../https";
import { useDispatch, useSelector } from "react-redux";
import { fetchAnalyticsStart, fetchAnalyticsSuccess, fetchAnalyticsFailure } from "../redux/slices/analyticsSlice";

/* -------------------- SMALL UI COMPONENTS -------------------- */

const BottomItem = ({ icon, label, active }) => (
    <div
        className={`flex flex-col items-center text-xs gap-1 ${active ? "text-yellow-400" : "text-gray-400"
            }`}
    >
        {icon}
        {label}
    </div>
);

const Sparkline = ({ color = "#facc15" }) => (
    <svg
        className="absolute bottom-0 left-0 w-full h-16 opacity-40"
        viewBox="0 0 200 60"
    >
        <path
            d="M0 50 C20 40, 40 45, 60 30 S100 20, 120 25 S160 10, 200 5"
            fill="none"
            stroke={color}
            strokeWidth="2"
        />
    </svg>
);

const ProgressRing = ({ percent }) => (
    <div className="relative w-14 h-14 z-10">
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        <div
            className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent rotate-45"
            style={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
            {percent}%
        </div>
    </div>
);

const StatCard = ({ title, today, yesterday, range }) => {
    const difference = today - yesterday;
    const percent = yesterday
        ? ((difference / yesterday) * 100).toFixed(1)
        : 0;
    const isPositive = difference >= 0;
    const comparisonLabel = {
        Day: "vs Yesterday",
        Week: "vs Last Week",
        Month: "vs Last Month",
        Year: "vs Last Year",
        Overall: "vs Last Year"
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
            <Sparkline />
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-gray-400 text-sm">{title}</p>
                    <h3 className="text-2xl font-semibold mt-2">
                        {title === "Revenue" ? `₹${today}` : today}
                    </h3>
                    <p
                        className={`text-sm mt-2 font-medium ${isPositive ? "text-green-400" : "text-red-400"
                            }`}
                    >
                        {isPositive ? "↑" : "↓"} {Math.abs(percent)}%{" "}
                        {comparisonLabel[range]}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {range} Analytics
                    </p>
                </div>
                <ProgressRing percent={Math.min(Math.abs(percent), 100)} />
            </div>
        </div>
    );
};

/* -------------------- DISH ROW -------------------- */

const DishRow = ({ name, orders, percent, image }) => {
    const imgName = name.toLowerCase().replace(/\s/g, "-");
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-4">
                <img
                    src={image}
                    alt={name}
                    className="w-12 h-12 rounded-lg object-cover border border-white/10"
                />
                <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-gray-400">Orders {orders}</p>
                </div>
            </div>
            <div className="text-green-400 text-sm font-medium bg-green-400/10 px-3 py-1 rounded-lg">
                + {percent}%
            </div>
        </div>
    );
};

/* -------------------- FILTER TABS -------------------- */

const filters = ["Day", "Week", "Month", "Year", "Overall"];

const FilterTabs = ({ selected, setSelected }) => (
    <div className="flex gap-3 flex-wrap">
        {filters.map((f) => (
            <button
                key={f}
                onClick={() => setSelected(f)}
                className={`px-4 py-1.5 rounded-lg text-sm ${selected === f
                    ? "bg-yellow-500 text-black font-semibold"
                    : "bg-[#2a2a2a] text-gray-400"
                    }`}
            >
                {f}
            </button>
        ))}
    </div>
);

/* ---------------- MAIN DASHBOARD ---------------- */

export default function RestroDashboard() {
    const [range, setRange] = useState("Overall");
    const [chartType, setChartType] = useState("sales");
    const dispatch = useDispatch();
    const dashboardData = useSelector((state) => state.analytics.data);
    /* -------- FETCH DATA -------- */
    useEffect(() => {
        if (dashboardData) return;
        const fetchData = async () => {
            try {
                dispatch(fetchAnalyticsStart());
                const response = await getDashboardAnalytics();
                const data = response?.data || response;
                dispatch(fetchAnalyticsSuccess(data));
            } catch (error) {
                dispatch(fetchAnalyticsFailure(error.message));
            }
        };
        fetchData();
    }, [dispatch]);

    /* -------- SAFE FALLBACKS -------- */
    const peakHours = dashboardData?.peakHours || {
        lunchRush: "12PM - 2PM",
        eveningRush: "7PM - 10PM",
        slowHours: "3PM - 5PM"
    };

    const stats = dashboardData?.stats || {
        categories: 0,
        dishes: 0,
        activeOrders: 0,
        tables: 0
    };

    const statCards =
        dashboardData?.statCards?.[range] || {
            revenue: { today: 0, yesterday: 0 },
            orders: { today: 0, yesterday: 0 },
            customers: { today: 0, yesterday: 0 }
        };

    const dishRows = dashboardData?.dishRows || [];

    const chartData =
        dashboardData?.chartDataMap?.[range] ||
        dashboardData?.chartDataMap?.["Overall"] ||
        [];

    /* -------- RENDER -------- */
    return (
        <div className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
            {/* FILTERS */}
            <div className="flex justify-between flex-wrap gap-4">
                <h1 className="text-2xl font-semibold">
                    Advanced Analytics ({range})
                </h1>
                <FilterTabs selected={range} setSelected={setRange} />
            </div>
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Revenue"
                    today={statCards.revenue.today}
                    yesterday={statCards.revenue.yesterday}
                    range={range}
                />
                <StatCard
                    title="Orders"
                    today={statCards.orders.today}
                    yesterday={statCards.orders.yesterday}
                    range={range}
                />
                <StatCard
                    title="Customers"
                    today={statCards.customers.today}
                    yesterday={statCards.customers.yesterday}
                    range={range}
                />
            </div>
            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3">
                    <Layers /> Categories: {stats.categories}
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3">
                    <UtensilsCrossed /> Dishes: {stats.dishes}
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3">
                    <Activity /> Active Orders: {stats.activeOrders}
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3">
                    <Grid3x3 /> Tables: {stats.tables}
                </div>
            </div>
            {/* CHART TYPE SWITCH */}
            <div className="flex gap-3">
                {["sales", "orders"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-4 py-1 rounded-lg text-sm ${chartType === type
                            ? "bg-yellow-500 text-black"
                            : "bg-[#2a2a2a]"
                            }`}
                    >
                        {type.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* CHART */}
            <div className="bg-zinc-900 p-6 rounded-xl">
                <h2 className="mb-4 font-semibold capitalize">
                    {chartType} Overview
                </h2>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid stroke="#333" />
                            <XAxis dataKey="name" stroke="#aaa" />
                            <YAxis stroke="#aaa" />
                            <Tooltip
                                contentStyle={{
                                    background: "#222",
                                    border: "none"
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey={chartType}
                                stroke="#facc15"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* POPULAR DISHES */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl p-6 shadow-xl">
                <h3 className="text-xl font-semibold mb-6">
                    Popular Dishes
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                    {dishRows.map((dish, index) => (
                        <DishRow
                            key={index}
                            name={dish.name}
                            image={dish.image}
                            orders={dish.orders}
                            percent={dish.percent}
                        />
                    ))}
                </div>
            </div>

            <PeakHoursCard data={peakHours} />
        </div>
    );
}