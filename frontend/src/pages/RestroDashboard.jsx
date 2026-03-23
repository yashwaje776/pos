import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Table2, Search, DollarSign, Users } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats } from "../https";
import { addRealtimeOrder, fetchAnalyticsStats } from "../redux/slices/analyticsSlice";
import { socket } from "../socket";
import { Utensils, LayoutGrid, ChefHat, BarChart3 } from "lucide-react";
import CreateOrderModal from "../components/orderspage/CreateOrderModal";

/* ---------------- STAT CARD ---------------- */

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="relative hover:scale-[1.02] cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#232428] to-[#1E1F23] border border-white/10 p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group">

      <div className="absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition" />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-gray-400 text-xs sm:text-sm mb-1">{title}</p>
          <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-white">
            {value}
          </h3>
        </div>

        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
          {icon}
        </div>
      </div>

      <svg className="absolute bottom-0 left-0 w-full h-12 opacity-40" viewBox="0 0 200 60">
        <path
          d="M0 50 C20 40, 40 45, 60 30 S100 20, 120 25 S160 10, 200 5"
          fill="none"
          stroke="#facc15"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

/* ---------------- ORDER ROW ---------------- */


const OrderRow = ({ order }) => {
  const initials = order?.customerName
    ?.split(" ")
    ?.map((n) => n[0])
    ?.join("");

  const navigate = useNavigate();

  const isNew =
    Date.now() - new Date(order.createdAt).getTime() < 6 * 60 * 1000;

  const statusColor = {
    Ready: "bg-green-400",
    Preparing: "bg-yellow-400",
    Pending: "bg-red-400",
    Completed: "bg-blue-400",
    Cancelled: "bg-gray-400",
    Served: "bg-blue-300",
  };

  return (
    <div
      onClick={() => navigate(`/menu/${order.orderId}`)}
      className={`group cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/5 
      bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-md 
      transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]
      ${isNew ? "ring-1 ring-yellow-400/60" : ""}`}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 text-black font-bold rounded-xl flex items-center justify-center shadow">
          {initials || "NA"}
        </div>

        {/* Name + Amount */}
        <div>
          <p className="font-medium text-sm sm:text-base flex items-center gap-2">
            {order?.customerName}

            {/* NEW badge */}
            {isNew && (
              <span className="text-[10px] bg-yellow-400 text-black px-2 py-[2px] rounded-full">
                NEW
              </span>
            )}
          </p>

          <p className="text-xs text-gray-400">₹{order?.total}</p>
        </div>
      </div>

      {/* CENTER INFO */}
      <div className="flex flex-col sm:items-center text-xs text-gray-500">
        <span className="font-mono">#{order.orderId}</span>
        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-between sm:justify-end gap-3">

        {/* Table */}
        <span className="border border-yellow-400/50 text-yellow-400 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
          {order?.tableNo ? `Table ${order?.tableNo}` : `TAKEAWAY`}
        </span>

        {/* Status with dot */}
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm bg-white/5">
          <span
            className={`w-2 h-2 rounded-full ${statusColor[order?.status] || "bg-gray-500"
              }`}
          />
          {order?.status}
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-yellow-400/5 to-transparent transition pointer-events-none" />
    </div>
  );
};
/* ---------------- MAIN DASHBOARD ---------------- */

export default function RestroDashboard() {
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { stats } = useSelector((state) => state.analytics);
  const { user } = useSelector((state) => state.user);
  const role = user.role;
  const isWaiter = role === "waiter"

  const dashboard = stats || {};
  const summary = dashboard?.summary || {};
  const kitchen = dashboard?.kitchenActivity || {};

  /* FETCH */


  const fetchData = async () => {
    try {
      const res = await getDashboardStats();
      dispatch(fetchAnalyticsStats(res.data.data));
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchData(); // initial load

    const interval = setInterval(fetchData, 120000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    socket.emit("joinRestaurant", user?.restaurantId);

    const handleOrderCreated = (data) => {
      dispatch(addRealtimeOrder(data.order));
      toast.success(`New Order #${data.order._id}`, {
        toastId: data.order._id
      });
    };

    const handleItemAdded = ({ orderId, latestItem, menuItem }) => {
      dispatch({
        type: "analytics/itemAdded",
        payload: {
          orderId,
          item: latestItem,
          menuItem
        }
      });
      toast.info(`Item added: ${menuItem?.name}`, {
        toastId: "item-added",
      });
    };

    const handleItemStatusUpdated = ({ item, oldStatus }) => {
      if (item.status === "Ready") {
        toast.success("🍽️ Item Ready!", { toastId: "item-ready" });
      }
      dispatch({
        type: "analytics/itemStatusUpdated",
        payload: {
          item,
          newStatus: item.status,
          oldStatus
        }
      });
    };

    const handleOrderStatusUpdated = ({ order }) => {
      if (order.orderStatus === "Completed") {
        toast.success("✅ Order Completed", { toastId: "order-done" });
      }
      if (order.orderStatus === "Cancelled") {
        toast.info("Order Cancelled", { toastId: "order-Cancelled" })
      }
      dispatch({
        type: "analytics/orderStatusUpdated",
        payload: order
      });
    };

    socket.on("orderCreated", handleOrderCreated);
    socket.on("itemAdded", handleItemAdded);
    socket.on("itemStatusUpdated", handleItemStatusUpdated);
    socket.on("UpdatedOrderstatus", handleOrderStatusUpdated);
    return () => {
      socket.off("orderCreated", handleOrderCreated);
      socket.off("itemAdded", handleItemAdded);
      socket.off("itemStatusUpdated", handleItemStatusUpdated);
      socket.off("UpdatedOrderstatus", handleOrderStatusUpdated);
    };
  }, [user?.restaurantId, dispatch]);

  /* CLOCK */

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* FILTER */

  const orders = useMemo(() => {
    return (dashboard?.recentOrders || []).filter((o) =>
      o?.customerName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, dashboard]);

  const [isModalOpen, setIsModalOpen] = useState(false);


  /* GREETING */

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" :
      hour < 18 ? "Good Afternoon" : "Good Evening";

  const maxRevenue = Math.max(
    ...(dashboard?.salesChart?.map(i => i.revenue) || [1])
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 no-scrollbar">
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400 bg-[#1a1b1f] px-4 py-2 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live Orders Active
        </div>
        <div>
          {summary?.activeOrders || 0} Orders Running
        </div>
      </div>

      {/* HEADER */}
      <div className="flex flex-row md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h2 className="text-xl sm:text-3xl font-semibold">
            {greeting}, {user?.name}
          </h2>
          <p className="text-gray-400 text-sm">
            Give your best service today 😊
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-xl sm:text-3xl font-semibold ">
            {time.toLocaleTimeString()}
          </p>
          <p className="text-gray-400 text-sm">
            {time.toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${isWaiter ? "xl:grid-cols-4" : "xl:grid-cols-5"} gap-4`}>
        {
          (!isWaiter &&
            <StatCard title="Revenue Today" value={`₹${summary?.todayRevenue || 0}`} icon={<DollarSign size={20} />} />
          )
        }
        <StatCard title="Orders Today" value={summary?.todayOrders || 0} icon={<ShoppingCart size={20} />} />
        <StatCard title="Active Tables" value={summary?.activeTables || 0} icon={<Table2 size={20} />} />
        <StatCard title="Active Orders" value={summary?.activeOrders || 0} icon={<Users size={20} />} />
        <StatCard
          title="Available Tables"
          value={(dashboard?.tableStatus?.length || 0) - (summary?.activeTables || 0)}
          icon={<Table2 size={20} />}
        />
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${isWaiter ? "xl:grid-cols-3" : "xl:grid-cols-5"} gap-4`}>
        <CreateOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
        {/* PRIMARY ACTION - NEW ORDER */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex flex-col items-center justify-center gap-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl text-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95"
        >
          <ShoppingCart size={20} />
          <span>New Order</span>
        </button>

        {/* PAYMENT */}
        {(!isWaiter &&
          <>
            <button
              onClick={() => navigate("/billing")}
              className="group flex flex-col items-center justify-center gap-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl text-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              <DollarSign size={20} />
              <span>Payment</span>
            </button>

            {/* KITCHEN ACTIVITY */}
            <button
              onClick={() => navigate("/kitchen")}
              className="group flex flex-col items-center justify-center gap-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl text-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              <ChefHat size={20} className="text-yellow-400 group-hover:scale-110 transition" />
              <span>Kitchen</span>
            </button>
          </>
        )}
        {/* TABLE MANAGEMENT */}
        <button
          onClick={() => navigate("/tables")}
          className="group flex flex-col items-center justify-center gap-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl text-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95"
        >
          <LayoutGrid size={20} className="text-yellow-400 group-hover:scale-110 transition" />
          <span>Tables</span>
        </button>

        {/* ACTIVE ORDERS */}
        <button
          onClick={() => navigate("/orders")}
          className="group flex flex-col items-center justify-center gap-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl text-sm border border-white/10 hover:bg-white/10 transition-all active:scale-95"
        >
          <Users size={20} className="text-yellow-400 group-hover:scale-110 transition" />
          <span>Active Orders</span>
        </button>

      </div>

      {/* SALES */}
      {(!isWaiter &&
        <div className="bg-zinc-900/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Sales Today</h2>

            <span className="text-xs text-gray-400">
              Peak:{" "}
              <span className="text-yellow-400 font-medium">
                {dashboard?.salesChart?.reduce((a, b) =>
                  a.revenue > b.revenue ? a : b
                )?.hour || "--"}
                :00
              </span>
            </span>
          </div>

          {/* TOTAL REVENUE */}
          <p className="text-sm text-gray-400 mb-3">
            Total:{" "}
            <span className="text-white font-semibold">
              ₹{summary?.todayRevenue || 0}
            </span>
          </p>

          {/* CHART */}
          <div className="flex items-end gap-2 sm:gap-3 min-w-[600px] h-44 relative">
            {dashboard?.salesChart?.map((item) => {
              const barHeight = (item.revenue / maxRevenue) * 150;

              const isPeak =
                item.hour ===
                dashboard?.salesChart?.reduce((a, b) =>
                  a.revenue > b.revenue ? a : b
                )?.hour;

              return (
                <div
                  key={item.hour}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >


                  {/* VALUE */}
                  {item.revenue > 0 && (
                    <span className="text-[10px] text-yellow-400 mb-1 opacity-0 group-hover:opacity-100 transition">
                      ₹{item.revenue}
                    </span>
                  )}

                  {/* BAR */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 
              ${item.revenue === 0 ? "bg-transparent" : "bg-yellow-400"}
              ${isPeak ? "ring-2 ring-yellow-300" : ""}
              group-hover:bg-yellow-300`}
                    style={{
                      height: `${Math.max(barHeight, 6)}px`,
                    }}
                    title={`₹${item.revenue} at ${item.hour}:00`}
                  />

                  {/* BASE LINE */}
                  <div className="bg-yellow-300/50 h-[1px] w-full" />

                  {/* TIME */}
                  <span className="text-[10px] sm:text-xs text-gray-400 mt-1">
                    {item.hour % 12 || 12}
                    {item.hour < 12 ? "AM" : "PM"}
                  </span>

                  {/* PEAK INDICATOR */}
                  {isPeak && (
                    <span className="absolute -top-3 text-[10px] text-yellow-300">
                      🔥
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECENT ORDERS */}
      <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-white/10">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Orders</h2>
          <button className="text-blue-400 text-sm" onClick={() => navigate("/orders")}>
            View all
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders"
            className="w-full bg-[#2a2a2a] pl-10 pr-4 py-2 rounded-lg text-sm"
          />
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
          {orders.length > 0 ? (
            orders.map((order) => (
              <OrderRow key={order.orderId} order={order} />
            ))
          ) : (
            <div className="text-center text-gray-500 py-6">
              <p>No orders yet</p>
              <p className="text-xs">New orders will appear here in real-time</p>
            </div>
          )}
        </div>
      </div>

      {/* TABLE + KITCHEN */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Table Status</h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(dashboard?.tableStatus || []).map((t) => (
              <div
                key={t._id}
                className={`p-2 sm:p-3 text-center rounded-lg text-xs sm:text-sm ${t.status === "Available"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
                  }`}
              >
                T{t.tableNo}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Kitchen Activity</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Pending</span>
              <span className="text-red-400">{kitchen?.Pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Preparing</span>
              <span className="text-yellow-400">{kitchen?.Preparing || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Ready</span>
              <span className="text-green-400">{kitchen?.Ready || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Served</span>
              <span className="text-blue-400">{kitchen?.Served || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Cancelled</span>
              <span className="text-red-400">{kitchen?.Cancelled || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP ITEMS */}
      <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-white/10">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Top Selling Items</h2>
        {dashboard?.topItems?.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <p>No sales yet</p>
            <p className="text-xs">Start taking orders to see analytics</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {dashboard?.topItems?.map((item) => (
              <div
                key={item.menuItemId || item.name}
                className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="text-sm">{item.name}</span>
                </div>

                <span className="text-yellow-400 text-sm">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>

  );
}