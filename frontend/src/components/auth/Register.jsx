import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";

/* ================= INITIAL STATE ================= */
const INITIAL_STATE = {
  restaurantName: "",
  ownerName: "",
  email: "",
  phone: "",
  address: "",
  gstNumber: "",
  password: "",
};

const Register = ({ setIsRegister }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const { restaurantName, ownerName, email, phone, address, password } = formData;

    if (!restaurantName.trim()) return toast.error("Restaurant name required");
    if (!ownerName.trim()) return toast.error("Owner name required");

    if (!email.trim()) return toast.error("Email required");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Invalid email");

    if (!phone.trim()) return toast.error("Phone required");
    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, "")))
      return toast.error("Invalid phone number");

    if (!address.trim()) return toast.error("Address required");

    if (!password.trim()) return toast.error("Password required");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || loading) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/restaurant/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      /* SUCCESS */
      toast.success("Restaurant registered successfully 🎉");

      setFormData(INITIAL_STATE);

      setTimeout(() => {
        setIsRegister(false);
      }, 1200);

    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 shadow-2xl border border-[#2a2a2a] rounded-xl bg-[#121212]">

        <form onSubmit={handleSubmit} className="space-y-4">

          <InputField label="Restaurant Name" name="restaurantName" value={formData.restaurantName} onChange={handleChange} placeholder="Enter restaurant name" />

          <InputField label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Enter owner name" />

          <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />

          <InputField label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />

          <InputField label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Enter restaurant address" />

          <InputField label="GST Number (Optional)" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="Enter GST number" required={false} />

          <InputField label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" />

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 transition text-gray-900 font-bold disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register Restaurant"}
          </button>

        </form>
      </div>
    </div>
  );
};

/* ================= INPUT COMPONENT ================= */
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
}) => (
  <div>
    <label className="block text-[#ababab] mb-2 text-sm font-medium">
      {label}
    </label>

    <div className="flex rounded-lg px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] focus-within:border-yellow-400 transition">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="bg-transparent flex-1 text-white focus:outline-none"
      />
    </div>
  </div>
);

export default Register;