/**
 * motqan-points-wallet.js
 * محرك الحسابات المالية، محفظة الرصيد، ونقاط الولاء المشترك
 */
const MotqanFinance = (function () {
  const STORAGE_USERS = 'motqan_registered_users';
  const STORAGE_RULES = 'motqan_finance_rules';
  const STORAGE_LOGS = 'motqan_transactions_log';

  // الإعدادات والقواعد الافتراضية للاحتساب (يمكن للمالك تعديلها)
  const defaultRules = {
    welcomeBonusPoints: 50,      // نقاط الترحيب عند التسجيل
    spendPerPoint: 10,           // كل 10 ر.س = 1 نقطة
    pointsToCashRate: 0.5,       // كل نقطة = 0.5 ر.س (10 نقاط = 5 ر.س)
    minPointsToRedeem: 20,       // الحد الأدنى لاستبدال النقاط
    techCommissionRate: 0.80     // 80% للفني من قيمة العمل و 20% للمنصة
  };

  function getRules() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RULES)) || defaultRules;
    } catch (e) {
      return defaultRules;
    }
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USERS)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  function logTransaction(phone, type, amount, note) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];
    logs.unshift({
      id: 'TX-' + Math.floor(100000 + Math.random() * 900000),
      phone,
      type, // 'credit_added', 'points_earned', 'points_redeemed', 'order_paid'
      amount,
      note,
      date: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
  }

  return {
    // 1. استرجاع بيانات الرصيد والنقاط لحساب معين
    getAccountBalance: function (phone) {
      const users = getUsers();
      const user = users[phone.trim()] || {};
      return {
        wallet: parseFloat(user.wallet || 0.0),
        points: parseInt(user.points || 0, 10),
        cashValueOfPoints: parseInt(user.points || 0, 10) * getRules().pointsToCashRate
      };
    },

    // 2. احتساب نقاط جديدة بعد إتمام طلب صيانة
    awardPointsForOrder: function (clientPhone, orderAmount) {
      const rules = getRules();
      const users = getUsers();
      const user = users[clientPhone.trim()];
      if (!user) return 0;

      // حساب النقاط: القيمة مقسومة على معدل الاحتساب
      const earnedPoints = Math.floor(parseFloat(orderAmount) / rules.spendPerPoint);

      if (earnedPoints > 0) {
        user.points = (user.points || 0) + earnedPoints;
        saveUsers(users);
        logTransaction(clientPhone, 'points_earned', earnedPoints, `اكتساب نقاط عن طلب بقيمة ${orderAmount} ر.س`);
      }
      return earnedPoints;
    },

    // 3. تحويل النقاط إلى رصيد نقدي في المحفظة
    redeemPointsToWallet: function (clientPhone, pointsToRedeem) {
      const rules = getRules();
      const users = getUsers();
      const user = users[clientPhone.trim()];

      if (!user) throw new Error('المستخدم غير موجود');

      const currentPoints = user.points || 0;
      pointsToRedeem = parseInt(pointsToRedeem, 10);

      if (pointsToRedeem < rules.minPointsToRedeem) {
        throw new Error(`الحد الأدنى للتحويل هو ${rules.minPointsToRedeem} نقطة`);
      }
      if (pointsToRedeem > currentPoints) {
        throw new Error('رصيد النقاط غير كافٍ');
      }

      // المعادلة: عدد النقاط × سعر النقطة نقداً
      const cashAmount = pointsToRedeem * rules.pointsToCashRate;

      user.points -= pointsToRedeem;
      user.wallet = (user.wallet || 0.0) + cashAmount;

      saveUsers(users);
      logTransaction(clientPhone, 'points_redeemed', cashAmount, `استبدال ${pointsToRedeem} نقطة بـ ${cashAmount} ر.س في المحفظة`);

      return { remainingPoints: user.points, newWallet: user.wallet, cashAdded: cashAmount };
    },

    // 4. السداد والخصم من المحفظة
    payWithWallet: function (clientPhone, orderAmount) {
      const users = getUsers();
      const user = users[clientPhone.trim()];
      if (!user) throw new Error('المستخدم غير موجود');

      const amount = parseFloat(orderAmount);
      const currentWallet = user.wallet || 0.0;

      if (currentWallet < amount) {
        throw new Error(`رصيدك المتاح (${currentWallet.toFixed(2)} ر.س) لا يكفي لسداد ${amount.toFixed(2)} ر.س`);
      }

      user.wallet -= amount;
      saveUsers(users);
      logTransaction(clientPhone, 'order_paid', amount, `سداد فاتورة خدمة صيانة`);

      return user.wallet;
    },

    // 5. شحن يدوي أو إلكتروني للمحفظة
    addWalletBalance: function (phone, amount, adminNote = 'شحن محفظة') {
      const users = getUsers();
      const user = users[phone.trim()];
      if (!user) throw new Error('المستخدم غير موجود');

      const added = parseFloat(amount);
      user.wallet = (user.wallet || 0.0) + added;
      saveUsers(users);
      logTransaction(phone, 'credit_added', added, adminNote);

      return user.wallet;
    },

    // 6. صلاحية المالك: تحديث نسب ومعادلات النظام
    updateRulesByOwner: function (newRules) {
      const current = getRules();
      const updated = Object.assign({}, current, newRules);
      localStorage.setItem(STORAGE_RULES, JSON.stringify(updated));
      return updated;
    },

    // 7. استعراض تقرير وسجل العمليات لحساب معين
    getAccountHistory: function (phone) {
      const logs = JSON.parse(localStorage.getItem(STORAGE_LOGS)) || [];
      return logs.filter(l => l.phone === phone.trim());
    }
  };
})();
