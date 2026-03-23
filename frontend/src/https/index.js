import { axiosWrapper } from "./axiosWrapper";

// ================= AUTH =================
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const getAllStaff = () => axiosWrapper.get("/api/user/staff"); // new API call to get all staff members

// logout (optional backend call)
export const logout = () => {
  localStorage.removeItem("accessToken");
  return Promise.resolve();
};

// ================= TABLE =================
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);

// ================= PAYMENT =================
export const createOrderRazorpay = (data) =>
  axiosWrapper.post("/api/payment/create-order", data);

export const verifyPaymentRazorpay = (data) =>
  axiosWrapper.post("/api/payment/verify-payment", data);

// ================= ORDER =================
export const getOrders = () => axiosWrapper.get("/api/order");

export const updateOrderStatus = ({ orderId, status }) =>
  axiosWrapper.put(`/api/order/${orderId}/status`, { status });

export const addOrder = (data) => axiosWrapper.post("/api/order/", data);

export const addItemToOrder = ({ orderId, ...data }) =>
  axiosWrapper.post(`/api/order/${orderId}/add-item`, data);

// ✅ Remove item from order
export const removeItemFromOrder = ({ orderId, itemId }) =>
  axiosWrapper.delete(`/api/order/${orderId}/items/${itemId}`);

// ✅ Close order
export const closeOrder = (orderId) =>
  axiosWrapper.patch(`/api/order/${orderId}/close`);

export const getOrderForTable = (orderId) =>
  axiosWrapper.get(`/api/order/${orderId}`);



export const updateItemStatus = ({ orderId, itemId, status }) =>
  axiosWrapper.put(`/api/order/${orderId}/item/${itemId}/status`, { status });


// ================= USER =================
export const registerRestaurant = (data) =>
  axiosWrapper.post("/api/user/register-restaurant", data);

// ================= category =================
export const addCategory = (data) =>
  axiosWrapper.post("/api/category", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getCategories = () =>
  axiosWrapper.get("/api/category");

export const updateCategory = (id, data) => {
  const isFormData = data instanceof FormData;

  return axiosWrapper.put(`/api/category/${id}`, data, {
    headers: isFormData
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" },
  });
};
export const deleteCategory = (id) =>
  axiosWrapper.delete(`/api/category/${id}`);


// ================= MENU =================
export const addMenuItem = (data) =>
  axiosWrapper.post("/api/menu", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const getMenuItems = () =>
  axiosWrapper.get("/api/menu");

export const updateMenuItem = (id, data) =>
  axiosWrapper.put(`/api/menu/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const deleteMenuItem = (id) =>
  axiosWrapper.delete(`/api/menu/${id}`);

// ================= DASHBOARD STATS =================
export const getDashboardStats = () =>
  axiosWrapper.get("/api/dashboard/stats");

export const getDashboardAnalytics = () =>
  axiosWrapper.get("/api/dashboard/analytics");


