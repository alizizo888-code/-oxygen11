const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تفعيل مجلد public لعرض الملفات بانتظام
app.use(express.static(path.join(__dirname, 'public')));

// مسار رئيسي يفتح index.html مباشرة
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[Mutqan Platform] Running smoothly on port ${PORT}`);
});
