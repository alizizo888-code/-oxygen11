# Oxygen 11 — WordPress + OpenAI

نسخة Oxygen AI مخصصة للعمل مع WordPress وHostinger.

## البنية
- `index.html` — واجهة Oxygen AI.
- `wordpress/oxygen-ai-endpoint.php` — جسر WordPress REST إلى OpenAI.
- لا يتم وضع مفتاح OpenAI داخل HTML أو JavaScript أو GitHub.

## WordPress
المسار المقترح:
`/wp-json/oxygen-ai/v1/chat`

## الدومين
الهدف النهائي:
`https://www.oxygen11.com`

يجب أن يكون DNS للدومين الرئيسي موجهاً إلى نفس حساب Hostinger الذي عليه WordPress، وبعد التأكد من DNS يمكن ضبط Site URL/Home في WordPress.

## OpenAI
يُستخدم OpenAI Responses API من السيرفر، وليس من المتصفح. هذا يمنع كشف المفتاح في الصفحة أو GitHub.
