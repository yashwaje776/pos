import React, { useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/* PAGES */
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import RestroDashboard from "./pages/RestroDashboard";
import TablesPage from "./pages/Tables";
import MenuPage from "./pages/Menu";
import MenuDetail from "./pages/MenuDetail";
import AnalyticsPage from "./pages/AnalyticsPage";
import RegisterRestaurant from "./pages/RegisterRestaurant";
import Staff from "./pages/Staff";
import Kitchen from "./pages/Kitchen";
import Billing from "./pages/Billing";

/* HOOKS */
import useLoadData from "./hooks/useLoadData";

/* COMPONENTS */
import DashboardHeader from "./components/shared/Header";
import SideBar from "./components/shared/SideBar";

/* LIBS */
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

/* ================= ROLE CONFIG ================= */
const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  WAITER: "waiter",
  CASHIER: "cashier",
  KITCHEN: "kitchen",
};

/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state.user?.user);

  if (!user?.isActive) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/* ================= LOADING SCREEN ================= */
const LoadingScreen = () => (
  <SkeletonTheme baseColor="#202020" highlightColor="#444">
    <div className="min-h-screen bg-black text-white flex">
      <div className="hidden md:flex flex-col w-64 p-4 space-y-4 border-r border-gray-800">
        <Skeleton height={40} width={120} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={30} borderRadius={8} />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <Skeleton height={30} width={200} />
          <Skeleton height={30} width={40} circle />
        </div>
      </div>
    </div>
  </SkeletonTheme>
);

/* ================= MAIN APP ================= */
const App = () => {
  const isLoading = useLoadData();
  const user = useSelector((state) => state.user?.user);
  const location = useLocation();

  const isAuthPage = useMemo(
    () => location.pathname === "/auth",
    [location.pathname]
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      {/* ================= TOAST ================= */}
      <ToastContainer
        limit={3}
        position="top-right"
        autoClose={2500}
        newestOnTop
        pauseOnFocusLoss={false}
        pauseOnHover
        theme="dark"
      />

      <div className="h-screen bg-[#1a1a1a] text-white flex overflow-hidden">
        {!isAuthPage && <SideBar />}

        <div className="flex-1 flex flex-col overflow-hidden">
          {!isAuthPage && <DashboardHeader />}

          <Routes>
            {/* ================= PUBLIC ================= */}
            <Route path="/restaurant/register" element={<RegisterRestaurant />} />

            <Route
              path="/auth"
              element={
                user?.isActive ? (
                  user.role === ROLES.KITCHEN ? (
                    <Navigate to="/kitchen" replace />
                  ) : (
                    <Navigate to="/" replace />
                  )
                ) : (
                  <Auth />
                )
              }
            />

            {/* ================= PROTECTED ================= */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {user?.role === ROLES.KITCHEN ? (
                    <Navigate to="/kitchen" replace />
                  ) : (
                    <RestroDashboard />
                  )}
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                  <Staff />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    ROLES.ADMIN,
                    ROLES.MANAGER,
                    ROLES.CASHIER,
                    ROLES.WAITER,
                    ROLES.KITCHEN,
                  ]}
                >
                  <Orders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tables"
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER]}
                >
                  <TablesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/menu"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                  <MenuDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/menu/:orderId"
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER]}
                >
                  <MenuPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kitchen"
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN]}
                >
                  <Kitchen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute
                  allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER]}
                >
                  <Billing />
                </ProtectedRoute>
              }
            />

            {/* ================= FALLBACK ================= */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;