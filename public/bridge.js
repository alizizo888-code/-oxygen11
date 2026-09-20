/**
 * motqan-client-admin-bridge.js
 * المحرك الوسيط بين المشرف والعميل لإدارة طرق الدفع، الرصيد، وصلاحيات الحساب
 */
const MotqanClientAdminBridge = (function () {
  const KEYS = {
    PAYMENT_METHODS: 'motqan_client_payment_methods',
    DEPOSIT_REQUESTS: 'motqan_deposit_requests',
    ACCOUNT_CONTROLS: 'motqan_account_controls',
    USERS: 'motqan_registered_users'
  };

  function getFromStore(key, defaultVal) {
    try {
      return JSON.parse(localStorage.getItem(key)) || defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function saveToStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  return {
    // ==========================================
    // 1. صلاحيات ومهام العميل (Client Features)
    // ==========================================

    // جلب طرق الدفع المحفوظة الخاصة بالعميل (مدى، فيزا، Apple Pay)
    getClientPaymentMethods: function (phone) {
      const allMethods = getFromStore(KEYS.PAYMENT_METHODS, {});
      return allMethods[phone] || [];
    },

    // حفظ وسيلة دفع جديدة للعميل
    addPaymentMethod: function (phone, { type, last4, holderName, expiryDate }) {
      const allMethods = getFromStore(KEYS.PAYMENT_METHODS, {});
      if (!allMethods[phone]) allMethods[phone] = [];

      const newMethod = {
        id: 'PM-' + Date.now(),
        type, // 'mada', 'visa', 'mastercard', 'applepay'
        last4,
        holderName,
        expiryDate,
        isDefault: allMethods[phone].length === 0,
        createdAt: new Date().toISOString()
      };

      allMethods[phone].push(newMethod);
      saveToStore(KEYS.PAYMENT_METHODS, allMethods);
      return newMethod;
    },

    // حذف وسيلة دفع من حساب العميل
    removePaymentMethod: function (phone, methodId) {
      const allMethods = getFromStore(KEYS.PAYMENT_METHODS, {});
      if (!allMethods[phone]) return false;
      allMethods[phone] = allMethods[phone].filter(m => m.id !== methodId);
      saveToStore(KEYS.PAYMENT_METHODS, allMethods);
      return true;
    },

    // رفع طلب شحن رصيد / إيداع بنكي للمشرف
    submitDepositRequest: function ({ phone, clientName, amount, receiptImage, bankName }) {
      const requests = getFromStore(KEYS.DEPOSIT_REQUESTS, []);
      const newReq = {
        reqId: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
        phone,
        clientName,
        amount: parseFloat(amount),
        receiptImage: receiptImage || null,
        bankName,
        status: 'pending', // 'pending', 'approved', 'rejected'
        reviewedBy: null,
        rejectionReason: null,
        createdAt: new Date().toISOString()
      };

      requests.unshift(newReq);
      saveToStore(KEYS.DEPOSIT_REQUESTS, requests);
      return newReq;
    },

    // فحص حالة قيود الحساب
    getClientAccountStatus: function (phone) {
      const controls = getFromStore(KEYS.ACCOUNT_CONTROLS, {});
      return controls[phone] || {
        status: 'active', // 'active', 'suspended', 'restricted_cash_only'
        creditLimit: 0,
        canOrder: true,
        notes: ''
      };
    },

    // ==========================================
    // 2. صلاحيات ومهام المشرف (Supervisor Features)
    // ==========================================

    // استعراض طلبات الإيداع والشحن المعلقة
    getPendingDepositRequests: function () {
      const requests = getFromStore(KEYS.DEPOSIT_REQUESTS, []);
      return requests.filter(r => r.status === 'pending');
    },

    // اعتماد طلب الشحن وإضافة الرصيد لمحفظة العميل فوراً
    approveDeposit: function (reqId, supervisorName) {
      const requests = getFromStore(KEYS.DEPOSIT_REQUESTS, []);
      const req = requests.find(r => r.reqId === reqId);

      if (!req || req.status !== 'pending') {
        throw new Error('الطلب غير موجود أو تمت مراجعته مسبقاً');
      }

      req.status = 'approved';
      req.reviewedBy = supervisorName;
      req.resolvedAt = new Date().toISOString();
      saveToStore(KEYS.DEPOSIT_REQUESTS, requests);

      // تغذية المحفظة في قاعدة البيانات الرئيسية
      const users = getFromStore(KEYS.USERS, {});
      if (users[req.phone]) {
        users[req.phone].wallet = (users[req.phone].wallet || 0.0) + req.amount;
        saveToStore(KEYS.USERS, users);
      }
      return req;
    },

    // رفض طلب الشحن مع ذكر السبب
    rejectDeposit: function (reqId, supervisorName, reason) {
      const requests = getFromStore(KEYS.DEPOSIT_REQUESTS, []);
      const req = requests.find(r => r.reqId === reqId);

      if (!req) throw new Error('الطلب غير موجود');

      req.status = 'rejected';
      req.reviewedBy = supervisorName;
      req.rejectionReason = reason || 'بيانات الحوالة غير متطابقة';
      req.resolvedAt = new Date().toISOString();
      saveToStore(KEYS.DEPOSIT_REQUESTS, requests);
      return req;
    },

    // تعديل صلاحيات وقيود حساب العميل
    updateAccountControl: function (phone, { status, creditLimit, canOrder, notes }) {
      const controls = getFromStore(KEYS.ACCOUNT_CONTROLS, {});
      controls[phone] = {
        status: status || 'active',
        creditLimit: parseFloat(creditLimit) || 0,
        canOrder: canOrder !== undefined ? canOrder : true,
        notes: notes || '',
        updatedAt: new Date().toISOString()
      };
      saveToStore(KEYS.ACCOUNT_CONTROLS, controls);
      return controls[phone];
    },

    // جلب كشف حساب تفصيلي للعميل بجميع العمليات
    getClientFullLedger: function (phone) {
      const logs = getFromStore('motqan_transactions_log', []);
      const deposits = getFromStore(KEYS.DEPOSIT_REQUESTS, []);
      
      return {
        transactions: logs.filter(l => l.phone === phone),
        depositHistory: deposits.filter(d => d.phone === phone)
      };
    }
  };
})();
