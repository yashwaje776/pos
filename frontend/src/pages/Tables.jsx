import React, { useState, useEffect } from "react";
import { Home, ShoppingCart, Table2, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardHeader from "../components/shared/Header";
import SideBar from "../components/shared/SideBar";
import Modal from "../components/shared/Modal";

import { addOrder, addTable, getTables } from "../https";
import { useSelector } from "react-redux";
import { socket } from "../socket";
import { toast } from "react-toastify";

/* ---------------- TABLE CARD ---------------- */

const TableCard = ({ table, onSelect }) => {

  const statusColors = {
    Available: "bg-gray-600 text-gray-200",
    Occupied: "bg-green-500 text-white",
    Reserved: "bg-yellow-500 text-black",
  };

  const minutesAgo = table.orderStartedAt
    ? Math.floor((Date.now() - new Date(table.orderStartedAt)) / 60000)
    : null;

  return (
    <div
      onClick={() => onSelect(table)}
      className="bg-zinc-900 rounded-xl p-5 border border-gray-800 hover:bg-[#23242a] cursor-pointer transition"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-200">
          Table → {table.tableNo}
        </h3>

        <span
          className={`text-xs px-3 py-1 rounded-md ${statusColors[table.status] || "bg-gray-600"
            }`}
        >
          {table.status || "Available"}
        </span>
      </div>

      {/* Avatar */}
      <div className="flex justify-center my-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold bg-black text-gray-300">
          {table.currentOrder?.customerDetails?.name[0] || "T"}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 text-xs text-gray-400">
        <p>Seats: {table.seats || 0}</p>

        {
          table.currentOrder && (
            <>
              <p>Customer: {table.currentOrder?.customerDetails?.name || "—"}</p>
              <p>Guests: {table.currentOrder?.customerDetails?.guests || 0}</p>
            </>
          )
        }

      </div>
    </div>
  );
};

/* ---------------- MAIN PAGE ---------------- */

export default function TablesPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const orderData = location.state;
  const { user } = useSelector((state) => state.user);

  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableNo, setTableNo] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [seats, setSeats] = useState("");
  const role = user.role;
  const allowedToAddTable = ["admin", "manager"];


  /* ---------------- FETCH TABLES ---------------- */

  const fetchTables = async () => {
    try {
      const res = await getTables();
      setTables(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };


  useEffect(() => {
    fetchTables();

    socket.emit("joinRestaurant", user?.restaurantId);

    const handleOrderCreated = (data) => {
      const newOrder = data.order;
      setTables((prevTables) =>
        prevTables.map((table) => {
          if (table.tableNo === newOrder.tableNo) {
            return {
              ...table,
              status: "Occupied",
              currentOrder: {
                ...newOrder,
                customerDetails: newOrder.customerDetails,
              },
            };
          }
          return table;
        })
      );
    };
    socket.on("UpdatedOrderstatus", ({ order }) => {
      if (order.orderStatus === "Completed" || order.orderStatus === "Cancelled") {
        setTables((prevTables) =>
          prevTables.map((table) => {
            if (table._id === order.table) {
              return {
                ...table,
                status: "Available",
                currentOrder: null,
              };
            }
            return table;
          })
        );
      }
    });

    socket.on("orderCreated", handleOrderCreated);

    return () => {
      socket.off("orderCreated", handleOrderCreated);
    };
  }, [user?.restaurantId]);

  /* ---------------- ADD TABLE ---------------- */

  const handleAddTable = async () => {
    if (isAdding) return
    const number = Number(tableNo);
    const seatCount = Number(seats);

    if (!number || !seatCount) {
      alert("Enter valid table number and seats");
      return;
    }

    try {
      setIsAdding(true); // ✅ start loading
      const res = await addTable({
        tableNo: number,
        seats: seatCount
      });
      toast.success("table added")

      const createdTable = res.data?.data;

      setTables(prev => [...prev, createdTable]);

      setTableNo("");
      setSeats("");

      setIsModalOpen(false);

    } catch (error) {
      console.error("Add table error:", error);
      alert("Failed to add table");
    }
    finally {
      setIsAdding(false); // ✅ stop loading
    }
  };

  /* ---------------- TABLE CLICK ---------------- */

  const handleSelectTable = async (table) => {

    try {

      let orderId = null;

      /* CASE 1: table already has active order */
      if (table.currentOrder) {
        orderId = table.currentOrder._id;
        navigate(`/menu/${orderId}`);
        return;
      }
      /* CASE 2: create order */
      if (orderData) {

        const response = await addOrder({
          customerName: orderData.customerName,
          phone: orderData.phone,
          guestCount: orderData.guestCount,
          tableNo: table.tableNo,
          orderType: orderData.orderType
        });

        orderId = response.data?.data?._id;

        if (!orderId) throw new Error("Order creation failed");
        navigate(`/menu/${orderId}`, {
          state: { orderId }
        });
        return;
      }
      alert("Please add customer details before creating an order.");
    } catch (error) {
      alert("Failed to open table");
    }
  };

  /* ---------------- FILTER ---------------- */

  const filters = ["All", "Available", "Occupied"];

  const filteredTables =
    filter === "All"
      ? tables
      : tables.filter(t => t.status === filter);

  const countTables = (status) => {

    if (status === "All") return tables.length;

    return tables.filter(t => t.status === status).length;

  };

  /* ---------------- UI ---------------- */

  return (


    <main className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">

      {/* HEADER */}

      <div className="flex items-center justify-between flex-wrap gap-6">

        <div>
          <h2 className="text-3xl font-semibold">Tables</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage restaurant tables
          </p>
        </div>

        {allowedToAddTable.includes(role) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-500 px-4 py-2 rounded-lg text-black font-medium"
          >
            Add Table
          </button>
        )}

        <div className="flex gap-3">

          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm ${filter === f
                ? "bg-white/10 text-white"
                : "bg-white/5 text-gray-400"
                }`}
            >
              {f} ({countTables(f)})
            </button>
          ))}

        </div>

      </div>

      {/* EMPTY STATE */}

      {filteredTables.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          No tables available
        </div>
      )}

      {/* TABLE GRID */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

        {filteredTables.map(table => (
          <TableCard
            key={table.tableNo}
            table={table}
            onSelect={handleSelectTable}
          />
        ))}

      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Table"
      >
        <div className="space-y-6 bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl text-white">

          {/* TABLE NUMBER */}
          <div>
            <label className="block text-sm mb-2 text-gray-300">
              Table Number
            </label>
            <input
              type="number"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* SEATS */}
          <div>
            <label className="block text-sm mb-2 text-gray-300">
              Seats
            </label>
            <input
              type="number"
              min="1"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleAddTable}
            disabled={isAdding}
            className="w-full rounded-xl py-3 font-semibold bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Table"}
          </button>

        </div>
      </Modal>
    </main>




  );
}