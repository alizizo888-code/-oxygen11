/**
 * =========================================================================
 * Mutqan Platform - Direct Execution & Bypass (server.js)
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
app.use(express.urlencoded({ extended: true }));

// تفعيل الملفات الثابتة من مجلد public مباشرة
app.use(express.static(path.join(__dirname, 'public')));

// مسارات مباشرة لتخطي أي عوائق أو رموز OTP
app.post('/api/auth/send-otp', (req, res) => {
    res.json({ status: 'success', message: 'تم التخطي بنجاح بدون OTP', debugOtp: '0000' });
});

app.post('/api/auth/verify-otp', (req, res) => {
    res.json({ status: 'success', message: 'تم تجاوز التحقق بنجاح' });
});

app.post('/api/clients/register', (req, res) => {
    res.json({ status: 'success', message: 'تم تسجيل العميل بنجاح مباشر!' });
});

app.post('/api/providers/register', (req, res) => {
    res.json({ status: 'success', message: 'تم تقديم طلب الفني بنجاح!' });
});

// مسار رئيسي يفتح المنصة مباشرة
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Direct Server] Running smoothly on port ${PORT}`);
});
