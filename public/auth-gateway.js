/**
 * MUCS Auth Gateway - بوابة التوثيق والفرز
 */
const MUCS_Auth = (function() {
  
  const firebaseConfig = {
    apiKey: "AIzaSyCJnFR_cALYeWvPHroEqdCHbnhlcREdjPI",
    authDomain: "mutqn-opt.firebaseapp.com",
    projectId: "mutqn-opt",
    storageBucket: "mutqn-opt.firebasestorage.app",
    messagingSenderId: "290720043173",
    appId: "1:290720043173:web:72167db99e1b801e31fd4c"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  return {
    initCaptcha: function() {
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => { console.log('Captcha validated'); }
      });
      window.recaptchaVerifier.render().catch(console.error);
    },

    sendOTP: function() {
      let rawPhone = document.getElementById('phoneNumber').value.trim();
      if (!rawPhone || rawPhone.length < 8) return MUCS_Core.showToast("الرجاء إدخال رقم جوال صحيح", true);

      let phone = rawPhone.startsWith('+') ? rawPhone : '+966' + (rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone);
      const btn = document.getElementById('btn-send-otp');
      btn.disabled = true; btn.innerText = "جاري الإرسال...";

      firebase.auth().signInWithPhoneNumber(phone, window.recaptchaVerifier)
        .then((confirmationResult) => {
          window.confirmationResult = confirmationResult;
          document.getElementById('step-phone').classList.add('hidden');
          document.getElementById('step-verify').classList.remove('hidden');
          MUCS_Core.showToast("تم إرسال الكود بنجاح ✓");
        }).catch((error) => {
          console.error(error);
          MUCS_Core.showToast("فشل الإرسال. تأكد من إعدادات النطاق في فايربيز", true);
          btn.disabled = false; btn.innerText = "إرسال كود التحقق (OTP)";
          this.initCaptcha();
        });
    },

    verifyOTP: function() {
      const code = document.getElementById('otpCode').value.trim();
      if (code.length < 6) return MUCS_Core.showToast("أدخل 6 أرقام", true);

      const btn = document.getElementById('btn-verify-otp');
      btn.disabled = true; btn.innerText = "جاري التحقق...";

      window.confirmationResult.confirm(code)
        .then((result) => {
          const user = result.user;
          const role = document.getElementById('selected-role').value;
          
          // تشفير الجلسة
          const userData = { phone: user.phoneNumber, role: role, uid: user.uid };
          const token = encodeURIComponent(btoa(JSON.stringify(userData)));
          
          // الفرز المباشر (Routing)
          const targetDomain = role === 'tech' ? 'https://technician.oxygen11.com' : 'https://client.oxygen11.com';
          MUCS_Core.showToast("نجاح! جاري التوجيه...");
          setTimeout(() => window.location.replace(`${targetDomain}/?auth_token=${token}`), 1000);

        }).catch((error) => {
          MUCS_Core.showToast("الكود المدخل غير صحيح", true);
          btn.disabled = false; btn.innerText = "تأكيد الدخول";
        });
    }
  };
})();
