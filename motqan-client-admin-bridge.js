// اعتماد إيداع العميل وشحن محفظته
function approveClientDeposit(reqId) {
  try {
    const session = JSON.parse(localStorage.getItem('motqan_active_session') || '{}');
    const result = MotqanClientAdminBridge.approveDeposit(reqId, session.name || 'المشرف');
    alert(`تم اعتماد الإيداع بنجاح بقيمة ${result.amount} ر.س وإضافته لرصيد العميل.`);
  } catch (err) {
    alert(err.message);
  }
}

// قفل حساب العميل أو منعه من طلب خدمة بالدفع الآجل
function restrictClientAccount(clientPhone) {
  MotqanClientAdminBridge.updateAccountControl(clientPhone, {
    status: 'restricted_cash_only',
    canOrder: true,
    notes: 'الدفع نقداً أو مسبق فقط نظراً لتأخر سداد سابق'
  });
  alert('تم تقييد الحساب بنجاح وتحديد طرق الدفع المسموحة للعميل.');
}
