import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/shared/Header";
import SideBar from "../components/shared/SideBar";
import { getOrders, updateItemStatus } from "../https";
import { socket } from "../socket";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

/* ---------------- ITEM CARD ---------------- */

const ItemCard = ({
    item,
    orderId,
    tableNo,
    orderType,
    customer,
    createdAt,
    onStatusChange
}) => {

    const [minutesAgo, setMinutesAgo] = useState(
        Math.floor((Date.now() - new Date(createdAt)) / 60000)
    );

    useEffect(() => {

        const timer = setInterval(() => {
            setMinutesAgo(
                Math.floor((Date.now() - new Date(createdAt)) / 60000)
            );
        }, 60000);

        return () => clearInterval(timer);

    }, [createdAt]);

    /* ---------- URGENCY BORDER ---------- */

    let borderColor = "border-gray-700";

    if (minutesAgo > 20) borderColor = "border-red-500";
    else if (minutesAgo > 10) borderColor = "border-yellow-400";

    const itemName = item.name || item.menuItem?.name;
    const image = item.menuItem?.image?.url;

    return (

        <div className={`bg-[#1F2126] p-5 rounded-xl border ${borderColor} shadow-lg transition`}>

            {/* HEADER */}

            <div className="flex justify-between items-start gap-4">

                <div className="flex gap-3">

                    {image && (
                        <img
                            src={image}
                            alt={itemName}
                            className="w-12 h-12 rounded-md object-cover"
                        />
                    )}

                    <div>

                        <p className="font-semibold text-lg">
                            {itemName}
                        </p>

                        {orderType === "DINE_IN" ? (
                            <p className="text-xs text-gray-400">
                                Table {tableNo || "N/A"} • {customer || "Guest"}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">
                                Takeaway • {customer || "Guest"}
                            </p>
                        )}

                        <p className="text-xs text-gray-500">
                            {minutesAgo} min ago
                        </p>

                    </div>

                </div>

                <p className="text-yellow-400 font-bold">
                    x{item.quantity}
                </p>

            </div>

            {/* STATUS BADGE */}

            <div className="mt-3">

                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
          ${item.status === "Pending" && "bg-blue-500/20 text-blue-400"}
          ${item.status === "Preparing" && "bg-yellow-500/20 text-yellow-400"}
          ${item.status === "Ready" && "bg-green-500/20 text-green-400"}
          ${item.status === "Served" && "bg-purple-500/20 text-purple-400"}
          ${item.status === "Cancelled" && "bg-red-500/20 text-red-400"}
        `}
                >
                    {item.status}
                </span>

            </div>

            {/* VARIANT */}

            {item.variant?.name && (
                <p className="text-xs text-gray-400 mt-2">
                    Variant: {item.variant.name}
                </p>
            )}

            {/* NOTES */}

            {item.notes && (
                <p className="text-xs text-red-400 mt-2">
                    Note: {item.notes}
                </p>
            )}

            {/* STATUS ACTION BUTTONS */}
            {
                item.status !== "Served" && item.status !== "Cancelled" && (
                    <div className="flex gap-2 mt-4">

                        <button
                            onClick={() => onStatusChange(orderId, item._id, "Preparing")}
                            className={`flex-1 py-1 rounded-md text-sm
                ${item.status === "Preparing"
                                    ? "bg-yellow-600 text-black"
                                    : "bg-yellow-500 hover:bg-yellow-600 text-black"
                                }`}
                        >
                            Preparing
                        </button>

                        <button
                            onClick={() => onStatusChange(orderId, item._id, "Ready")}
                            className={`flex-1 py-1 rounded-md text-sm
                ${item.status === "Ready"
                                    ? "bg-green-700 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-black"
                                }`}
                        >
                            Ready
                        </button>

                    </div>
                )
            }
        </div>
    );
};

/* ---------------- MAIN PAGE ---------------- */

export default function Kitchen() {

    const [orders, setOrders] = useState([]);
    const [activeFilter, setActiveFilter] = useState("Active");
    const { user } = useSelector((state) => state.user);

    const fetchOrders = async () => {
        try {
            const res = await getOrders();
            setOrders(res?.data?.data || []);
            console.log("Fetched orders in Kitchen.jsx:", res?.data?.data || []);
        } catch (err) {
            console.error(err);
        }

    };

    useEffect(() => {
        fetchOrders();
        socket.emit("joinRestaurant", user?.restaurantId);

        const handleItemAdded = (data) => {
            toast.success(`New item: ${data.menuItem?.name} X ${data.latestItem.quantity} added `);

            setOrders(prevOrders => {
                return prevOrders.map(order => {
                    if (order._id === data.orderId) {
                        return {
                            ...order,
                            items: [
                                ...order.items,
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
        const handleItemStatusUpdated = ({ orderId, item }) => {
            if (item.status === "Cancelled") {
                const itemName = item.name || item.menuItem?.name || "Item";
                toast.info(`${itemName} (x${item.quantity}) has been cancelled`);
            }
            setOrders(prevOrders =>
                prevOrders.map(order => {
                    if (order._id !== orderId) return order;
                    return {
                        ...order,
                        items: order.items.map(i =>
                            i._id === item._id ? item : i
                        )
                    };
                })
            );
        }
        const handleOrderStatusUpdated = ({ order }) => {
            setOrders(prevOrders =>
                prevOrders.map(o =>
                    o._id === order._id ? { ...o, orderStatus: order.orderStatus } : o
                )
            );
        };



        socket.on("itemAdded", handleItemAdded);
        socket.on("itemStatusUpdated", handleItemStatusUpdated);
        socket.on("UpdatedOrderstatus", handleOrderStatusUpdated);

        return () => {
            socket.off("itemAdded", handleItemAdded);
            socket.off("itemStatusUpdated", handleItemStatusUpdated);
            socket.off("UpdatedOrderstatus", handleOrderStatusUpdated);
        };
    }, [user?.restaurantId]);
    const handleItemStatusChange = async (orderId, itemId, status) => {
        try {
            await updateItemStatus({ orderId, itemId, status });

            toast.success(`Item marked as ${status}`);

        } catch (err) {
            toast.error("Failed to update item ");
        }
    };

    /* ---------- FLATTEN ITEMS ---------- */

    const kitchenItems = orders
        .filter(order =>
            order.orderStatus !== "Cancelled" &&
            order.orderStatus !== "Completed"
        )
        .flatMap(order =>
            order.items.map(item => ({
                ...item,
                orderId: order._id,
                orderType: order.orderType,
                tableNo: order.orderType === "DINE_IN" ? order.table?.tableNo : null,
                customer: order.customerDetails?.name,
                createdAt: item.addedAt
            }))
        );

    /* ---------- ACTIVE ITEMS ---------- */

    const activeItems = kitchenItems
        .filter(item => {
            if (activeFilter === "All") {
                return true; // show everything
            }

            if (activeFilter === "Active") {
                return item.status !== "Served" && item.status !== "Cancelled" && item.status !== "Ready";
            }

            return item.status === activeFilter;
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <main className="flex-1 overflow-y-auto p-8 no-scrollbar">

            <div className="flex justify-between items-center mb-8">

                <h2 className="text-3xl font-semibold">
                    Kitchen Display
                </h2>
                <div className="flex gap-3">

                    {["Active", "Pending", "Preparing", "Ready", "Served", "Cancelled"].map((status) => (

                        <button
                            key={status}
                            onClick={() => setActiveFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm
      ${activeFilter === status
                                    ? "bg-yellow-500 text-black"
                                    : "bg-gray-800 text-gray-300"}
      `}
                        >
                            {status}{status !== "All" &&
                                ` (${status === "Active"
                                    ? kitchenItems.filter(
                                        item => item.status !== "Served" && item.status !== "Cancelled" && item.status !== "Ready"
                                    ).length
                                    : kitchenItems.filter(item => item.status === status).length
                                })`}
                        </button>

                    ))}

                </div>



            </div>

            {activeItems.length === 0 && (
                <p className="text-gray-500 text-center py-20">
                    No kitchen items
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {activeItems.map(item => (

                    <ItemCard
                        key={item._id}
                        item={item}
                        orderId={item.orderId}
                        orderType={item.orderType}
                        tableNo={item.tableNo}
                        customer={item.customer}
                        createdAt={item.createdAt}
                        onStatusChange={handleItemStatusChange}
                    />

                ))}

            </div>

        </main>
    );
}