# 🍽️ Multi-Restaurant POS System (MERN Stack)

A full-stack **Point of Sale (POS) web application** built using the **MERN stack**, designed for **multiple restaurants**, featuring **role-based access control**, **real-time updates with Socket.IO**, **Razorpay payments**, and a modern UI using **Tailwind CSS**.

---

## 🚀 Live Demo

* **Frontend:** https://restro-e0b0.onrender.com/
* **Backend API:** https://pos-backend-2cln.onrender.com/

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Socket.IO
* Razorpay API

---

## ⚡ Key Features

### 🏪 Multi-Restaurant Support

* Manage **multiple restaurants** from a single platform
* Separate data, staff, and orders per restaurant
* Ideal for SaaS-based POS solutions

---

### 👥 Role-Based Access Control (RBAC)

```id="roles_enum_block"
enum: ["admin", "manager", "cashier", "waiter", "kitchen"]
```

| Role    | Permissions                   |
| ------- | ----------------------------- |
| Admin   | Full system access            |
| Manager | Manage staff, menu, analytics |
| Cashier | Billing & payments            |
| Waiter  | Order management              |
| Kitchen | Order preparation & status    |

---

### 📱 Application Pages & Access Control

The system dynamically renders pages based on user roles:

```id="menu_items_block"
const MENU_ITEMS = [
  {
    label: "Dashboard",
    to: "/",
    roles: ["admin", "manager", "cashier", "waiter"],
  },
  {
    label: "Orders",
    to: "/orders",
    roles: ["admin", "manager", "cashier", "waiter", "kitchen"],
  },
  {
    label: "Tables",
    to: "/tables",
    roles: ["admin", "manager", "waiter"],
  },
  {
    label: "Kitchen",
    to: "/kitchen",
    roles: ["admin", "manager", "kitchen"],
  },
  {
    label: "Billing",
    to: "/billing",
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "Menu",
    to: "/menu",
    roles: ["admin", "manager"],
  },
  {
    label: "Staff",
    to: "/staff",
    roles: ["admin", "manager"],
  },
  {
    label: "Analytics",
    to: "/analytics",
    roles: ["admin", "manager"],
  },
];
```

✅ Ensures users only access features relevant to their role
✅ Improves security and usability

---

### 🔄 Real-Time Features

* Live order updates using Socket.IO
* Waiter ↔ Kitchen communication
* Instant dashboard refresh

---

### 💳 Payments Integration (Razorpay)

* Create orders from backend
* Secure checkout
* Payment verification
* Supports UPI, cards, net banking

---

### 📊 Additional Features

* 🧾 Order & billing system
* 📱 Fully responsive UI
* 🔐 Secure APIs with JWT
* ⚙️ Modular & scalable architecture

---

## 📂 Project Structure

```id="project_structure_block"
POS-System/
│
├── client/
├── server/
├── models/
├── routes/
├── controllers/
├── sockets/
├── payments/
└── middleware/
```

---

## 🔌 Installation & Setup

### 1️⃣ Clone Repository

```bash id="clone_repo_block"
git clone https://github.com/your-username/pos-system.git
cd pos-system
```

---

### 2️⃣ Backend Setup

```bash id="backend_setup_block"
cd server
npm install
```

Create `.env`:

```id="env_setup_block"
PORT=5000
MONGO_URI=your_mongodb_connection_string
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

Run backend:

```bash id="run_backend_block"
npm start
```

---

### 3️⃣ Frontend Setup

```bash id="frontend_setup_block"
cd client
npm install
```

Run frontend:

```bash id="run_frontend_block"
npm run dev
```

---

---

## 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based middleware
* Protected routes

---

## 📦 Deployment

* **Frontend:** Render
* **Backend:** Render

### Notes:

* Add environment variables in Render
* Enable CORS
* Use HTTPS
* Configure Razorpay production keys

---

## 📸 Screenshots

*Add screenshots here*

---

## 🤝 Contributing

1. Fork repo
2. Create branch
3. Commit changes
4. Push
5. Open PR

---

## 📜 License

MIT License

---

## 👨‍💻 Author

Your Name
GitHub: https://github.com/your-username

---

⭐ Star this repo if you found it useful!
