const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// تقديم جميع الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API للاختبار
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: '✅ Oxygen11 يعمل بنجاح!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// التعامل مع جميع الملفات في public folder
app.get('/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.params.filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});

// معالجة 404 - إعادة توجيه للصفحة الرئيسية
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`\n🚀 ==========================================`);
    console.log(`✅ Oxygen11 يعمل الآن!`);
    console.log(`🌐 المنفذ: ${PORT}`);
    console.log(`📍 الرابط: http://localhost:${PORT}`);
    console.log(`==========================================\n`);
});

module.exports = app;
