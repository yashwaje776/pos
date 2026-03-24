import React, { useMemo, useState, useEffect } from "react";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Briefcase,
  Search
} from "lucide-react";

import { getAllStaff, register } from "../https";
import { useDispatch, useSelector } from "react-redux";
import { setStaff } from "../redux/slices/userSlice";
import Modal from "../components/shared/Modal";

/* ---------------- REGISTER POPUP ---------------- */
const RegisterStaff = ({ onClose }) => {
  const dispatch = useDispatch();

  const initialState = {
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "waiter",
  };

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      const res = await register(form);

      if (res.data.success) {
        alert("Staff added successfully");

        const updated = await getAllStaff();
        dispatch(setStaff(updated.data.data));

        setForm(initialState);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding staff");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    !form.name ||
    !form.email ||
    !form.phone ||
    !form.password;

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Staff">

      <div className="space-y-6 bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl text-white">

        {/* NAME */}
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* PHONE */}
        <div>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* ROLE */}
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/20 text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="manager" className="text-black">Manager</option>
          <option value="cashier" className="text-black">Cashier</option>
          <option value="waiter" className="text-black">Waiter</option>
          <option value="kitchen" className="text-black">Kitchen</option>
        </select>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/20 text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="px-5 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Staff"}
          </button>
        </div>

      </div>

    </Modal>
  );
};

/* ---------------- STAFF CARD ---------------- */
const StaffCard = ({ staff }) => {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 hover:bg-white/5 transition">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-400 text-black rounded-xl flex items-center justify-center font-bold text-lg">
          {staff.name?.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold">{staff.name}</h3>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Briefcase size={14} /> {staff.role}
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Mail size={14} /> {staff.email}
          </p>
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <Phone size={14} /> {staff.phone}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN STAFF PAGE ---------------- */

export default function Staff() {
  const [showRegister, setShowRegister] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const staffData = useSelector((state) => state.user.staff); // 🔥 get staff data from Redux

  /* ---------------- FETCH STAFF ---------------- */

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await getAllStaff();
        const data = response.data;
        if (data.success) {
          dispatch(setStaff(data.data));
        }
      } catch (error) {
        console.error("❌ Error fetching staff:", error);
      } finally {
        setLoading(false);
      }
    };

    // 🔥 Call API only if Redux has no staff data
    if (!staffData || staffData.length === 0) {
      fetchStaff();
    }

  }, [dispatch, staffData]);

  /* ---------------- ROLE COUNTS ---------------- */

  const roleCounts = useMemo(() => {
    return {
      manager: staffData.filter(s => s.role === "manager").length,
      cashier: staffData.filter(s => s.role === "cashier").length,
      waiter: staffData.filter(s => s.role === "waiter").length,
      kitchen: staffData.filter(s => s.role === "kitchen").length,
    };
  }, [staffData]);

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredStaff = useMemo(() => {
    return staffData.filter((staff) => {
      const matchesSearch = staff.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesRole =
        selectedRole === "all" || staff.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [search, selectedRole, staffData]);

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-semibold">Manage Staff</h2>
        </div>

        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg"
        >
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      {/* ROLE COUNT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div
            key={role}
            className="bg-zinc-900 p-4 rounded-xl border border-white/10 text-center"
          >
            <p className="text-gray-400 text-sm capitalize">{role}</p>
            <h3 className="text-2xl font-semibold mt-2">{count}</h3>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#2a2a2a] pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-[#2a2a2a] px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="all">All Roles</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="waiter">Waiter</option>
          <option value="kitchen">Kitchen</option>
        </select>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400">Loading staff...</p>
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((staff) => (
            <StaffCard key={staff._id} staff={staff} />
          ))
        ) : (
          <p className="text-gray-500">No staff found</p>
        )}
      </div>
      {showRegister && (
        <RegisterStaff onClose={() => setShowRegister(false)} />
      )}

    </main>
  );
}