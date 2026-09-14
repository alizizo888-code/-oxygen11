document.addEventListener('DOMContentLoaded', function() {
    const testBtn = document.getElementById('testBtn');
    const result = document.getElementById('result');
    let clickCount = 0;
    
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            clickCount++;
            result.textContent = `✅ تم الضغط ${clickCount} مرات! الموقع يعمل بشكل ممتاز!`;
            console.log('تم الضغط على الزر');
        });
    }
    
    // اختبار الاتصال بالخادم
    console.log('✅ الصفحة تحمّلت بنجاح');
    console.log('🚀 Oxygen11 جاهز للعمل');
});