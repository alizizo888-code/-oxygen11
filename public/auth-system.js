// ==========================================
// نظام إدارة التسجيل والدخول الموحد (مُتقن)
// ==========================================

const AUTH_CONFIG = {
  // روابط الواجهات التي يتم التوجيه إليها
  REDIRECT_URLS: {
    client: 'client.html',       // صفحة العميل
    technician: 'technician.html' // صفحة الفني
  },
  STORAGE_KEYS: {
    CURRENT_USER: 'motqan_active_session',
    USERS_DB: 'motqan_users_db'
  }
};

// 1. الفحص التلقائي الفوري عند فتح التطبيق
(function autoRedirectSession() {
  const session = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
  if (session) {
    try {
      const user = JSON.parse(session);
      if (user && user.role && AUTH_CONFIG.REDIRECT_URLS[user.role]) {
        // تحويل أوتوماتيك مباشر للواجهة المخصصة
        window.location.replace(AUTH_CONFIG.REDIRECT_URLS[user.role]);
      }
    } catch (e) {
      console.error('خطأ في استعادة الجلسة:', e);
    }
  }
})();

// 2. دالة تسجيل حساب جديد من واجهة الزائر
function registerNewUser(name, phone, pin, role = 'client') {
  // تنظيف المدخلات
  name = name.trim();
  phone = phone.trim();
  pin = pin.trim();

  if (!name || !phone || !pin) {
    alert('يرجى ملء جميع الحقول المطلوبة');
    return false;
  }

  // جلب قاعدة البيانات المحلية للمستخدمين
  let users = JSON.parse(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USERS_DB) || '{}');

  // حفظ بيانات المستخدم
  users[phone] = {
    name: name,
    phone: phone,
    pin: pin,
    role: role, // 'client' أو 'technician'
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USERS_DB, JSON.stringify(users));

  // تسجيل الدخول التلقائي وحفظ الجلسة
  const sessionData = {
    name: name,
    phone: phone,
    role: role,
    token: 'SESSION_' + Date.now()
  };
  localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionData));

  // التوجيه الفوري للواجهة المناسبة
  window.location.replace(AUTH_CONFIG.REDIRECT_URLS[role]);
  return true;
}

// 3. دالة تسجيل الدخول لحساب قائم
function loginUser(phone, pin) {
  phone = phone.trim();
  pin = pin.trim();

  let users = JSON.parse(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USERS_DB) || '{}');
  const user = users[phone];

  if (!user || user.pin !== pin) {
    alert('رقم الجوال أو الرقم السري غير صحيح');
    return false;
  }

  // تثبيت جلسة الدخول
  const sessionData = {
    name: user.name,
    phone: user.phone,
    role: user.role,
    token: 'SESSION_' + Date.now()
  };
  localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionData));

  // توجيه تلقائي
  window.location.replace(AUTH_CONFIG.REDIRECT_URLS[user.role]);
  return true;
}

// 4. دالة تسجيل الخروج (توضع في صفحة العميل وصفحة الفني للرجوع للزوار)
function logoutUser() {
  localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.CURRENT_USER);
  window.location.replace('index.html'); // العودة لصفحة الزوار الرئيسية
}
