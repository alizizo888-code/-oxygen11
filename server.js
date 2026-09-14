const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API اختبار
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'Oxygen11 يعمل بنجاح!',
        timestamp: new Date()
    });
});

// معالجة الأخطاء 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 الخادم يعمل على: http://localhost:${port}`);
    console.log('✅ Oxygen11 جاهز للعمل');
});