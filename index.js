const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// صفحة رئيسية
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>مرحباً بك - Oxygen11</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <h1>🚀 مرحباً بك في Oxygen11</h1>
      <p>المشروع يعمل بنجاح على Hostinger!</p>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`الخادم يعمل على المنفذ ${port}`);
});
