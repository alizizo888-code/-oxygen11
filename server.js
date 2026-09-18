/**
 * =========================================================================
 * Mutqan Platform - Secure Server & Sovereign Control (server.js)
 * Sovereign ID: 789512364
 * =========================================================================
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use(express.static('public')); // لخدمة ملفات الواجهة

const SOVEREIGN_MASTER_ID = "789512364";

// مسار حالة النظام والتحقق السيادي
app.get('/api/governance/status', (req, res) => {
    res.json({
        platform: 'Mutqan Platform',
        sovereignOwner: 'علي طلعت زيدان (آية)',
        masterAuthId: SOVEREIGN_MASTER_ID,
        systemStatus: 'active',
        registrationLocked: true, // تم إغلاق التسجيل العام
        timestamp: new Date().toISOString()
    });
});

// إغلاق التسجيل العام وتفعيل الحماية السيادية
app.post('/api/clients/register', (req, res) => {
    res.status(403).json({ 
        status: 'locked', 
        message: 'تم إغلاق صفحة التسجيل العامة مؤقتاً بأمر الإدارة السيادية وحماية النظام.' 
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Sovereign Server] Securely running on port ${PORT}`);
});
