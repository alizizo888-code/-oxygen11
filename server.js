// تخزين مؤقت لرموز التحقق (للإنتاج يُفضل استخدام Redis أو قاعدة البيانات)
const otpStorage = new Map();

// 1. طلب إرسال رمز OTP
app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString(); // رمز من 4 أرقام
    
    otpStorage.set(phone, {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000 // صالح لمدة 5 دقائق
    });

    console.log(`[OTP Secure Gateway] Code for ${phone}: ${generatedOtp}`);
    
    // هنا يتم ربط بوابة الرسائل النصية (SMS Gateway) مستقبلاً
    res.json({ status: 'success', message: 'تم إرسال رمز التحقق بنجاح (راجع السيرفر للاختبار)', debugOtp: generatedOtp });
});

// 2. التحقق من الرمز وتسجيل الدخول
app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    const record = otpStorage.get(phone);

    if (!record) {
        return res.status(400).json({ status: 'failed', message: 'انتهت صلاحية الرمز أو لم يتم طلبه.' });
    }

    if (Date.now() > record.expiresAt) {
        otpStorage.delete(phone);
        return res.status(400).json({ status: 'failed', message: 'انتهت صلاحية رمز التحقق.' });
    }

    if (record.otp === otp) {
        otpStorage.delete(phone);
        res.json({ status: 'success', message: 'تم تسجيل الدخول بنجاح وتوثيق الهوية.' });
    } else {
        res.status(400).json({ status: 'failed', message: 'رمز التحقق غير صحيح.' });
    }
});
