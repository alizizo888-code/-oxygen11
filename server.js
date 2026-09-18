/**
 * =========================================================================
 * Mutqan Platform - Full Bypass & Direct Execution Server (server.js)
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

// مسار تخطي تلقائي شامل لأي تحقق أو قيود
app.use((req, res, next) => {
    // تخطي أي حظر أو توجيه وإتاحة الطلبات مباشرة للاختبار
    next();
});

// السماح بالوصول الفوري لكافة ملفات الواجهة والملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// مسار التخطي المباشر لفتح الواجهة الرئيسية
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// محاكاة استجابة نجاح فورية لأي طلب OTP أو تحقق لتجنب توقف التجربة
app.post('/api/auth/send-otp', (req, res) => {
    res.json({ status: 'success', message: 'تم التخطي بنجاح', debugOtp: '0000' });
});

app.post('/api/auth/verify-otp', (req, res) => {
    res.json({ status: 'success', message: 'تم تجاوز التحقق بنجاح والدخول كمسؤول سيادي' });
});

// مسار حالة النظام السيادي
app.get('/api/governance/status', (req, res) => {
    res.json({
        platform: 'Mutqan Platform',
        sovereignOwner: 'علي طلعت زيدان (آية)',
        masterAuthId: '789512364',
        systemStatus: 'bypass_active',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Bypass Mode] Server running seamlessly on port ${PORT}`);
});
