/**
 * Mutqan Platform - Sovereign Trigger & Lock System
 * Sovereign ID: 789512364
 */
(function() {
    const trigger = document.createElement('div');
    trigger.id = 'sovereign-lock-trigger';
    trigger.title = 'منطقة التحكم السيادي للمالك';
    trigger.style.cssText = 'position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 70px; height: 18px; background: rgba(0, 180, 216, 0.15); border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; z-index: 999999; cursor: pointer; border: 1px dashed #00b4d8;';
    
    trigger.onclick = function() {
        const pin = prompt("🔐 أدخل الرقم السري السيادي للمالك والمشرفين:");
        if (pin === "789512364") {
            alert("✅ تم التحقق بنجاح. جاري فتح لوحة التحكم السيادية...");
            window.location.href = '/admin.html';
        } else if (pin !== null) {
            alert("❌ رمز خاطئ! تم رفض الوصول.");
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(trigger);
    });
})();
