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

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "oxygen11",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

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
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Oxygen11] Server listening on port ${PORT}`);
});
