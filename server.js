/**
 * =========================================================================
 * Mutqan Platform - Direct Open Access Server (server.js)
 * Sovereign ID: 789512364
 * =========================================================================
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());

// السماح بالوصول المباشر لكافة ملفات الواجهة في مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// مسار رئيسي يفتح المنصة مباشرة دون الحاجة لتسجيل دخول
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار الحالة السيادية للنظام
app.get('/api/governance/status', (req, res) => {
    res.json({
        platform: 'Mutqan Platform',
        sovereignOwner: 'علي طلعت زيدان (آية)',
        masterAuthId: '789512364',
        systemStatus: 'active',
        directAccess: true,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Direct Server] Running successfully on port ${PORT}`);
});
