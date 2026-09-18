/**
 * =========================================================================
 * Mutqan Platform - Main Server & Central Orchestrator (server.js)
 * Sovereign IP Protection: SAIP-CR-2024-8891
 * Sovereign Owner/Author: علي طلعت زيدان (آية) - ID: 789512364
 * =========================================================================
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// استدعاء المحركات والوحدات السيادية للمنصة
const MutqanDispatchEngine = require('./backend/dispatch_engine/engine');
const MutqanPaymentProcessor = require('./backend/payment_gateway/payment_processor');
const MutqanChatEngine = require('./communications/chat_sockets/socket_handler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());

// محاكاة الاتصال بقاعدة البيانات ووحدات التشغيل
const dbMockConnection = { status: 'connected_securely' };
const dispatchEngine = new MutqanDispatchEngine(dbMockConnection);
const paymentProcessor = new MutqanPaymentProcessor(dbMockConnection);
const chatEngine = new MutqanChatEngine(io);

// تهيئة محادثات السوكيت الفورية
chatEngine.initializeSocketHandlers();

// 1. مسار التحقق من سلامة وصلاحيات النظام السيادي
app.get('/api/governance/status', (req, res) => {
    res.json({
        platform: 'Mutqan Platform',
        sovereignOwner: 'علي طلعت زيدان (آية)',
        masterAuthId: '789512364',
        systemStatus: 'active',
        ipProtection: 'SAIP-CR-2024-8891',
        timestamp: new Date().toISOString()
    });
});

// 2. مسار تسجيل العملاء والتفعيل التلقائي للمحفظة
app.post('/api/clients/register', async (req, res) => {
    try {
        const result = await dispatchEngine.registerClient(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. مسار تسجيل الفنيين بحالة "زائر/معلق" افتراضياً
app.post('/api/providers/register', async (req, res) => {
    try {
        const result = await dispatchEngine.registerProvider(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. مسار معالجة الطلبات والتوزيع (آلي أو يدوي سيادي)
app.post('/api/orders/dispatch', async (req, res) => {
    try {
        const { orderId, dispatchType, targetProviderId } = req.body;
        const result = await dispatchEngine.dispatchOrder(orderId, dispatchType, targetProviderId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. مسار احتساب الحسابات والماليات وبوابات الدفع
app.post('/api/payments/calculate-and-pay', async (req, res) => {
    try {
        const { orderId, basePrice, spareParts, discount, paymentMethod, walletBalance } = req.body;
        const financials = paymentProcessor.calculateOrderFinancials(basePrice, spareParts, discount);
        const paymentResult = await paymentProcessor.processPayment(orderId, financials.grossTotal, paymentMethod, walletBalance);
        
        res.json({
            financials,
            paymentResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تشغيل الخادم على المنفذ المحدد
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Mutqan Sovereign Server] Running securely on port ${PORT} [Auth ID: 789512364]`);
});
