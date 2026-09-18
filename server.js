const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد قراءة ملفات JSON والبيانات المرسلة
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تفعيل مجلد الواجهات الأمامية بشكل مباشر ونظيف
app.use(express.static(path.join(__dirname, 'public')));

// مسار تجريبي مباشر للتحقق من عمل السيرفر
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', message: 'السيرفر يعمل بكفاءة تامة بدون عوائق' });
});

// توجيه أي رابط افتراضي لفتح الواجهة الرئيسية مباشرة دون أي تعقيد
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[Clean Server] Running smoothly on port ${PORT}`);
});
