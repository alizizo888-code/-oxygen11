// حفظ بطاقة جديدة للعميل
function saveNewCard() {
  const last4 = prompt('أدخل آخر 4 أرقام من البطاقة:');
  const holder = prompt('اسم حامل البطاقة:');
  if (last4 && holder) {
    MotqanClientAdminBridge.addPaymentMethod(activeUser.phone, {
      type: 'mada',
      last4: last4,
      holderName: holder,
      expiryDate: '12/28'
    });
    alert('تم حفظ البطاقة كوسيلة دفع معتمدة بنجاح ✓');
  }
}

// طلب إيداع بنكي وشحن المحفظة
function requestBankDeposit() {
  const amount = prompt('أدخل المبلغ المحول إلى حساب المؤسسة (ر.س):');
  const bank = prompt('اسم البنك المحول منه (الراجحي / الأهلي / الإنماء):');
  if (amount && bank) {
    MotqanClientAdminBridge.submitDepositRequest({
      phone: activeUser.phone,
      clientName: activeUser.name,
      amount: parseFloat(amount),
      bankName: bank
    });
    alert('تم إرسال طلب الشحن بنجاح! سيتم مراجعته واعتماده فوراً من قبل المشرف.');
  }
}
