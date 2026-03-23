import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/* ================= INITIAL STATE ================= */
const INITIAL_STATE = {
  email: "",
  password: "",
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || loading) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      /* ================= SUCCESS ================= */
      localStorage.setItem("accessToken", data.accessToken);
      dispatch(setUser(data.data));

      toast.success("Login successful");

      navigate("/", { replace: true });

    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#2a2a2a] p-6 rounded-xl bg-[#121212]"
    >
      {/* EMAIL */}
      <div>
        <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
          Employee Email
        </label>

        <div className="rounded-lg p-4 bg-[#1f1f1f] border border-transparent focus-within:border-yellow-400 transition">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter employee email"
            className="bg-transparent w-full text-white focus:outline-none"
            autoComplete="email"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div>
        <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
          Password
        </label>

        <div className="rounded-lg p-4 bg-[#1f1f1f] border border-transparent focus-within:border-yellow-400 transition">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            className="bg-transparent w-full text-white focus:outline-none"
            autoComplete="current-password"
          />
        </div>
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg mt-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300 transition disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};

export default Login;