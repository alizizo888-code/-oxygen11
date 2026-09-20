/**
 * auth-system.js
 * نظام إدارة الجلسات والتوجيه التلقائي عبر النطاقات الفرعية (Subdomains)
 */
const MotqanAuthSystem = (function () {
  const STORAGE_SESSION_KEY = 'motqan_active_session';
  const STORAGE_USERS_KEY = 'motqan_registered_users';

  // الروابط والنطاقات الفرعية المخصصة لكل دور
  const REDIRECT_DOMAINS = {
    client: 'https://client.oxygen11.com',
    tech: 'https://technician.oxygen11.com'
  };

  function getRegisteredUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveRegisteredUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  return {
    // 1. فحص الجلسة التلقائي (يُستدعى فور فتح الموقع الرئيسي)
    autoRedirectIfLoggedIn: function () {
      try {
        const session = localStorage.getItem(STORAGE_SESSION_KEY);
        if (session) {
          const user = JSON.parse(session);
          if (user && user.role && REDIRECT_DOMAINS[user.role]) {
            // التحويل الفوري للنطاق الفرعي الخاص بالعميل أو الفني
            window.location.replace(REDIRECT_DOMAINS[user.role]);
            return true;
          }
        }
      } catch (err) {
        console.error("Auth Session Error:", err);
      }
      return false; // يظل الزائر في الصفحة الرئيسية
    },

    // 2. إنشاء حساب جديد والتوجيه للنطاق الفرعي
    register: function ({ name, phone, password, role }) {
      if (!phone || !password) {
        throw new Error('يرجى كتابة رقم الجوال وكلمة المرور');
      }

      const users = getRegisteredUsers();
      const cleanPhone = phone.trim();

      const newUser = {
        name: (name || '').trim(),
        phone: cleanPhone,
        password: password.trim(),
        role: role === 'tech' ? 'tech' : 'client',
        createdAt: new Date().toISOString()
      };

      users[cleanPhone] = newUser;
      saveRegisteredUsers(users);

      // حفظ الجلسة النشطة
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newUser));

      // التحويل الفوري للنطاق الفرعي
      window.location.replace(REDIRECT_DOMAINS[newUser.role]);
    },

    // 3. تسجيل الدخول والتحقق ثم التوجيه بالنطاق الفرعي
    login: function ({ phone, password }) {
      if (!phone || !password) {
        throw new Error('يرجى إدخال الجوال وكلمة المرور');
      }

      const users = getRegisteredUsers();
      const cleanPhone = phone.trim();
      const user = users[cleanPhone];

      if (!user || user.password !== password.trim()) {
        throw new Error('بيانات الدخول غير صحيحة');
      }

      // حفظ الجلسة والتوجيه للنطاق الفرعي
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
      window.location.replace(REDIRECT_DOMAINS[user.role]);
    },

    // 4. تسجيل الخروج والعودة للرئيسية
    logout: function (returnUrl = 'https://oxygen11.com') {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      window.location.replace(returnUrl);
    }
  };
})();

// تشغيل التحقق اللحظي فور تحميل السكربت
MotqanAuthSystem.autoRedirectIfLoggedIn();
