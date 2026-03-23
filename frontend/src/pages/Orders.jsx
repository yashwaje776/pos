import React, { useEffect, useState } from "react";
import { getOrders, updateItemStatus, updateOrderStatus } from "../https";
import OrderDetailsModal from "../components/orderspage/OrderDetailsModal";
import { useSelector } from "react-redux";
import { socket } from "../socket";
import { toast } from "react-toastify";

/* ---------------- STATUS BADGE ---------------- */

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-blue-500/15 text-blue-400 border-blue-500/40",
    Preparing: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
    Served: "bg-purple-500/15 text-purple-400 border-purple-500/40",
    Completed: "bg-green-500/15 text-green-400 border-green-500/40",
    Cancelled: "bg-red-500/15 text-red-400 border-red-500/40",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm
      ${styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/30"}`}
    >
      {status}
    </span>
  );
};

/* ---------------- ORDER CARD ---------------- */
const OrderCard = ({ order, onClick }) => {
  const initials =
    order.customerDetails?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "G";

  const minutesAgo = Math.floor(
    (Date.now() - new Date(order.createdAt)) / 60000
  );

  let borderColor = "border-gray-800";
  let glow = "";

  if (minutesAgo > 20) {
    borderColor = "border-red-500/60";
    glow = "shadow-red-500/10";
  } else if (minutesAgo > 10) {
    borderColor = "border-yellow-400/60";
    glow = "shadow-yellow-400/10";
  }

  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#1F2126] rounded-2xl p-5 border ${borderColor}
      hover:border-yellow-400 hover:bg-[#23262d] transition-all cursor-pointer
      shadow-md ${glow} hover:shadow-xl flex flex-col h-full`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-yellow-300 to-yellow-500 
          text-black font-bold rounded-xl flex items-center justify-center text-sm shadow-inner">
            {initials}
          </div>

          <div className="space-y-0.5">
            <p className="font-semibold text-white">
              {order.customerDetails?.name || "Guest"}
            </p>

            {/* ✅ FIXED HERE */}
            <p className="text-xs text-gray-400">
              {order.orderType === "DINE_IN"
                ? `Table ${order.table?.tableNo || "N/A"}`
                : `Order #${order._id?.slice(-5) || "-----"}`
              }
              {" • "}
              {order.orderType}
            </p>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              ⏱ {minutesAgo} mins ago
            </p>
          </div>
        </div>

        <StatusBadge status={order.orderStatus} />
      </div>

      {/* ITEMS */}
      <div className="mt-4 text-sm text-gray-300 space-y-2">
        {order.items?.length > 0 ? (
          <>
            {order.items.slice(0, 2).map((item) => (
              <div key={item._id} className="flex justify-between items-center">
                <p className="truncate max-w-[70%]">
                  {item.quantity} × {item.name}
                </p>

                <p className="text-gray-400 text-xs">
                  ₹{item.subtotal}
                </p>
              </div>
            ))}

            {order.items.length > 2 && (
              <p className="text-gray-500 text-xs italic">
                +{order.items.length - 2} more items
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-xs italic">
            No items added yet
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-gray-800 mt-auto pt-4 flex justify-between items-center">
        <p className="text-xs text-gray-400">
          {order.items?.length || 0} items
        </p>

        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">
            Total
          </p>
          <p className="text-lg font-bold text-yellow-400">
            ₹{order.bills?.total || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN PAGE ---------------- */

export default function RestroOrders() {

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("Active");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useSelector((state) => state.user)
  const role = user?.role;
  const filters = [
    "All",
    "Active",
    "Pending",
    "Preparing",
    "Served",
    "Completed",
    "Cancelled",
  ];

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch orders");
    }
  };

  useEffect(() => {
    fetchOrders();

    if (user?.restaurantId) {
      socket.emit("joinRestaurant", user.restaurantId);
    }
    const handleItemAdded = (data) => {
      toast.success("Item added to order");

      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order._id === data.orderId) {
            return {
              ...order,
              items: [
                ...(order.items || []), ,
                {
                  ...data.latestItem,
                  menuItem: data.menuItem
                }
              ]
            };
          }
          return order;
        });
      });
    };
    const handleItemStatusUpdated = ({ orderId, item, oldStatus }) => {

      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order._id !== orderId) return order;

          let updatedItems = order.items.map(i =>
            i._id === item._id ? item : i
          );

          // Recalculate subtotal
          let newSubtotal = updatedItems.reduce((sum, i) => {
            // Exclude cancelled items
            if (i.status === "Cancelled") return sum;
            return sum + (i.subtotal || 0);
          }, 0);

          // Tax = 5%
          let newTax = newSubtotal * 0.05;

          // Discount (keep existing or 0)
          let discount = order.bills?.discount || 0;

          let newTotal = newSubtotal + newTax - discount;

          return {
            ...order,
            items: updatedItems,
            bills: {
              ...order.bills,
              subtotal: newSubtotal,
              tax: newTax,
              total: newTotal
            }
          };
        })
      );
    };
    const handleOrderCreated = ({ order }) => {
      setOrders(prevOrders => [order, ...prevOrders]);
      toast.success("New order received!");
    }
    const handleOrderStatusUpdated = ({ order }) => {
      toast.success(`Order:${order._id}  status :${order.orderStatus}`);
      setOrders(prevOrders => {
        return prevOrders.map(o =>
          o._id === order._id
            ? { ...o, orderStatus: order.orderStatus }
            : o
        );
      });
    };

    socket.on("itemAdded", handleItemAdded);
    socket.on("itemStatusUpdated", handleItemStatusUpdated);
    socket.on("UpdatedOrderstatus", handleOrderStatusUpdated);
    socket.on("orderCreated", handleOrderCreated);

    return () => {
      socket.off("itemAdded", handleItemAdded);
      socket.off("itemStatusUpdated", handleItemStatusUpdated);
      socket.off("UpdatedOrderstatus", handleOrderStatusUpdated);
      socket.off("orderCreated", handleOrderCreated);
    };
  }, [user]);



  useEffect(() => {
    if (!selectedOrder) return;

    const updated = orders.find(o => o._id === selectedOrder._id);
    if (updated) {
      setSelectedOrder(updated);
    }
  }, [orders]);

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : activeFilter === "Active"
        ? orders.filter(
          (o) =>
            o.orderStatus !== "Completed" &&
            o.orderStatus !== "Cancelled"
        )
        : orders.filter(
          (order) => order.orderStatus === activeFilter
        );

  const countOrders = (status) => {

    if (status === "All") return orders.length;
    if (status === "Active") {
      return orders.filter(
        (o) => o.orderStatus !== "Completed" && o.orderStatus !== "Cancelled"
      ).length;
    }

    return orders.filter(
      (o) => o.orderStatus === status
    ).length;

  };

  return (


    <main className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">
            Orders
          </h2>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-700 text-gray-300">
            {orders.length} orders
          </span>
        </div>

        {/* FILTERS */}
        <div className="flex gap-3 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${activeFilter === filter
                  ? "bg-yellow-500 text-black shadow"
                  : "bg-[#22252c] text-gray-400 hover:text-white hover:bg-[#2b2e36]"
                }`}
            >
              {filter} ({countOrders(filter)})
            </button>
          ))}
        </div>
      </div>

      {/* EMPTY */}
      {filteredOrders.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          No orders found
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onClick={() => setSelectedOrder(order)}
          />
        ))}
      </div>
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}

          role={role}
        />
      )}
    </main>
  );
}
