/**
 * MUCS Internal AI Core & Command Executor (النظام الذكي الداخلي الموحد)
 * يربط بين المالك، المشرف، العميل، والفني، وينفذ الأوامر والطلبات أوتوماتيكياً
 */
const MUCS_AI = (function() {
  
  // التحقق من حالة تفعيل الـ AI من لوحة المالك/المشرف
  function isAIEnabled() {
    const globalState = localStorage.getItem('mucs_ai_system_enabled');
    return globalState !== 'false'; // مفعل افتراضياً
  }

  // معالجة الأوامر والأسئلة وتنفيذ الإجراءات (AI Command Processor)
  async function processCommand(userQuery, userRole, userName) {
    if (!isAIEnabled()) {
      return "عذراً، نظام الذكاء الاصطناعي الداخلي معطل حالياً بأمر من المالك أو الإدارة.";
    }

    const query = userQuery.trim().toLowerCase();

    // 1. أمر إصدار طلب صيانة أوتوماتيكي (مثال: "اطلب لي صيانة مكيف")
    if (query.includes('اطلب') || query.includes('طلب صيانة') || query.includes('حجز')) {
      return handleAIBasedOrderCreation(userQuery, userRole);
    }

    // 2. أمر استعلام عن حالة الطلبات أو الفنيين (يخدم المشرف والمالك والعميل)
    if (query.includes('الطلبات') || query.includes('حالة') || query.includes('الرصيد') || query.includes('تقرير')) {
      return handleAIQuery(query, userRole);
    }

    // 3. تحليل الذكاء الاصطناعي العام والرد التقني (تخصصات التبريد والمقاولات والتحكم)
    return generateSmartResponse(userQuery, userRole, userName);
  }

  // تنفيذ طلب صيانة عبر الـ AI وربطه بسجل العميل والمشرف
  function handleAIBasedOrderCreation(query, role) {
    const orderId = 'AI-ORD-' + Math.floor(1000 + Math.random() * 9000);
    const serviceType = query.includes('مكيف') ? 'صيانة وتكييف' : (query.includes('سباكة') ? 'سباكة وتسريبات' : 'صيانة عامة للمنشأة');
    
    const newOrder = {
      orderId: orderId,
      clientName: role === 'client' ? 'عميل عبر نظام الذكاء الاصطناعي' : 'طلب موجه إدارياً',
      serviceRequested: serviceType,
      timestamp: new Date().toISOString(),
      status: 'pending_dispatch',
      source: 'Internal AI Engine'
    };

    // حفظ الطلب في السجل المشترك للعملاء والمشرفين
    const orders = JSON.parse(localStorage.getItem('motqan_global_orders_registry') || '[]');
    orders.unshift(newOrder);
    localStorage.setItem('motqan_global_orders_registry', JSON.stringify(orders));

    return `✨ تم تنفيذ أمرك بنجاح! تم إنشاء طلب صيانة جديد برقم [${orderId}] لخدمة (${serviceType}) وتم توجيهه مباشرة إلى غرفة عمليات المشرفين والفنيين.`;
  }

  function handleAIQuery(query, role) {
    const orders = JSON.parse(localStorage.getItem('motqan_global_orders_registry') || '[]');
    if (query.includes('الطلبات')) {
      return `📊 إجمالي الطلبات النشطة والمسجلة في النظام حالياً هو: ${orders.length} طلب. آخر طلب مسجل برقم: ${orders[0]?.orderId || 'لا توجد طلبات'}.`;
    }
    return `🤖 النظام يعمل بكفاءة تامة. أنت مسجل بصلاحية: [${role}]. هل ترغب في إصدار أمر جديد أو الاستعلام عن شيء محدد؟`;
  }

  function generateSmartResponse(query, role, name) {
    return `مرحباً بك يا ${name || 'استاذي'} (${role}). بصفتي محرك الـ AI الداخلي لمؤسسة أكسجين، أنا مرتبط ببيانات الموقع والسيستم بالكامل. لقد تلقيت استفسارك وسأساعدك في تنفيذه فوراً. هل تحتاج لتوجيه فني ميداني أو تعديل إعدادات النظام؟`;
  }

  return {
    ask: async function(query, role, name) {
      return await processCommand(query, role, name);
    },
    setStatus: function(isEnabled) {
      localStorage.setItem('mucs_ai_system_enabled', isEnabled);
    },
    getStatus: function() {
      return isAIEnabled();
    }
  };
})();
