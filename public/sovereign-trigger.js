/**
 * Mutqan Platform - Global Sovereign Trigger Injection
 * Sovereign ID: 789512364
 */
(function() {
    // 1. إنشاء عنصر النقطة الشفافة برمجياً وحقنه في أعلى الصفحة فوراً
    const triggerPoint = document.createElement('div');
    triggerPoint.id = 'sovereign-trigger-point';
    triggerPoint.style.cssText = 'position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 20px; background: transparent; z-index: 999999; cursor: pointer;';
    
    // 2. ربط حدث الضغط بطلب الرقم السري السيادي
    triggerPoint.onclick = function() {
        const masterPin = prompt("أدخل الرقم السري السيادي للمالك:");
        if (masterPin === "789512364") {
            alert("تم التحقق من الهوية السيادية بنجاح. جاري توجيهك إلى لوحة الإعدادات الشاملة...");
            window.location.href = "/admin.html";
        } else if (masterPin !== null) {
            alert("الرمز السري غير صحيح! تم رفض الصلاحية.");
        }
    };

    // 3. الحقن التلقائي في جسم الصفحة عند اكتمال التحميل
    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(triggerPoint);
    });
})();
