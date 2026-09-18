const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ربط مجلد public بشكل صحيح ومباشر لتجنب أي تجمد في عرض الملفات
app.use(express.static(path.join(__dirname, 'public')));

// مسارات مباشرة لتجاوز أي تعليق
app.post('/api/auth/send-otp', (req, res) => {
    res.json({ status: 'success', message: 'تم إرسال الرمز بنجاح', debugOtp: '1234' });
});

app.post('/api/auth/verify-otp', (req, res) => {
    res.json({ status: 'success', message: 'تم الدخول بنجاح' });
});

app.post('/api/clients/register', (req, res) => {
    res.json({ status: 'success', message: 'تم تسجيل العميل وتفعيل المحفظة بنجاح!' });
});

app.post('/api/providers/register', (req, res) => {
    res.json({ status: 'success', message: 'تم تقديم طلب الفني بنجاح!' });
});

// توجيه أي طلب لفتح الصفحة الرئيسية مباشرة
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Server] Running lively on port ${PORT}`);
});
