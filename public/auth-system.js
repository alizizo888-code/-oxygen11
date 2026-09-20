/**
 * auth-system.js (المحدث لحل مشكلة الارتداد للرئيسي)
 */
const MotqanAuthSystem = (function () {
  const STORAGE_SESSION_KEY = 'motqan_active_session';
  const STORAGE_USERS_KEY = 'motqan_registered_users';

  const REDIRECT_DOMAINS = {
    client: 'https://client.oxygen11.com',
    tech: 'https://technician.oxygen11.com',
    supervisor: 'https://admin.oxygen11.com',
    owner: 'https://owner.oxygen11.com'
  };

  // دالة تشفير وتمرير الجلسة للنطاق الفرعي
  function redirectToSubdomain(role, userData) {
    if (!REDIRECT_DOMAINS[role]) return;
    
    // تحويل بيانات المستخدم لنص مشفر يُمرر للفرع
    const sessionToken = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(userData)))));
    const targetUrl = `${REDIRECT_DOMAINS[role]}/?auth_token=${sessionToken}`;
    
    window.location.replace(targetUrl);
  }

  return {
    autoRedirectIfLoggedIn: function () {
      try {
        const session = localStorage.getItem(STORAGE_SESSION_KEY);
        if (session) {
          const user = JSON.parse(session);
          if (user && user.role) {
            // فحص عشان ميعملش تحويل لو إحنا أصلاً في الفرع
            const currentHost = window.location.hostname;
            const targetHost = new URL(REDIRECT_DOMAINS[user.role]).hostname;
            
            if (currentHost !== targetHost && currentHost.includes('oxygen11.com')) {
              redirectToSubdomain(user.role, user);
              return true;
            }
          }
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
      return false;
    },

    register: function ({ name, phone, password, role }) {
      if (!phone || !password) throw new Error('يرجى إدخال الجوال وكلمة المرور');

      const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '{}');
      const cleanPhone = phone.trim();
      const assignedRole = ['client', 'tech', 'supervisor', 'owner'].includes(role) ? role : 'client';

      const newUser = {
        name: (name || '').trim(),
        phone: cleanPhone,
        password: password.trim(),
        role: assignedRole,
        wallet: 0.0,
        points: 50
      };

      users[cleanPhone] = newUser;
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newUser));

      // تحويل فوري مع تمرير التوكن للفرع
      redirectToSubdomain(assignedRole, newUser);
    },

    login: function ({ phone, password }) {
      if (!phone || !password) throw new Error('يرجى إدخال الجوال وكلمة المرور');

      const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '{}');
      const user = users[phone.trim()];

      if (!user || user.password !== password.trim()) {
        throw new Error('بيانات الدخول غير صحيحة');
      }

      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
      redirectToSubdomain(user.role, user);
    }
  };
})();

// تشغيل الفحص التلقائي
MotqanAuthSystem.autoRedirectIfLoggedIn();
