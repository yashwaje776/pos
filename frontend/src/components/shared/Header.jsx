import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Maximize, Minimize, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../redux/slices/userSlice";
import { toast } from "react-toastify";

export default function DashboardHeader() {
    const user = useSelector((state) => state.user?.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isFullscreen, setIsFullscreen] = useState(
        !!document.fullscreenElement
    );
    const [showProfile, setShowProfile] = useState(false);

    const userName = user?.name || "Guest";
    const role = user?.role || "User";

    /* ================= LOGOUT ================= */
    const logoutUser = useCallback(() => {
        try {
            localStorage.removeItem("accessToken");
            dispatch(setUser(null));
            toast.success("Logged out successfully");
            navigate("/auth", { replace: true });
        } catch (error) {
            toast.error("Logout failed");
        }
    }, [dispatch, navigate]);

    /* ================= FULLSCREEN ================= */
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                toast.info("Entered fullscreen");
            } else {
                await document.exitFullscreen();
                toast.info("Exited fullscreen");
            }
        } catch {
            toast.error("Fullscreen not supported");
        }
    }, []);

    /* ================= FULLSCREEN SYNC ================= */
    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handler);
        return () =>
            document.removeEventListener("fullscreenchange", handler);
    }, []);

    /* ================= KEYBOARD SHORTCUT ================= */
    useEffect(() => {
        const handleKey = (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "f") {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [toggleFullscreen]);

    /* ================= CLOSE MODAL ON ESC ================= */
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") setShowProfile(false);
        };

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <>
            <header className="flex items-center justify-between px-6 py-3 
        bg-zinc-900/70 backdrop-blur-xl border-b border-zinc-800 text-white">

                {/* LEFT */}
                <div className="text-lg font-semibold tracking-wide">
                    POS System
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-3">

                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 
            border border-white/10 transition"
                    >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>

                    {/* Profile */}
                    <div className="relative group">
                        <div className="flex items-center gap-3 cursor-pointer">

                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-amber-300 flex items-center justify-center">
                                <p className="text-black font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </p>
                            </div>

                            {/* Info */}
                            <div className="hidden sm:block leading-tight">
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-zinc-400 text-xs">{role}</p>
                            </div>
                        </div>

                        {/* Dropdown */}
                        <div
                            className="absolute right-0 mt-3 w-44 rounded-xl shadow-xl 
              opacity-0 invisible group-hover:opacity-100 group-hover:visible 
              transition-all duration-200 z-50
              bg-zinc-900 border border-zinc-800 backdrop-blur-xl"
                        >
                            <button
                                onClick={() => setShowProfile(true)}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm"
                            >
                                Profile
                            </button>

                            <button
                                onClick={logoutUser}
                                className="w-full flex items-center gap-2 px-4 py-2 
                hover:bg-red-500/20 text-sm text-red-500"
                            >
                                <LogOut size={14} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ================= PROFILE MODAL ================= */}
            {showProfile && (
                <div
                    onClick={() => setShowProfile(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                            <h2 className="text-lg font-semibold tracking-wide">
                                User Profile
                            </h2>
                            <button
                                onClick={() => setShowProfile(false)}
                                className="text-zinc-400 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* PROFILE TOP */}
                        <div className="flex flex-col items-center gap-3 py-6 border-b border-zinc-800">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-white text-base">
                                    {user?.name || "Unknown User"}
                                </p>
                                <p className="text-zinc-400 text-sm">
                                    {user?.email || "No email"}
                                </p>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="p-5 grid grid-cols-2 gap-4 text-sm">
                            <Info label="Phone" value={user?.phone} />
                            <Info label="Role" value={user?.role} capitalize />

                            <Info
                                label="Status"
                                value={user?.isActive ? "Active" : "Inactive"}
                                color={user?.isActive ? "text-green-400" : "text-red-400"}
                            />

                            <Info
                                label="Joined"
                                value={
                                    user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : "-"
                                }
                            />

                            <div className="col-span-2">
                                <Info label="User ID" value={user?._id} small />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
                            <button
                                onClick={() => setShowProfile(false)}
                                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ================= REUSABLE INFO ROW ================= */
const Info = ({ label, value, capitalize, color, small }) => (
    <div className="bg-white/5 rounded-lg p-3 border border-zinc-800 hover:bg-white/10 transition">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p
            className={`font-medium text-white ${capitalize ? "capitalize" : ""
                } ${color || ""} ${small ? "text-xs break-all" : ""}`}
        >
            {value || "-"}
        </p>
    </div>
);