/**
 * motqan-wallet-geo.js
 * محرك المعاملات المالية وتحديد المواقع التلقائي
 */
const MotqanWalletGeo = (function () {
  return {
    // التقاط الموقع الجغرافي تلقائياً
    fetchLiveLocation: function () {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject('خاصية تحديد الموقع غير مدعومة');
        }
        navigator.geolocation.getCurrentPosition(
          pos => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              mapLink: `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
            };
            resolve(coords);
          },
          err => reject('تعذر الحصول على الموقع: ' + err.message),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    },
    // عمليات المحفظة
    getUserWallet: function (phone) {
      const users = JSON.parse(localStorage.getItem('motqan_registered_users')) || {};
      return users[phone] ? (users[phone].wallet || 0.00) : 0.00;
    },
    transact: function (phone, amount, type = 'deduct') {
      const users = JSON.parse(localStorage.getItem('motqan_registered_users')) || {};
      if (!users[phone]) return false;
      users[phone].wallet = users[phone].wallet || 0.00;
      if (type === 'deduct') {
        if (users[phone].wallet < amount) throw new Error('الرصيد في المحفظة لا يكفي');
        users[phone].wallet -= amount;
      } else {
        users[phone].wallet += amount;
      }
      localStorage.setItem('motqan_registered_users', JSON.stringify(users));
      return users[phone].wallet;
    }
  };
})();
