// إعدادات فايربيز (مشروع mutqn-opt)
const firebaseConfig = {
    apiKey: "AIzaSyCJnFR_cALYeWvPHroEqdCHbnhlcREdjPI",
    authDomain: "mutqn-opt.firebaseapp.com",
    projectId: "mutqn-opt",
    storageBucket: "mutqn-opt.firebasestorage.app",
    messagingSenderId: "290720043173",
    appId: "1:290720043173:web:72167db99e1b801e31fd4c"
};

// تهيئة فايربيز بمجرد تحميل الصفحة
firebase.initializeApp(firebaseConfig);
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' });

// دالة التنقل بين التبويبات (دخول / حساب جديد)
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    if (tabName === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('login-section').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('register-section').classList.add('active');
    }
    hideMessage();
}

// دالة اختيار الأيقونات (المنطقة والحي)
function selectOption(element, group) {
    const parent = element.parentElement;
    parent.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    // القيمة المحددة أصبحت جاهزة للحفظ في الداتا بيز بناءً على الكلاس 'selected'
}

// دالة التقاط الموقع الجغرافي GPS
function getLocation() {
    const btn = document.getElementById('gpsBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تحديد الموقع...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                document.getElementById('gpsCoords').value = `${lat},${lng}`;
                
                btn.classList.add('success');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> تم تحديد الموقع بنجاح!';
            },
            (error) => {
                btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> فشل التحديد، تأكد من تفعيل GPS';
                showMessage("يرجى السماح للمتصفح بالوصول لموقعك.", true);
            },
            { enableHighAccuracy: true }
        );
    } else {
        showMessage("المتصفح الخاص بك لا يدعم تحديد الموقع.", true);
    }
}

// دالة إرسال كود الـ OTP
function requestOTP(inputId) {
    const phone = document.getElementById(inputId).value.trim();
    if (!phone.startsWith('+')) {
        showMessage("الرجاء إدخال مفتاح الدولة (مثال: +966 أو +20)", true);
        return;
    }

    // التحقق من إدخال البيانات المطلوبة في حالة التسجيل الجديد
    if (inputId === 'regPhone') {
        const name = document.getElementById('regName').value.trim();
        const gps = document.getElementById('gpsCoords').value;
        if(!name || !gps) {
            showMessage("الرجاء إدخال الاسم وتحديد موقعك بالـ GPS أولاً", true);
            return;
        }
    }

    showMessage("جاري إرسال الكود...");
    firebase.auth().signInWithPhoneNumber(phone, window.recaptchaVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById('verify-section').classList.add('active');
            showMessage("تم الإرسال بنجاح!", false);
        }).catch((error) => {
            showMessage("حدث خطأ: " + error.message, true);
            if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(id => grecaptcha.reset(id));
        });
}

// دالة التحقق من الكود المدخل
function verifyOTP() {
    const code = document.getElementById('otpCode').value.trim();
    if (code.length < 6) return showMessage("أدخل 6 أرقام", true);

    window.confirmationResult.confirm(code)
        .then((result) => {
            const user = result.user;
            // هنا يتم استخراج البيانات وإرسالها لقاعدة البيانات الخاصة بك
            document.getElementById('verify-section').innerHTML = `
                <i class="fa-solid fa-circle-check" style="font-size: 50px; color: #10b981; margin-bottom:15px;"></i>
                <h3 style="color: #10b981;">تم الدخول بنجاح!</h3>
                <p style="color: #94a3b8;">مرحباً بك في مُتقن</p>
            `;
            showMessage("تم التوثيق بنجاح", false);
        }).catch((error) => {
            showMessage("الكود غير صحيح", true);
        });
}

// دوال مساعدة لعرض وإخفاء الرسائل
function showMessage(text, isError) {
    const msgDiv = document.getElementById('statusMessage');
    msgDiv.style.display = 'block';
    msgDiv.className = 'msg ' + (isError ? 'error-msg' : 'success-msg');
    msgDiv.innerText = text;
}

function hideMessage() {
    document.getElementById('statusMessage').style.display = 'none';
}
