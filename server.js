/**
 * =========================================================================
 * Mutqan Platform - Advanced Sovereign Server & Audit Engine (server.js)
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
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات مؤقتة لتتبع المستخدمين والحسابات والأنشطة
const usersDatabase = new Map();
const activityLogs = [];
const otpCodes = new Map();

const SOVEREIGN_MASTER_PIN = "789512364";

// 1. مسار إرسال رمز التحقق OTP
app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ status: 'error', message: 'رقم الجوال مطلوب' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpCodes.set(phone, { otp, expires: Date.now() + 300000 }); // صالح لـ 5 دقائق

    // تسجيل النشاط في السجل السيادي
    activityLogs.push({
        action: 'SEND_OTP',
        target: phone,
        timestamp: new Date().toISOString(),
        details: `تم إرسال رمز التحقق بنجاح`
    });

    console.log(`[OTP Engine] Code for ${phone}: ${otp}`);
    res.json({ status: 'success', message: 'تم إرسال رمز التحقق', debugOtp: otp });
});

// 2. مسار التحقق من OTP وتفعيل/تحديث حالة الحساب
app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp, role, fullName } = req.body;
    const record = otpCodes.get(phone);

    if (!record || record.otp !== otp) {
        return res.status(400).json({ status: 'error', message: 'رمز التحقق غير صحيح أو انتهت صلاحيته' });
    }

    // تحديث بيانات المستخدم في السجل
    let user = usersDatabase.get(phone) || {
        phone,
        fullName: fullName || 'مستخدم جديد',
        role: role || 'client',
        status: 'active', // active / closed
        createdAt: new Date().toISOString()
    };

    user.lastActive = new Date().toISOString();
    user.status = 'active';
    usersDatabase.set(phone, user);

    activityLogs.push({
        action: 'LOGIN_SUCCESS',
        target: phone,
        role: user.role,
        timestamp: user.lastActive,
        details: 'تم تسجيل الدخول وتوثيق الحساب بنجاح'
    });

    otpCodes.delete(phone);
    res.json({ status: 'success', message: 'تم الدخول بنجاح', user });
});

// 3. مسار جلب سجلات المستخدمين والنشاطات (خاص بالمالك والمشرفين)
app.get('/api/admin/logs', (req, res) => {
    const { pin } = req.headers;
    if (pin !== SOVEREIGN_MASTER_PIN) {
        return res.status(403).json({ status: 'unauthorized', message: 'صلاحيات مرفوضة. رقم المالك مطلوب.' });
    }

    const usersList = Array.from(usersDatabase.values());
    res.json({
        status: 'success',
        users: usersList,
        logs: activityLogs
    });
});

// مسار حالة النظام
app.get('/api/governance/status', (req, res) => {
    res.json({
        platform: 'Mutqan Platform',
        sovereignOwner: 'علي طلعت زيدان (آية)',
        masterAuthId: SOVEREIGN_MASTER_PIN,
        systemStatus: 'active',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Secure Engine] Running on port ${PORT}`);
});
