import React, { useEffect, useState } from "react";
import restaurant from "../assets/images/restaurant-img.jpg";
import logo from "../assets/images/logo.png";
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";

const Auth = () => {
  
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden">
      {/* ================= LEFT SECTION (FIXED) ================= */}
      <div className="relative md:w-1/2 w-full h-64 md:h-full">
        {/* Background Image */}
        <img
          src={restaurant}
          alt="Restaurant"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

        {/* Content */}
        <div className="relative flex flex-col justify-end h-full p-10 text-white">
          <blockquote className="text-xl md:text-2xl italic leading-relaxed max-w-lg">
            “Serve customers the best food with prompt and friendly service in a
            welcoming atmosphere, and they’ll keep coming back.”
          </blockquote>

          <span className="mt-4 text-yellow-400 font-semibold text-lg">
            — Founder of Restro
          </span>
        </div>
      </div>

      {/* ================= RIGHT SECTION ================= */}
      <div
        className={`md:w-1/2 w-full bg-gradient-to-br from-[#1a1a1a] to-[#111] p-8 flex justify-center ${isRegister
          ? "items-start overflow-y-auto h-full no-scrollbar"
          : "items-center"
          }`}
      >
        <div
          className={`w-full max-w-md bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 ${isRegister ? "min-h-full p-8" : "p-8"
            }`}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <img
              src={logo}
              alt="Restro Logo"
              className="h-16 w-16 rounded-full border-2 border-yellow-400 p-1"
            />
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Restro POS
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-3xl text-center font-semibold text-yellow-400 mb-6 transition-all duration-300">
            {isRegister ? "Register Restaurant" : "Employee Login"}
          </h2>

          {/* Auth Components */}
          <div className="transition-all duration-500 ease-in-out">
            {isRegister ? (
              <Register setIsRegister={setIsRegister} />
            ) : (
              <Login />
            )}
          </div>

          {/* Toggle */}
          <div className="flex justify-center mt-6">
            <p className="text-sm text-gray-400">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="ml-2 text-yellow-400 font-semibold hover:text-yellow-300 transition"
              >
                {isRegister ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;