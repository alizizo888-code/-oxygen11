/**
 * motqan-database.js
 * قاعدة البيانات المركزية المشتركة بين كافة الفروع
 */
const MotqanDB = (function () {
  const KEYS = {
    SERVICES: 'motqan_services_catalog',
    OFFERS: 'motqan_promotions',
    SETTINGS: 'motqan_global_controls',
    USERS: 'motqan_registered_users'
  };

  const defaultServices = {
    ac: { name: 'التكييف والتبريد', basePrice: 115.0, guarantee: '30 يوماً' },
    plumbing: { name: 'السباكة وكشف التسريب', basePrice: 180.0, guarantee: 'معتمد' },
    electrical: { name: 'الكهرباء والإنارة', basePrice: 120.0, guarantee: '30 يوماً' },
    contracting: { name: 'المقاولات والعزل', basePrice: 32.0, guarantee: '10 سنوات' }
  };

  const defaultOffers = [
    { id: 'OXYGEN30', discount: 30, title: 'كوبون أكسجين المعتمد', active: true },
    { id: 'SUMMER50', discount: 50, title: 'خصم باقة الصيف للمكيفات', active: true }
  ];

  return {
    getServices: function () {
      return JSON.parse(localStorage.getItem(KEYS.SERVICES)) || defaultServices;
    },
    updateServicePrice: function (domainKey, newPrice) {
      const s = this.getServices();
      if (s[domainKey]) {
        s[domainKey].basePrice = parseFloat(newPrice);
        localStorage.setItem(KEYS.SERVICES, JSON.stringify(s));
      }
    },
    getOffers: function () {
      return JSON.parse(localStorage.getItem(KEYS.OFFERS)) || defaultOffers;
    },
    addOffer: function (offer) {
      const offers = this.getOffers();
      offers.push(offer);
      localStorage.setItem(KEYS.OFFERS, JSON.stringify(offers));
    },
    // صلاحية المالك لإيقاف استقبال الطلبات كلياً أو حظر عميل
    getGlobalControls: function () {
      return JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || { systemLocked: false, bannedUsers: [] };
    },
    setSystemLock: function (isLocked) {
      const cfg = this.getGlobalControls();
      cfg.systemLocked = isLocked;
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cfg));
    },
    toggleBanClient: function (phone) {
      const cfg = this.getGlobalControls();
      if (cfg.bannedUsers.includes(phone)) {
        cfg.bannedUsers = cfg.bannedUsers.filter(p => p !== phone);
      } else {
        cfg.bannedUsers.push(phone);
      }
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cfg));
    }
  };
})();
