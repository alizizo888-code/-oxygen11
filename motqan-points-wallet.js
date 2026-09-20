// تعديل المالك لقيمة كل نقطة (مثلاً جعل كل نقطة = 1 ر.س كامل بدلاً من نصف ريال)
function setPointsValue(rate) {
  MotqanFinance.updateRulesByOwner({ pointsToCashRate: parseFloat(rate) });
  alert('تم تحديث سعر استبدال النقاط بنجاح في المنظومة كاملة.');
}
