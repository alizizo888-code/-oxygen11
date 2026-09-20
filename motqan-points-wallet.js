// استبدال النقاط برصيد كاش
function convertMyPoints() {
  const points = prompt('أدخل عدد النقاط المراد استبدالها (كل 10 نقاط = 5 ر.س):', '50');
  if (points) {
    try {
      const result = MotqanFinance.redeemPointsToWallet(activeUser.phone, points);
      alert(`مبروك! تم تحويل النقاط بنجاح.\nتمت إضافة: ${result.cashAdded} ر.س إلى محفظتك.\nرصيدك الجديد: ${result.newWallet.toFixed(2)} ر.س`);
      // تحديث واجهة المستخدم
      document.getElementById('client-wallet-display').textContent = result.newWallet.toFixed(2) + ' ر.س';
      document.getElementById('client-points-badge').textContent = result.remainingPoints;
    } catch (err) {
      alert(err.message);
    }
  }
}
// يُستدعى فور اعتماد اكتمال الخدمة
function onServiceCompleted(clientPhone, totalInvoice) {
  const earned = MotqanFinance.awardPointsForOrder(clientPhone, totalInvoice);
  alert(`تم إغلاق الطلب، وحصل العميل على ${earned} نقطة ولاء جديدة 🎁`);
}
