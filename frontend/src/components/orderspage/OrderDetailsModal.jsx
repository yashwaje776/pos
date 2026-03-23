import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateItemStatus, updateOrderStatus } from "../../https";
import { toast } from "react-toastify";

const OrderDetailsModal = ({
    order,
    onClose,
    role
}) => {
    const [localOrder, setLocalOrder] = useState(order);
    const navigate = useNavigate();
    const isChange = role == "admin" || role == "manager" || role == "waiter"
    const allServed = localOrder.items.every(
        (item) => item.status === "Served" || item.status === "Cancelled"
    );

    useEffect(() => {
        setLocalOrder(order);
    }, [order]);
    console.log(localOrder)

    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!localOrder) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
            case "Preparing":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "Served":
                return "bg-green-500/10 text-green-400 border-green-500/20";
            case "Completed":
                return "bg-green-600/10 text-green-500 border-green-600/20";
            case "Cancelled":
                return "bg-red-500/10 text-red-400 border-red-500/20";
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    const handleOrderStatusChange = async (orderId, status) => {
        try {
            if (localOrder.orderStatus === status) return;
            if (
                localOrder.orderStatus === "Completed" ||
                localOrder.orderStatus === "Cancelled"
            ) {
                toast.error("Order already finalized");
                return;
            }
            await updateOrderStatus({ orderId, status });
            toast.success("Order status updated");
            let updatedItems = localOrder.items;

            if (status === "Cancelled") {
                updatedItems = localOrder.items.map((item) => ({
                    ...item,
                    status: "Cancelled",
                }));
            }

            const updatedOrder = {
                ...localOrder,
                orderStatus: status,
                items: updatedItems,
            };

            setLocalOrder(updatedOrder);
        } catch (error) {
            toast.error("Failed to update order status");
        }
    };

    const handleItemStatusChange = async (orderId, itemId, status) => {
        try {
            const item = localOrder.items.find(i => i._id === itemId);

            // 🚫 Prevent invalid transitions
            if (!item) return;

            if (item.status === "Cancelled" || item.status === "Served") {
                toast.error("Item already finalized");
                return;
            }

            await updateItemStatus({ orderId, itemId, status });
            toast.success("Item status updated");
            const updatedItems = localOrder.items.map((item) =>
                item._id === itemId ? { ...item, status } : item
            );

            const updatedOrder = {
                ...localOrder,
                items: updatedItems,
            };

            setLocalOrder(updatedOrder);
        } catch (error) {
            toast.error("Failed to update item status");
        }
    };
    const confirmCancel = () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        handleOrderStatusChange(localOrder._id, "Cancelled");
    };




    const activeItems = localOrder.items?.filter(
        (item) => item.status !== "Cancelled"
    );

    const cancelledItems = localOrder.items?.filter(
        (item) => item.status === "Cancelled"
    );

    const isOrderLocked =
        localOrder.orderStatus === "Completed" ||
        localOrder.orderStatus === "Cancelled";

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 "
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden  rounded-3xl border border-white/10 bg-[#0f1115]/95 shadow-2xl animate-[fadeIn_.25s_ease]"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0f1115]/80 backdrop-blur">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            Order #{localOrder._id.slice(-5)}
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            {localOrder.customerDetails?.name || "Guest"}
                            {" "}  • {localOrder.orderType}
                            • Table{" "} #{localOrder.table?.tableNo || localOrder._id.slice(-5)}
                        </p>

                        <span
                            className={`inline-flex items-center gap-1 mt-3 px-3 py-1 text-xs rounded-full border ${getStatusColor(
                                localOrder.orderStatus
                            )}`}
                        >
                            {localOrder.orderStatus}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {isChange && !isOrderLocked && (
                            <button
                                onClick={() =>
                                    navigate(`/menu/${localOrder._id}`)
                                }
                                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-xl shadow-md transition active:scale-95"
                            >
                                + Add Item
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT */}
                    <div className="w-[65%] overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {
                            [...(activeItems || []), ...(cancelledItems || [])].map((item) => {
                                const canServe = item.status === "Ready"
                                const isLocked = !canServe;

                                return (
                                    <div
                                        key={item._id}
                                        className={`rounded-2xl p-5 flex justify-between items-center transition border border-white/5 bg-[#16181d] hover:bg-[#1c1f26] hover:scale-[1.01] ${item.status === "Cancelled"
                                            ? "opacity-40"
                                            : ""
                                            }`}
                                    >
                                        <div>
                                            <p className="text-white font-semibold text-lg">
                                                {item.name}
                                            </p>

                                            <p className="text-xs text-gray-400 mt-1">
                                                ₹{item.variant?.price} × {item.quantity}
                                            </p>

                                            {item.variant?.name && (
                                                <p className="text-xs text-gray-500">
                                                    {item.variant.name}
                                                </p>
                                            )}

                                            {item.notes && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    {item.notes}
                                                </p>
                                            )}

                                            <span
                                                className={`inline-flex mt-3 px-2.5 py-1 text-[11px] rounded-full border ${getStatusColor(
                                                    item.status
                                                )}`}
                                            >
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-yellow-400 font-bold text-lg">
                                                ₹{item.subtotal}
                                            </p>
                                            {isChange && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        disabled={isLocked}
                                                        onClick={() =>
                                                            handleItemStatusChange(
                                                                localOrder._id,
                                                                item._id,
                                                                "Served"
                                                            )
                                                        }
                                                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition 
${isLocked
                                                                ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                                                                : "bg-purple-500 hover:bg-purple-600 text-black active:scale-95"
                                                            }`}
                                                    >
                                                        Serve
                                                    </button>

                                                    <button
                                                        disabled={item.status === "Cancelled"}
                                                        onClick={() =>
                                                            handleItemStatusChange(
                                                                localOrder._id,
                                                                item._id,
                                                                "Cancelled"
                                                            )
                                                        }
                                                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition 
${item.status === "Cancelled"
                                                                ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                                                                : "bg-red-500 hover:bg-red-600 text-black active:scale-95"
                                                            }`}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* RIGHT */}
                    <div className="w-[35%] border-l border-white/10 bg-[#0c0e12] p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-6">
                                Order Summary
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl">
                                    <p className="text-xs text-gray-400">Active</p>
                                    <p className="text-2xl font-bold text-white">
                                        {activeItems?.length || 0}
                                    </p>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl">
                                    <p className="text-xs text-gray-400">
                                        Cancelled
                                    </p>
                                    <p className="text-2xl font-bold text-red-400">
                                        {cancelledItems?.length || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-white/10 mt-6 pt-4 text-sm space-y-2 text-gray-400">
                                <div className="flex justify-between">
                                    <span>Items Total</span>
                                    <span>₹{localOrder.bills?.subtotal || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>₹{localOrder.bills?.tax || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-5">
                                <p className="text-sm text-gray-400">Total</p>
                                <p className="text-4xl font-extrabold text-yellow-400 mt-1">
                                    ₹{localOrder.bills?.total || 0}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {isOrderLocked && (
                                    <div className={`px-4 py-2 rounded-lg text-sm font-semibold text-center 
            ${localOrder.orderStatus === "Completed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {localOrder.orderStatus === "Completed"
                                            ? " Order Completed"
                                            : " Order Cancelled"}
                                    </div>
                                )}
                                {isChange && !isOrderLocked && (
                                    <button
                                        disabled={!allServed}
                                        onClick={() => handleOrderStatusChange(localOrder._id, "Completed")}
                                        className={`w-full py-3 rounded-xl font-semibold transition
    ${!allServed
                                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                                : "bg-green-500 hover:bg-green-600 text-black active:scale-95"
                                            }`}
                                    >
                                        Complete Order
                                    </button>
                                )}
                                {isChange && !isOrderLocked && (
                                    <button
                                        disabled={isOrderLocked}
                                        onClick={confirmCancel
                                        }
                                        className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-black text-sm transition disabled:opacity-50"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.97); }
                    to { opacity: 1; transform: scale(1); }
                }
                `}
            </style>
        </div>
    );
};

export default OrderDetailsModal;