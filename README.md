# Oxygen11 / مُتقن

منصة خدمات الصيانة والمقاولات مع بوابات منفصلة للعميل والفني والإدارة والمالك.

## التشغيل

```bash
npm install
npm start
```

فحص JavaScript:

```bash
npm run check
```

فحص الصحة بعد التشغيل:

```
GET /health
```

## البوابات

- `oxygen11.com` → البوابة الرئيسية
- `client.oxygen11.com` → العميل
- `technician.oxygen11.com` → الفني
- `admin.oxygen11.com` → الإدارة
- `owner.oxygen11.com` → المالك

يتم توجيه النطاقات من خلال `server.js`، ولا توجد حاجة لملفات HTML داخل مجلدات تحمل امتداد `.html`.

## البنية الحالية

- `public/` واجهات الويب والـ assets
- `backend/dispatch_engine/` توزيع الطلبات
- `backend/payment_gateway/` حسابات الدفع والعمولات
- `communications/chat_sockets/` طبقة الاتصال اللحظي
- `database/` مخططات قاعدة البيانات
- `motqan-*.js` محركات النظام الحالية

## ملاحظة أمنية

Firebase OTP مسؤول عن التحقق من هوية المستخدم في الواجهة الحالية. صلاحيات الإنتاج يجب أن تُفرض لاحقاً على الخادم/قاعدة البيانات، وليس بواسطة JavaScript في المتصفح وحده. لا تضع مفاتيح سرية أو كلمات مرور في ملفات `public/`.
