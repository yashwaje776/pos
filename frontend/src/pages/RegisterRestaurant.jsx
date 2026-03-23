import React, { useState } from "react";

const RegisterRestaurant = ({ setIsRegister }) => {
  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      alert(data.message);

      setFormData({
        restaurantName: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
        gstNumber: "",
        password: "",
      });

      setTimeout(() => {
        setIsRegister(false);
      }, 1500);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#111] to-black px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-[#181818] p-8 rounded-2xl shadow-2xl border border-[#2a2a2a]">

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Register Restaurant
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Restaurant Name */}
          <InputField
            label="Restaurant Name"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleChange}
            placeholder="Enter restaurant name"
          />

          {/* Owner Name */}
          <InputField
            label="Owner Name"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="Enter owner name"
          />

          {/* Email */}
          <InputField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
          />

          {/* Phone */}
          <InputField
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          {/* Address */}
          <InputField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter restaurant address"
          />

          {/* GST Number */}
          <InputField
            label="GST Number"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            placeholder="Enter GST number"
          />

          {/* Password */}
          <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create password"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 transition text-gray-900 font-bold disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register Restaurant"}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className="text-yellow-400 hover:underline"
            >
              Login
            </button>
          </p>

        </form>
      </div>
    </div>
  );
};

/* Reusable Input Component */
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
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
        required={name !== "gstNumber"}
        className="bg-transparent flex-1 text-white focus:outline-none"
      />
    </div>
  </div>
);

export default RegisterRestaurant;