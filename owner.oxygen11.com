// إيقاف النظام كلياً عن استقبال أي طلبات
function toggleEmergencyLock() {
  const current = MotqanDB.getGlobalControls().systemLocked;
  MotqanDB.setSystemLock(!current);
  alert(!current ? 'تم إغلاق استقبال الطلبات بالمنصة كلياً' : 'تم استئناف العمل بالمنصة');
}

// حظر عميل أو إلغاء حظره
function toggleClientBan(clientPhone) {
  MotqanDB.toggleBanClient(clientPhone);
  alert('تم تحديث حالة العميل بنجاح');
}

// إلغاء أي طلب مهما كانت حالته
function forceCancelOrder(orderId) {
  MotqanOrders.ownerForceCancel(orderId);
  alert('تم إلغاء الطلب من قبل المالك');
}
