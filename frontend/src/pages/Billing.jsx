import React, { useEffect, useState } from "react";
import { getOrders, } from "../https";
import {
    createOrderRazorpay,
    verifyPaymentRazorpay,
} from "../https";

export default function BillingScreen() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const subtotal = selectedOrder?.bills?.subtotal || 0;
    const tax = selectedOrder?.bills?.tax || 0;
    const total = selectedOrder?.bills?.total || 0;

    // ✅ Get display label (Table or Takeaway)
    const getOrderLabel = (order) => {
        if (order.orderType === "DINE_IN") {
            if (!order?.table) return "Table N/A";
            if (typeof order.table === "object") {
                return `Table ${order.table.tableNo}`;
            }
            return `Table ${order.table}`;
        } else {
            // TAKEAWAY
            return `Takeaway • ${order.customerDetails?.name || "Guest"}`;
        }
    };

    // ✅ Payment Handler
    const handlePayment = async (method) => {
        if (!selectedOrder) return;

        try {
            // ✅ Offline payments (Cash / Card)
            if (method === "Cash" || method === "Card") {
                alert(`Not implement yet`);

                // 👉 Ideally call backend here too (optional improvement)

                fetchOrders();
                setSelectedOrder(null);
                return;
            }

            // ================= RAZORPAY (UPI) =================

            // 1️⃣ Create Razorpay Order
            const { data } = await createOrderRazorpay({
                orderId: selectedOrder._id,
            });

            const { razorpayOrder } = data;

            // 2️⃣ Razorpay Options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Restro",
                description: "Order Payment",
                order_id: razorpayOrder.id,

                method: {
                    upi: true,          // ✅ ADD THIS LINE
                    card: true,
                    netbanking: true,
                    wallet: true
                },

                handler: async function (response) {
                    try {
                        // 3️⃣ Verify Payment
                        await verifyPaymentRazorpay({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: selectedOrder._id,
                        });
                        alert("Payment successful ✅");
                        fetchOrders();
                        setSelectedOrder(null);
                    } catch (err) {
                        console.error(err);
                        alert("Payment verification failed ❌");
                    }
                },
                prefill: {
                    name: selectedOrder.customerDetails?.name || "Guest",
                },
                theme: {
                    color: "#FACC15",
                },
            };

            // 4️⃣ Open Razorpay
            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", function (response) {
                console.error(response);
                alert("Payment failed ❌");
            });

            razorpay.open();

        } catch (err) {
            console.error(err);
            alert("Payment failed ❌");
        }
    };

    // ✅ Fetch Orders
    const fetchOrders = async () => {
        try {
            const res = await getOrders();
            const fetchedOrders = res?.data?.data || [];

            // ✅ Only orders ready for billing
            const billingOrders = fetchedOrders.filter(
                (order) =>
                    order.orderStatus === "Served" &&
                    order.isPaid === false
            );

            setOrders(billingOrders);

            // ✅ Keep selected order if still exists
            if (selectedOrder) {
                const updated = billingOrders.find(
                    (o) => o._id === selectedOrder._id
                );
                setSelectedOrder(updated || billingOrders[0] || null);
            } else if (billingOrders.length) {
                setSelectedOrder(billingOrders[0]);
            }

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        document.title = "POS | Billing";

        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="flex flex-1 overflow-hidden">

            {/* LEFT PANEL */}
            <div className="w-1/4 border-r border-gray-800 p-5 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                    Billing Queue
                </h2>

                <div className="space-y-3">

                    {orders.length === 0 && (
                        <p className="text-gray-400 text-sm">
                            No orders ready
                        </p>
                    )}

                    {orders.map((order) => (
                        <div
                            key={order._id}
                            onClick={() => setSelectedOrder(order)}
                            className={`p-3 rounded-lg cursor-pointer border
                            ${selectedOrder?._id === order._id
                                    ? "bg-yellow-400 text-black"
                                    : "bg-[#1F2126] border-gray-800"
                                }`}
                        >
                            <p className="font-semibold">
                                {getOrderLabel(order)}
                            </p>

                            <p className="text-xs opacity-70">
                                {order.customerDetails?.name || "Guest"}
                            </p>

                            <p className="text-sm mt-1">
                                ₹{order.bills?.total || 0}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER PANEL */}
            <div className="flex-1 p-6 overflow-y-auto">

                {!selectedOrder ? (
                    <p className="text-gray-400">
                        Select an order
                    </p>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold mb-6">
                            {getOrderLabel(selectedOrder)}
                        </h2>

                        <div className="space-y-4">

                            {selectedOrder.items?.map((item) => (
                                <div
                                    key={item._id}
                                    className={`flex justify-between p-4 rounded-lg
                                    ${item.status === "Cancelled"
                                            ? "bg-red-900/20 opacity-50 line-through"
                                            : "bg-[#1F2126]"}
                                    `}
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={item.menuItem?.image?.url}
                                            alt={item.name}
                                            className="w-8 h-8 rounded"
                                        />

                                        <div>
                                            <p>
                                                {item.name}
                                                {item.status === "Cancelled" && (
                                                    <span className="text-red-400 text-xs ml-2">
                                                        (Cancelled)
                                                    </span>
                                                )}
                                            </p>

                                            <p className="text-xs text-gray-400">
                                                {item.variant?.name} • ₹{item.variant?.price}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <span>x{item.quantity}</span>
                                        <span className="text-yellow-400">
                                            ₹{item.subtotal}
                                        </span>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </>
                )}
            </div>

            {/* RIGHT PANEL */}
            <div className="w-80 border-l border-gray-800 p-6 flex flex-col">

                <h2 className="text-xl font-semibold mb-6">
                    Bill Summary
                </h2>

                <div className="space-y-3 text-sm">

                    <div className="flex justify-between">
                        <p>Subtotal</p>
                        <p>₹{subtotal.toFixed(2)}</p>
                    </div>

                    <div className="flex justify-between">
                        <p>Tax</p>
                        <p>₹{tax.toFixed(2)}</p>
                    </div>

                    <div className="flex justify-between font-semibold text-lg">
                        <p>Total</p>
                        <p className="text-yellow-400">
                            ₹{total.toFixed(2)}
                        </p>
                    </div>

                </div>

                {/* PAYMENT */}
                <div className="mt-auto space-y-3 pt-6">

                    <button
                        onClick={() => handlePayment("Cash")}
                        className="w-full bg-green-500 py-2 rounded-lg"
                        disabled={!selectedOrder}
                    >
                        Cash
                    </button>

                    <button
                        onClick={() => handlePayment("UPI")}
                        className="w-full bg-blue-500 py-2 rounded-lg"
                        disabled={!selectedOrder}
                    >
                        UPI
                    </button>

                    <button
                        onClick={() => handlePayment("Card")}
                        className="w-full bg-purple-500 py-2 rounded-lg"
                        disabled={!selectedOrder}
                    >
                        Card
                    </button>

                </div>
            </div>
        </main>
    );
}