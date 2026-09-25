const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const admin = require("firebase-admin");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true }
});

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

const hostPages = {
  "oxygen11.com": "index.html",
  "www.oxygen11.com": "index.html",
  "admin.oxygen11.com": "admin.html",
  "owner.oxygen11.com": "owner.html",
  "client.oxygen11.com": "client.html",
  "technician.oxygen11.com": "technician.html"
};

const STATUS_FLOW = [
  "pending_dispatch",
  "assigned_automatic",
  "assigned_manual",
  "in_progress",
  "awaiting_payment",
  "completed",
  "cancelled"
];

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
  if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, "{}", "utf8");
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJson(file, value) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

ensureDataFiles();
let orders = readJson(ORDERS_FILE, []);
let sessions = readJson(SESSIONS_FILE, {});
let nextOrderId = orders.reduce((m, o) => Math.max(m, Number(o.orderId) || 1000), 1000) + 1;

function saveOrders() { writeJson(ORDERS_FILE, orders); }
function saveSessions() { writeJson(SESSIONS_FILE, sessions); }
function now() { return new Date().toISOString(); }

function initFirebase() {
  if (admin.apps.length) return true;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      });
      return true;
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      return true;
    }
  } catch (error) {
    console.error("[Oxygen11] Firebase Admin init failed:", error.message);
  }
  return false;
}

initFirebase();

function csvSet(value) {
  return String(value || "").split(",").map(x => x.trim()).filter(Boolean);
}

function configuredRole(uid) {
  if (csvSet(process.env.OWNER_UIDS).includes(uid)) return "owner";
  if (csvSet(process.env.ADMIN_UIDS).includes(uid)) return "admin";
  if (csvSet(process.env.TECH_UIDS).includes(uid)) return "tech";
  return "client";
}

async function verifyFirebaseToken(token) {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin is not configured on the server");
  }
  return admin.auth().verifyIdToken(token);
}

function createSession(uid, role) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions[token] = { uid, role, createdAt: Date.now() };
  saveSessions();
  return token;
}

function sessionFromRequest(req) {
  const token = req.cookies?.oxygen_session || req.get("x-oxygen-session");
  return token ? sessions[token] : null;
}

function requireAuth(req, res, next) {
  const session = sessionFromRequest(req);
  if (!session) return res.status(401).json({ ok: false, error: "Authentication required" });
  req.user = session;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    next();
  };
}

function audit(order, action, actor) {
  order.audit = order.audit || [];
  order.audit.push({ action, actor, at: now() });
}

function emitOrder(order) {
  io.emit("order_updated", order);
}

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "oxygen11",
    environment: process.env.NODE_ENV || "development",
    firebaseAdmin: admin.apps.length > 0,
    orders: orders.length,
    timestamp: now()
  });
});

app.get("/api/auth/config", (_req, res) => {
  res.json({
    ok: true,
    firebaseServerVerification: admin.apps.length > 0
  });
});

app.post("/api/auth/session", async (req, res) => {
  try {
    const token = String(req.body?.idToken || "");
    if (!token) return res.status(400).json({ ok: false, error: "idToken is required" });

    const decoded = await verifyFirebaseToken(token);
    const role = configuredRole(decoded.uid);
    const sessionToken = createSession(decoded.uid, role);

    res.cookie("oxygen_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 12
    });

    res.json({ ok: true, role, uid: decoded.uid });
  } catch (error) {
    res.status(401).json({ ok: false, error: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies?.oxygen_session;
  if (token) delete sessions[token];
  saveSessions();
  res.clearCookie("oxygen_session");
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.get("/api/orders", requireAuth, (req, res) => {
  let visible = orders;
  if (req.user.role === "client") visible = orders.filter(o => o.clientUid === req.user.uid);
  if (req.user.role === "tech") visible = orders.filter(o => !o.providerUid || o.providerUid === req.user.uid);
  res.json({ ok: true, orders: visible });
});

app.post("/api/orders", requireAuth, requireRole("client", "admin", "owner"), (req, res) => {
  const { clientName, phone, serviceCategory, priority, location, notes } = req.body || {};
  if (!clientName || !phone || !serviceCategory || !location) {
    return res.status(400).json({ ok: false, error: "clientName, phone, serviceCategory and location are required" });
  }

  const order = {
    orderId: nextOrderId++,
    clientUid: req.user.uid,
    clientName: String(clientName).trim(),
    phone: String(phone).trim(),
    serviceCategory: String(serviceCategory).trim(),
    priority: ["normal", "high", "critical"].includes(priority) ? priority : "normal",
    location: String(location).trim(),
    notes: notes ? String(notes).trim() : "",
    status: "pending_dispatch",
    dispatchType: "automatic",
    providerUid: null,
    providerName: null,
    pricing: { labor: 0, parts: 0, discount: 0, total: 0, commission: 0, providerNet: 0 },
    payment: { method: null, status: "pending", reference: null },
    invoice: null,
    audit: [],
    createdAt: now(),
    updatedAt: now()
  };

  audit(order, "order_created", req.user.uid);
  orders.unshift(order);
  saveOrders();
  io.emit("order_created", order);
  res.status(201).json({ ok: true, order });
});

app.post("/api/orders/:id/assign", requireAuth, requireRole("admin", "owner"), (req, res) => {
  const order = orders.find(o => o.orderId === Number(req.params.id));
  if (!order) return res.status(404).json({ ok: false, error: "Order not found" });
  if (!req.body?.providerUid) return res.status(400).json({ ok: false, error: "providerUid is required" });

  order.providerUid = String(req.body.providerUid);
  order.providerName = req.body.providerName ? String(req.body.providerName) : null;
  order.dispatchType = req.body.dispatchType === "manual" ? "manual" : "automatic";
  order.status = order.dispatchType === "manual" ? "assigned_manual" : "assigned_automatic";
  order.updatedAt = now();
  audit(order, "order_assigned", req.user.uid);
  saveOrders();
  emitOrder(order);
  res.json({ ok: true, order });
});

app.patch("/api/orders/:id/status", requireAuth, (req, res) => {
  const order = orders.find(o => o.orderId === Number(req.params.id));
  if (!order) return res.status(404).json({ ok: false, error: "Order not found" });
  const next = String(req.body?.status || "");

  if (!STATUS_FLOW.includes(next)) return res.status(400).json({ ok: false, error: "Invalid order status" });
  if (req.user.role === "client" && order.clientUid !== req.user.uid) return res.status(403).json({ ok: false, error: "Forbidden" });
  if (req.user.role === "tech" && order.providerUid !== req.user.uid) return res.status(403).json({ ok: false, error: "Forbidden" });

  order.status = next;
  order.updatedAt = now();
  audit(order, "status_changed:" + next, req.user.uid);
  saveOrders();
  emitOrder(order);
  res.json({ ok: true, order });
});

app.post("/api/orders/:id/invoice", requireAuth, requireRole("tech", "admin", "owner"), (req, res) => {
  const order = orders.find(o => o.orderId === Number(req.params.id));
  if (!order) return res.status(404).json({ ok: false, error: "Order not found" });
  if (req.user.role === "tech" && order.providerUid !== req.user.uid) return res.status(403).json({ ok: false, error: "Forbidden" });

  const labor = Math.max(0, Number(req.body?.labor) || 0);
  const parts = Math.max(0, Number(req.body?.parts) || 0);
  const discount = Math.max(0, Number(req.body?.discount) || 0);
  const subtotal = Math.max(0, labor + parts - discount);
  const commissionRate = Math.min(100, Math.max(0, Number(process.env.PLATFORM_COMMISSION_RATE || 15)));
  const commission = Number((subtotal * commissionRate / 100).toFixed(2));

  order.pricing = {
    labor, parts, discount,
    total: subtotal,
    commission,
    providerNet: Number((subtotal - commission).toFixed(2))
  };
  order.invoice = {
    invoiceId: "INV-" + order.orderId + "-" + Date.now(),
    issuedAt: now(),
    status: "issued"
  };
  order.status = "awaiting_payment";
  order.updatedAt = now();
  audit(order, "invoice_issued", req.user.uid);
  saveOrders();
  emitOrder(order);
  res.status(201).json({ ok: true, order });
});

app.post("/api/orders/:id/payment", requireAuth, (req, res) => {
  const order = orders.find(o => o.orderId === Number(req.params.id));
  if (!order) return res.status(404).json({ ok: false, error: "Order not found" });
  if (req.user.role === "client" && order.clientUid !== req.user.uid) return res.status(403).json({ ok: false, error: "Forbidden" });
  if (!order.invoice) return res.status(400).json({ ok: false, error: "Invoice not issued" });

  const method = ["online_mada_visa", "stc_pay", "wallet", "cash"].includes(req.body?.method) ? req.body.method : null;
  if (!method) return res.status(400).json({ ok: false, error: "Invalid payment method" });

  order.payment = {
    method,
    status: "paid",
    reference: String(req.body?.reference || "SIMULATED-" + Date.now())
  };
  order.invoice.status = "paid";
  order.status = "completed";
  order.updatedAt = now();
  audit(order, "payment_completed", req.user.uid);
  saveOrders();
  emitOrder(order);
  res.json({ ok: true, order });
});

app.get("/api/audit/orders/:id", requireAuth, requireRole("admin", "owner"), (req, res) => {
  const order = orders.find(o => o.orderId === Number(req.params.id));
  if (!order) return res.status(404).json({ ok: false, error: "Order not found" });
  res.json({ ok: true, audit: order.audit || [] });
});

app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.get("/", (req, res) => {
  const hostname = (req.hostname || "").toLowerCase();
  res.sendFile(path.join(PUBLIC_DIR, hostPages[hostname] || "index.html"));
});

io.on("connection", (socket) => {
  socket.emit("server_ready", { service: "oxygen11", timestamp: now() });
  socket.emit("init_orders", orders);

  socket.on("send_chat_message", (payload = {}) => {
    io.emit("chat_message", {
      orderId: Number(payload.orderId),
      sender: String(payload.sender || "system"),
      text: String(payload.text || "").slice(0, 2000),
      timestamp: now()
    });
  });
});

app.use((err, _req, res, _next) => {
  console.error("[Oxygen11] Request error:", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Oxygen11] Server listening on port ${PORT}`);
});
