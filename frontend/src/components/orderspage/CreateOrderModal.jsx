import React, { useState, useCallback } from "react";
import Modal from "../shared/Modal";
import { useNavigate } from "react-router-dom";
import { addOrder } from "../../https";
import { toast } from "react-toastify";

/* ================= CONSTANTS ================= */
const ORDER_TYPES = {
  DINE_IN: "DINE_IN",
  TAKEAWAY: "TAKEAWAY",
};

const INITIAL_STATE = {
  name: "",
  phone: "",
  guestCount: 1,
  orderType: ORDER_TYPES.DINE_IN,
};

const CreateOrderModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  /* ================= UPDATE FORM ================= */
  const updateForm = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return false;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }

    if (!/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ""))) {
      toast.error("Invalid phone number");
      return false;
    }

    return true;
  };

  /* ================= CREATE ORDER ================= */
  const handleCreateOrder = async () => {
    if (!validateForm() || loading) return;

    try {
      setLoading(true);

      /* DINE IN FLOW */
      if (form.orderType === ORDER_TYPES.DINE_IN) {

        navigate("/tables", {
          state: {
            customerName: form.name,
            phone: form.phone,
            guestCount: form.guestCount,
            orderType: form.orderType,
          },
        });
      }

      /* TAKEAWAY FLOW */
      else {
        const response = await addOrder({
          customerName: form.name,
          phone: form.phone,
          orderType: form.orderType,
        });

        const orderId = response?.data?.data?._id;

        if (!orderId) throw new Error();

        toast.success("Order created successfully");

        navigate(`/menu/${orderId}`, {
          state: { orderId },
        });
      }

      /* RESET */
      setForm(INITIAL_STATE);
      onClose();

    } catch {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Order">
      <div className="space-y-6 bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl text-white">

        {/* NAME */}
        <input
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
          placeholder="Customer Name"
          className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        {/* PHONE */}
        <input
          value={form.phone}
          onChange={(e) => updateForm("phone", e.target.value)}
          placeholder="+91 9999999999"
          className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        {/* ORDER TYPE */}
        <div className="flex gap-3">
          {[ORDER_TYPES.DINE_IN, ORDER_TYPES.TAKEAWAY].map((type) => (
            <button
              key={type}
              onClick={() => updateForm("orderType", type)}
              className={`flex-1 py-2.5 rounded-xl border transition ${form.orderType === type
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white/10 text-gray-300 border-white/20 hover:border-orange-400"
                }`}
            >
              {type === ORDER_TYPES.DINE_IN ? "Dine In" : "Takeaway"}
            </button>
          ))}
        </div>

        {/* GUEST COUNT */}
        {form.orderType === ORDER_TYPES.DINE_IN && (
          <div className="flex items-center justify-between bg-white/10 border border-white/20 px-4 py-3 rounded-xl">
            <button
              onClick={() =>
                updateForm("guestCount", Math.max(1, form.guestCount - 1))
              }
              className="text-orange-400 text-xl px-2"
            >
              −
            </button>

            <span className="font-medium">
              {form.guestCount} Guests
            </span>

            <button
              onClick={() =>
                updateForm("guestCount", form.guestCount + 1)
              }
              className="text-orange-400 text-xl px-2"
            >
              +
            </button>
          </div>
        )}

        {/* ACTION BUTTON */}
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : form.orderType === ORDER_TYPES.DINE_IN
              ? "Select Table"
              : "Create Takeaway Order"}
        </button>
      </div>
    </Modal>
  );
};

export default CreateOrderModal;