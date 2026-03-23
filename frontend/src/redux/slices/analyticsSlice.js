import { createSlice } from "@reduxjs/toolkit";

const analyticsSlice = createSlice({
    name: "analytics",
    initialState: {
        data: null,
        loading: false,
        error: null,
        stats: null,
    },
    reducers: {
        fetchAnalyticsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchAnalyticsSuccess: (state, action) => {
            state.loading = false;
            state.data = action.payload;
        },
        fetchAnalyticsFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        addRealtimeOrder: (state, action) => {
            const newOrder = action.payload;
            const isDineIn = newOrder.orderType === "DINE_IN";
            // 1. Add to recent orders
            state.stats.recentOrders.unshift({
                orderId: newOrder._id,
                customerName: newOrder.customerDetails.name,
                total: newOrder.bills.total || 0,
                tableNo: isDineIn ? newOrder.tableNo : null,
                status: newOrder.orderStatus,
            });


            // 2. Update summary
            state.stats.summary.activeOrders += 1;
            if (isDineIn) {
                state.stats.summary.activeTables += 1;
            }

            // 3. Update table status
            if (isDineIn) {
                const table = state.stats.tableStatus.find(
                    (t) => t.tableNo === newOrder?.tableNo
                );

                if (table) {
                    table.status = "Occupied";
                }
            }
        },
        fetchAnalyticsStats: (state, action) => {
            state.stats = action.payload;
        },
        itemAdded: (state, action) => {
            const { orderId, item } = action.payload;
            const recentOrder = state.stats.recentOrders.find(
                (o) => o.orderId === orderId
            );
            recentOrder.total += (item.subtotal + (item.subtotal * 0.05))
            state.stats.kitchenActivity.Pending += item.quantity;
        },
        itemStatusUpdated: (state, action) => {
            const { item, newStatus, oldStatus } = action.payload;
            if (oldStatus) {
                state.stats.kitchenActivity[oldStatus] -= item.quantity;
            }
            state.stats.kitchenActivity[newStatus] += item.quantity;
        },
        orderStatusUpdated: (state, action) => {
            const updated = action.payload;

            const isDineIn = updated.orderType === "DINE_IN";
            const isCompleted = updated.orderStatus === "Completed";
            const isClosed =
                updated.orderStatus === "Completed" ||
                updated.orderStatus === "Cancelled";

            // ✅ 1. Update recent orders
            const recentOrder = state.stats.recentOrders.find(
                (o) => o.orderId === updated._id
            );

            if (recentOrder) {
                recentOrder.status = updated.orderStatus;
            }

            if (isClosed) {
                // ✅ 2. Update table ONLY for DINE_IN
                if (isDineIn) {
                    const table = state.stats.tableStatus.find(
                        (t) => t._id === updated.table?._id || t._id === updated.table
                    );

                    if (table) {
                        table.status = "Available";
                    }

                    // decrement active tables safely
                    state.stats.summary.activeTables = Math.max(
                        0,
                        state.stats.summary.activeTables - 1
                    );
                }

                // ✅ 3. Update active orders
                state.stats.summary.activeOrders = Math.max(
                    0,
                    state.stats.summary.activeOrders - 1
                );

                // ✅ 4. If completed → revenue + analytics
                if (isCompleted) {
                    state.stats.summary.todayOrders += 1;
                    state.stats.summary.todayRevenue += updated.bills?.total || 0;

                    // 🔥 5. Sales chart update
                    const completedAt = new Date(updated.updatedAt || Date.now());
                    const hour = completedAt.getHours();

                    const hourData = state.stats.salesChart.find(
                        (h) => h.hour === hour
                    );

                    if (hourData) {
                        hourData.revenue += updated.bills?.total || 0;
                    }

                    // 🔥 6. Top items update
                    const items = updated.items || [];

                    items.forEach((item) => {
                        if (item.status === "Cancelled") return;

                        const existing = state.stats.topItems.find(
                            (i) => i.menuItemId === item.menuItem
                        );

                        if (existing) {
                            existing.count += item.quantity;
                        } else {
                            state.stats.topItems.push({
                                name: item.name,
                                count: item.quantity,
                                menuItemId: item.menuItem,
                                image: item.image || "",
                            });
                        }
                    });
                }
            }
        },
        orderClosed: (state, action) => {
            const { closedOrder } = action.payload;
            const { tableNo } = action.payload;
            // 1. Update table
            const table = state.stats.tableStatus.find(
                (t) => t.tableNo
                    === tableNo
            );

            if (table) {
                table.status = "Available";
            }

            // 2. Update summary
            state.stats.summary.activeTables -= 1;
            state.stats.summary.activeOrders -= 1;
            state.stats.summary.todayOrders += 1;
            state.stats.summary.todayRevenue += closedOrder.bills?.total || 0;

            // 🔥 3. Update salesChart
            const completedAt = new Date(updated.updatedAt || Date.now());
            const hour = completedAt.getHours();

            const hourData = state.stats.salesChart.find(
                (h) => h.hour === hour
            );

            if (hourData) {
                hourData.revenue += closedOrder.bills?.total || 0;
            }
            const items = closedOrder.items || [];
            items.forEach((item) => {
                if (item.status === "Cancelled") return;

                const existing = state.stats.topItems.find(
                    (i) => i.menuItemId === item.menuItem
                );

                if (existing) {
                    existing.count += item.quantity;
                } else {
                    state.stats.topItems.push({
                        name: item.name,
                        count: item.quantity,
                        menuItemId: item.menuItem,
                        image: item.image || "" // optional
                    });
                }
            });
        }
    }
});

export const {
    fetchAnalyticsStart,
    fetchAnalyticsSuccess,
    fetchAnalyticsFailure,
    fetchAnalyticsStats,
    addRealtimeOrder
} = analyticsSlice.actions;

export default analyticsSlice.reducer;