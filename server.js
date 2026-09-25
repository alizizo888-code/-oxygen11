const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: false } });

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

const hostPages = {
  "oxygen11.com": "index.html",
  "www.oxygen11.com": "index.html",
  "admin.oxygen11.com": "admin.html",
  "owner.oxygen11.com": "owner.html",
  "client.oxygen11.com": "client.html",
  "technician.oxygen11.com": "technician.html"
};

const orders = new Map();
let nextOrderId = 1001;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "oxygen11",
    environment: process.env.NODE_ENV || "development",
    orders: orders.size,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/orders", (_req, res) => {
  res.json({ ok: true, orders: Array.from(orders.values()) });
});

app.post("/api/orders", (req, res) => {
  const { clientName, phone, serviceCategory, priority, location, notes } = req.body || {};

  if (!clientName || !phone || !serviceCategory || !location) {
    return res.status(400).json({
      ok: false,
      error: "clientName, phone, serviceCategory and location are required"
    });
  }

  const order = {
    orderId: nextOrderId++,
    clientName: String(clientName).trim(),
    phone: String(phone).trim(),
    serviceCategory: String(serviceCategory).trim(),
    priority: priority || "normal",
    location: String(location).trim(),
    notes: notes ? String(notes).trim() : "",
    status: "pending_dispatch",
    providerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.set(order.orderId, order);
  io.emit("order_created", order);

  return res.status(201).json({ ok: true, order });
});

app.patch("/api/orders/:id/status", (req, res) => {
  const orderId = Number(req.params.id);
  const order = orders.get(orderId);
  const allowed = [
    "pending_dispatch",
    "assigned_automatic",
    "assigned_manual",
    "in_progress",
    "completed",
    "cancelled"
  ];

  if (!order) {
    return res.status(404).json({ ok: false, error: "Order not found" });
  }

  if (!allowed.includes(req.body?.status)) {
    return res.status(400).json({ ok: false, error: "Invalid order status" });
  }

  order.status = req.body.status;
  order.updatedAt = new Date().toISOString();
  orders.set(orderId, order);
  io.emit("order_updated", order);

  return res.json({ ok: true, order });
});

app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.get("/", (req, res) => {
  const hostname = (req.hostname || "").toLowerCase();
  const page = hostPages[hostname] || "index.html";
  res.sendFile(path.join(PUBLIC_DIR, page));
});

app.use((err, _req, res, _next) => {
  console.error("[Oxygen11] Request error:", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

io.on("connection", (socket) => {
  socket.emit("server_ready", {
    service: "oxygen11",
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  socket.emit("init_orders", Array.from(orders.values()));

  socket.on("tech_update_task", (payload = {}) => {
    const orderId = Number(payload.orderId);
    const order = orders.get(orderId);
    if (!order) return;

    if (payload.status) {
      order.status = String(payload.status);
      order.updatedAt = new Date().toISOString();
      orders.set(orderId, order);
      io.emit("order_updated", order);
    }
  });

  socket.on("send_chat_message", (payload = {}) => {
    io.emit("chat_message", {
      ...payload,
      timestamp: new Date().toISOString()
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Oxygen11] Server listening on port ${PORT}`);
});
