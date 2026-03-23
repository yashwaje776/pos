import React, { useState, useMemo, useEffect } from "react";
import {
    ShoppingCart,
    Plus,
    Minus,
    ArrowLeft,
    Trash2
} from "lucide-react";

import { useParams, useNavigate } from "react-router-dom";

import {
    getCategories,
    getMenuItems,
    getOrderForTable,
    addItemToOrder,
    updateOrderStatus,
    updateItemStatus
} from "../https";
import { useSelector } from "react-redux";
import { socket } from "../socket";
import { toast } from "react-toastify";

export default function MenuPage() {

    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.user)

    const [categories, setCategories] = useState([]);
    const [foods, setFoods] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);

    const [selectedItem, setSelectedItem] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");


    /* ---------------- FETCH DATA ---------------- */
    useEffect(() => {
        fetchCategories();
        fetchFoods();
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        socket.emit("joinRestaurant", user?.restaurantId);

        const handleItemAdded = (data) => {

            if (data.orderId?.toString() !== currentOrder?._id?.toString()) return;
            toast.success(
                `New order item: ${data.menuItem?.name} (x${data.latestItem.quantity})`
            );
            setCurrentOrder(prev => ({
                ...prev,
                items: [
                    ...prev.items,
                    {
                        ...data.latestItem,
                        menuItem: data.menuItem
                    }
                ]
            }));
        };

        const handleItemStatusUpdated = ({ orderId, item }) => {
            if (orderId?.toString() !== currentOrder?._id?.toString()) return;
            if (item.status === "Served") {
                toast.success(` ${item.name} served`);
            } else if (item.status === "Cancelled") {
                toast.error(` ${item.name} cancelled`);
            } else if (item.status === "Ready") {
                toast.info(` ${item.name} ready`);
            }

            setCurrentOrder(prev => ({
                ...prev,
                items: prev.items.map(i =>
                    i._id === item._id ? item : i
                )
            }));
        };

        const handleOrderStatusUpdated = ({ order }) => {
            if (order._id?.toString() !== currentOrder?._id?.toString()) return;
            setCurrentOrder(prev => ({
                ...prev,
                orderStatus: order.orderStatus
            }));
        };

        socket.on("itemAdded", handleItemAdded);
        socket.on("itemStatusUpdated", handleItemStatusUpdated);
        socket.on("UpdatedOrderstatus", handleOrderStatusUpdated);

        return () => {
            socket.off("itemAdded", handleItemAdded);
            socket.off("itemStatusUpdated", handleItemStatusUpdated);
            socket.off("UpdatedOrderstatus", handleOrderStatusUpdated);
        };
    }, [user?.restaurantId, currentOrder?._id]);

    useEffect(() => {
        if (currentOrder?.orderStatus === "Completed" || currentOrder?.orderStatus === "Cancelled") {
            alert("Order is completed! or Cancelled Redirecting to tables...");
            navigate("/tables");
        }
    }, [currentOrder?.orderStatus]);

    const fetchCategories = async () => {
        const res = await getCategories();
        // Only enabled categories
        const data = res.data.data.filter(cat => cat.enabled === true);

        setCategories(data);

        if (data.length > 0) {
            setActiveCategory(data[0]._id);
        }
    };

    const fetchFoods = async () => {
        const res = await getMenuItems();
        setFoods(res.data.data);
    };

    const fetchOrder = async () => {
        try {
            const res = await getOrderForTable(orderId);
            setCurrentOrder(res.data.data);
        } catch (error) {
            navigate("/tables");
        }
    };

    /* ---------------- FILTER FOODS ---------------- */

    const filteredFoods = useMemo(() => {
        if (!activeCategory) return [];

        return foods.filter(
            f =>
                f.categoryId?._id === activeCategory &&
                f.isAvailable === true
        );
    }, [foods, activeCategory]);

    /* ---------------- ADD ITEM ---------------- */

    const handleAddItem = async (item, qty = 1) => {
        if (!currentOrder?._id) return;

        const res = await addItemToOrder({
            orderId: currentOrder._id,
            menuItemId: item._id,
            variant: item.variant,
            quantity: qty,
            notes: notes
        });

        setCurrentOrder(res.data.data);
    };

    const confirmAddItem = async () => {

        if (!selectedItem) return;

        await handleAddItem(selectedItem, quantity, notes);

        setShowConfirm(false);
        setSelectedItem(null);
        setQuantity(1);
        setNotes("");
    };

    const items = currentOrder?.items || [];
    const subtotal = currentOrder?.bills?.subtotal || 0;
    const tax = currentOrder?.bills?.tax || 0;
    const total = currentOrder?.bills?.total || 0;
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);

    const statusColor = status => {
        switch (status) {

            case "Pending":
                return "bg-yellow-500/20 text-yellow-400";

            case "Preparing":
                return "bg-blue-500/20 text-blue-400";

            case "Ready":
                return "bg-green-500/20 text-green-400";

            case "Served":
                return "bg-emerald-500/20 text-emerald-400";

            default:
                return "bg-red-500/20 text-red-400";
        }
    };

    const handleOrderStatusChange = async (orderId, status) => {
        try {
            await updateOrderStatus({ orderId, status });
        } catch (error) {
            toast.error("Something went wrong");
        }
    };
    const handleItemStatusChange = async (orderId, itemId, status) => {
        try {
            await updateItemStatus({ orderId, itemId, status });
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        if (a.status === "Cancelled" && b.status !== "Cancelled") return 1;
        if (a.status !== "Cancelled" && b.status === "Cancelled") return -1;
        return 0;
    });

    /* ---------------- UI ---------------- */

    return (


        <div className="flex flex-1 overflow-hidden ">

            {/* LEFT SECTION */}

            <div className="flex-1 flex flex-col px-4 py-6 sm:p-8 overflow-y-auto no-scrollbar min-h-0">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 transition rounded-full flex items-center justify-center"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <h1 className="text-xl sm:text-2xl font-semibold">
                        Menu – OrderId #{orderId.slice(-5)}
                    </h1>
                </div>

                {/* CATEGORIES */}
                <div className="sticky top-0 z-10 flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
                    {categories.map(cat => (
                        <button
                            key={cat._id}
                            onClick={() => setActiveCategory(cat._id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border-2 border-gray-500
                ${activeCategory === cat._id
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                    : "bg-[#1c1c1c] text-gray-300 hover:bg-[#2a2a2a]"
                                }`}
                        >
                            {cat.image?.url && (
                                <img
                                    src={cat.image.url}
                                    alt={cat.name}
                                    className="w-5 h-5 rounded-full object-cover"
                                />
                            )}
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* FOOD GRID */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">

                    {filteredFoods.map(item => (
                        <div
                            key={item._id}
                            className="group bg-[#1a1a1a] hover:bg-[#222] transition-all duration-200 rounded-xl border border-white/5 overflow-hidden hover:border-indigo-500/40"
                        >

                            {/* IMAGE */}
                            {item.image?.url && (
                                <div className="h-40 w-full overflow-hidden flex-shrink-0">
                                    <img
                                        src={item.image.url}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                </div>
                            )}

                            {/* CONTENT */}
                            <div className="p-4">

                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-gray-200 text-sm">
                                        {item.name}
                                    </h3>

                                    {/* VEG / NON VEG */}
                                    <span
                                        className={`w-3 h-3 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"
                                            }`}
                                    />
                                </div>

                                {item.description && (
                                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                                        {item.description}
                                    </p>
                                )}

                                {/* VARIANTS */}
                                <div className="flex flex-wrap gap-2">
                                    {item.variants.map(v => (
                                        <button
                                            key={v.name}
                                            onClick={() => {
                                                setSelectedItem({
                                                    ...item,
                                                    variant: v
                                                });
                                                setShowConfirm(true);
                                                setQuantity(1);
                                                setNotes("");
                                            }}
                                            className="flex items-center justify-between gap-2 bg-[#242424] hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                        >
                                            <span>{v.name}</span>
                                            <span className="text-yellow-400">₹{v.price}</span>
                                        </button>
                                    ))}
                                </div>

                            </div>
                        </div>
                    ))}

                </div>

            </div>

            <div className="w-80 md:w-96 bg-[#0c0c0c] border-l border-white/10 flex flex-col">

                {/* HEADER */}
                <div className="px-5 py-2 border-b border-white/10">
                    <div className="bg-gradient-to-br from-[#1c1c1c] to-[#161616] rounded-2xl p-4 border border-white/5 flex items-center justify-between">

                        <div>
                            <p className="text-[10px] text-gray-500 tracking-wider uppercase">
                                Customer

                            </p>

                            <p className="text-white font-semibold text-base">
                                {currentOrder?.customerDetails?.name || "Guest"}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                {currentOrder?.orderType === "DINE_IN"
                                    ? `Table ${currentOrder?.table?.tableNo || "N/A"}`
                                    : `Order #${orderId?.slice(-5) || "-----"}`
                                }
                                {" • "}
                                {currentOrder?.orderType || "Unknown"}
                            </p>

                            <p className="text-[11px] text-gray-500 mt-1">
                                {currentOrder?.createdAt
                                    ? new Date(currentOrder.createdAt).toLocaleTimeString()
                                    : ""}
                            </p>
                        </div>

                        <div className="w-12 h-12 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold text-lg shadow-md">
                            {currentOrder?.customerDetails?.name?.charAt(0) || "G"}
                        </div>
                    </div>
                </div>



                {/* ITEMS */}
                <div className="flex-1 overflow-y-auto px-5 space-y-3 no-scrollbar mt-1">

                    {sortedItems.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20 text-sm">
                            🛒 No items added
                        </div>
                    ) : (
                        sortedItems.map(i => (
                            <div
                                key={i._id}
                                className={`rounded-xl p-4 border transition-all
                    ${i.status === "Cancelled"
                                        ? "bg-[#141414] border-red-500/20 opacity-60"
                                        : "bg-[#1a1a1a] border-white/5 hover:border-indigo-500/30"
                                    }`}
                            >

                                {/* TOP */}
                                <div className="flex justify-between">

                                    <div>
                                        <h3 className={`text-sm font-medium
                                ${i.status === "Cancelled"
                                                ? "line-through text-gray-500"
                                                : "text-white"}
                            `}>
                                            {i.name}
                                        </h3>

                                        <p className="text-xs text-gray-400">
                                            {i.variant.name}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            ₹{i.variant.price} × {i.quantity}
                                        </p>
                                        <p className="text-sm font-semibold text-white">
                                            ₹{i.subtotal}
                                        </p>
                                    </div>
                                </div>

                                {/* NOTES */}
                                {i.notes && (
                                    <p className="text-xs text-yellow-400 mt-2">
                                        📝 {i.notes}
                                    </p>
                                )}

                                {/* FOOTER */}
                                <div className="flex justify-between items-center mt-3">

                                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusColor(i.status)}`}>
                                        {i.status}
                                    </span>

                                    {/* ACTIONS */}
                                    <div className="flex gap-2">

                                        {i.status === "Cancelled" ? (
                                            <button
                                                onClick={() =>
                                                    handleAddItem({
                                                        _id: i.menuItem,
                                                        variant: i.variant,
                                                    }, 1)
                                                }
                                                className="px-2 py-1 text-xs rounded-md bg-[#262626] hover:bg-green-500/20 hover:text-green-400 transition"
                                            >
                                                Re-add
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleAddItem({
                                                            _id: i.menuItem,
                                                            variant: i.variant,
                                                        }, 1)
                                                    }
                                                    className="px-2 py-1 text-xs rounded-md bg-[#262626] hover:bg-green-500/20 hover:text-green-400 transition"
                                                >
                                                    + Add
                                                </button>

                                                {i.status === "Ready" && (
                                                    <button
                                                        onClick={() =>
                                                            handleItemStatusChange(currentOrder._id, i._id, "Served")
                                                        }
                                                        className="px-2 py-1 text-xs rounded-md bg-[#262626] hover:bg-blue-500/20 hover:text-blue-400 transition"
                                                    >
                                                        Serve
                                                    </button>
                                                )}

                                                {i.status !== "Served" && (
                                                    <button
                                                        onClick={() =>
                                                            handleItemStatusChange(currentOrder._id, i._id, "Cancelled")
                                                        }
                                                        className="px-2 py-1 text-xs rounded-md bg-[#262626] hover:bg-red-500/20 hover:text-red-400 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </>
                                        )}

                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* BILL SECTION */}
                <div className="px-5 py-2 border-t border-white/10 bg-[#0f0f0f] sticky bottom-0">

                    <div className="bg-[#151515] rounded-xl p-4 border border-white/5 space-y-1">

                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Items ({totalItems})</span>
                            <span>₹{subtotal}</span>
                        </div>

                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Tax</span>
                            <span>₹{tax}</span>
                        </div>

                        <div className="border-t border-white/10 " />

                        <div className="flex justify-between text-lg font-semibold text-white">
                            <span>Total</span>
                            <span className="text-yellow-400">₹{total}</span>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-2 space-y-2">
                        <button
                            disabled={items.length === 0}
                            onClick={() => handleOrderStatusChange(currentOrder._id, "Completed")}
                            className={`w-full py-2 rounded-xl font-semibold transition
                ${items.length === 0
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-green-500 hover:bg-green-600 text-black shadow-lg shadow-green-500/20"
                                }`}
                        >
                            Complete Order
                        </button>

                        <button
                            onClick={() => handleOrderStatusChange(currentOrder._id, "Cancelled")}
                            className="w-full py-2 rounded-xl bg-red-500 hover:bg-red-600 text-black text-sm font-medium transition"
                        >
                            Cancel Order
                        </button>
                    </div>
                </div>
            </div>
            {showConfirm && selectedItem && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

                    <div className="w-[95%] max-w-md bg-[#181818] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fadeIn">

                        {/* HEADER */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Add Item
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Customize your order
                                </p>
                            </div>

                            <button
                                onClick={() => setShowConfirm(false)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* ITEM INFO */}
                        <div className="p-5 flex gap-4 items-center border-b border-white/10">
                            {selectedItem.image?.url && (
                                <img
                                    src={selectedItem.image.url}
                                    alt={selectedItem.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            )}

                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-white">
                                    {selectedItem.name}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {selectedItem.variant.name}
                                </p>
                                <p className="text-sm text-yellow-400 font-semibold mt-1">
                                    ₹{selectedItem.variant.price}
                                </p>
                            </div>
                        </div>

                        {/* QUANTITY */}
                        <div className="p-5 border-b border-white/10">
                            <p className="text-xs text-gray-400 mb-3">Quantity</p>

                            <div className="flex items-center justify-center gap-6">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-red-500/20 hover:text-red-400 transition"
                                >
                                    <Minus size={16} />
                                </button>

                                <span className="text-xl font-semibold text-white w-10 text-center">
                                    {quantity}
                                </span>

                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-green-500/20 hover:text-green-400 transition"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* NOTES */}
                        <div className="p-5 border-b border-white/10">
                            <p className="text-xs text-gray-400 mb-2">Notes (optional)</p>

                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. No onion, extra spicy..."
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-none"
                                rows={3}
                            />
                        </div>

                        {/* TOTAL + ACTIONS */}
                        <div className="p-5">

                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-400">Total</span>
                                <span className="text-lg font-semibold text-yellow-400">
                                    ₹{selectedItem.variant.price * quantity}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 rounded-lg bg-[#2a2a2a] text-gray-300 hover:bg-[#333] transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={confirmAddItem}
                                    className="flex-1 py-2.5 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 transition"
                                >
                                    Add to Order
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div >


    );
}