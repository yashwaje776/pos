const express = require("express");
const http = require("http"); // ✅ REQUIRED
const { Server } = require("socket.io"); // ✅ REQUIRED
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = config.port;

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Attach socket.io
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
});

// ✅ Make io globally accessible
module.exports.io = io;

// Connect DB
connectDB();

// Middlewares
app.use(
    cors({
        credentials: true,
        origin: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// Root Endpoint
app.get("/", (req, res) => {
    res.json({ message: "Hello from POS Server!" });
});

// Routes
app.use("/api", require("./routes/menuRoute"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));

// Global Error Handler
app.use(globalErrorHandler);

// ✅ Socket.io Connection
io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // Join restaurant room
    socket.on("joinRestaurant", (restaurantId) => {
        socket.join(restaurantId);
    });

    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
    });
});

// ✅ Use server.listen NOT app.listen
server.listen(PORT, () => {
    console.log(`☑️ POS Server running on port ${PORT}`);
});