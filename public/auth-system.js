/**
 * auth-system.js
 * محرك الجلسات والتوجيه الصحيح لكل نطاق فرعي (Subdomain) بشكل مستقل
 */
const MotqanAuthSystem = (function () {
  const STORAGE_SESSION_KEY = 'motqan_active_session';
  const STORAGE_USERS_KEY = 'motqan_registered_users';

  // جدول التوجيه الدقيق لكل دور إلى نطاقه الفرعي المخصص حصرياً
  const REDIRECT_DOMAINS = {
    client: 'https://client.oxygen11.com',
    tech: 'https://technician.oxygen11.com',
    supervisor: 'https://admin.oxygen11.com',
    owner: 'https://owner.oxygen11.com'
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
    // 1. التحقق التلقائي عند فتح الموقع الرئيسي وتوجيه كل فرع لمكانه الصحيح
    autoRedirectIfLoggedIn: function () {
      try {
        const session = localStorage.getItem(STORAGE_SESSION_KEY);
        if (session) {
          const user = JSON.parse(session);
          if (user && user.role && REDIRECT_DOMAINS[user.role]) {
            // منع إعادة التوجيه اللانهائي إذا كان المستخدم موجوداً بالفعل في نفس النطاق الفرعي الخاص به
            const currentHost = window.location.hostname;
            const targetDomain = new URL(REDIRECT_DOMAINS[user.role]).hostname;
            
            if (currentHost !== targetDomain) {
              window.location.replace(REDIRECT_DOMAINS[user.role]);
              return true;
            }
          }
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
      return false;
    },

    // 2. تسجيل حساب جديد وتوجيهه للنطاق الفرعي الخاص به فوراً
    register: function ({ name, phone, password, role }) {
      if (!phone || !password) throw new Error('يرجى إدخال الجوال وكلمة المرور');

      const users = getRegisteredUsers();
      const cleanPhone = phone.trim();

      const assignedRole = ['client', 'tech', 'supervisor', 'owner'].includes(role) ? role : 'client';

      const newUser = {
        name: (name || '').trim(),
        phone: cleanPhone,
        password: password.trim(),
        role: assignedRole
      };

      users[cleanPhone] = newUser;
      saveRegisteredUsers(users);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newUser));

      // التحويل للنطاق الفرعي الدقيق
      window.location.replace(REDIRECT_DOMAINS[assignedRole]);
    },

    // 3. تسجيل الدخول والتوجيه للنطاق الفرعي الخاص بالدور
    login: function ({ phone, password }) {
      if (!phone || !password) throw new Error('يرجى إدخال الجوال وكلمة المرور');

      const users = getRegisteredUsers();
      const user = users[phone.trim()];

      if (!user || user.password !== password.trim()) {
        throw new Error('بيانات الدخول غير صحيحة');
      }

      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
      
      // التحويل للنطاق الفرعي الدقيق
      window.location.replace(REDIRECT_DOMAINS[user.role]);
    },

    // 4. تسجيل الخروج والعودة للموقع الرئيسي (www.oxygen11.com)
    logout: function () {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      window.location.replace('https://www.oxygen11.com');
    }
  };
})();

// تشغيل الفحص اللحظي فور التحميل
MotqanAuthSystem.autoRedirectIfLoggedIn();
