/**
 * MUCS Context-Aware AI Core (محرك الذكاء الاصطناعي الموجه)
 * يضبط الإجابات والأسعار والنسب بدقة تامة بحسب هوية المستخدم (مالك، مشرف، فني، عميل)
 */
const MUCS_AI = (function() {
  
  // قاعدة المعرفة وقواعد الأسعار والنسب التي يتحكم فيها المالك والمشرف
  const getDefaultKnowledgeBase = () => {
    return JSON.parse(localStorage.getItem('mucs_ai_knowledge_base') || JSON.stringify({
      pricing: {
        splitClean: "150 ريال شامل ضريبة القيمة المضافة 15%",
        centralCheck: "300 ريال كشف فحص مبدئي",
        vatRate: "15%"
      },
      clientPolicies: {
        discounts: "كاش باك 30% على أول طلب صيانة عبر البوابة الرقمية",
        paymentMethods: "الدفع إلكترونياً (مدى، تابي، أبل باي، أو تحويل بانكي معتمد)"
      },
      techPolicies: {
        commissionRate: "نسبة المؤسسة 15% من إجمالي قيمة الفاتورة الميدانية",
        taxNote: "يجب إصدار فاتورة إلكترونية معتمدة مرفقة بالرقم الضريبي"
      },
      customPromptForClient: "تحدث بلطف واحترافية عالية، اعرض دائماً عروض التوفير، واطلب إتمام حجز الصيانة برقم الجوال.",
      customPromptForTech: "تحدث بمهنية هندسية فنية صارمة، وضح تفاصيل العمولات والخصومات بدقة."
    }));
  };

  return {
    ask: async function(query, userRole, userName) {
      const kb = getDefaultKnowledgeBase();
      const q = query.toLowerCase();

      // 1. إذا كان السائل (عميل - Client)
      if (userRole === 'client') {
        if (q.includes('سعر') || q.includes('تكلفة') || q.includes('بكم')) {
          return `أهلاً بك يا ${userName || 'عميلنا العزيز'}. أسعارنا واضحة ومعتمدة: غسيل مكيف سبليت بـ ${kb.pricing.splitClean}. كما أن لديك ميزة حصرية: ${kb.clientPolicies.discounts}.`;
        }
        if (q.includes('دفع') || q.includes('طرق الدفع')) {
          return `يمكنك الدفع بكل سهولة عبر: ${kb.clientPolicies.paymentMethods}. هل تحب أن أنشئ لك طلب صيانة الآن؟`;
        }
        if (q.includes('اطلب') || q.includes('صيانة')) {
          return this.createOrderViaAI(query, 'client');
        }
        return `مرحباً بك في مؤسسة أكسجين للصيانة والمقاولات. بصفتي مساعدك الذكي، يمكنني مساعدتك في حجز المواعيد ومعرفة الأسعار. كيف أخدمك اليوم؟`;
      }

      // 2. إذا كان السائل (فني - Technician)
      if (userRole === 'tech') {
        if (q.includes('نسبة') || q.includes('عمولة') || q.includes('خصم')) {
          return `إليك سياسة العمل المالية للفنيين: ${kb.techPolicies.commissionRate}. ملاحظة هامة: ${kb.techPolicies.taxNote}.`;
        }
        return `أهلاً بك يا فني الميدان. أنا هنا لتوجيهك في المهام، إرشادك للنسب المالية، ومراجعة حالة الطلبات الميدانية. ما استفسارك الفني؟`;
      }

      // 3. إذا كان السائل (مالك أو مشرف - Owner / Supervisor)
      if (userRole === 'owner' || userRole === 'supervisor') {
        if (q.includes('تحديث') || q.includes('اضبط') || q.includes('غير')) {
          return ` بصفتي تحت إمرتك، يمكنك تعديل وتوجيه إجابات الـ AI للعملاء والفنيين مباشرة من "لوحة ضبط وتحكم الـ AI" الموجودة في لوحتك السيادية.`;
        }
        return `أهلاً بك يا ${userName || 'صاحب السيادة'}. النظام يعمل بكفاءة والربط بين الجهات نشط. يمكنك توجيهي بأي أمر إداري أو استعلام عن الأرباح والطلبات.`;
      }

      return "مرحباً بك في منظومة مُتقن الذكية.";
    },

    createOrderViaAI: function(query, role) {
      const orderId = 'AI-ORD-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        orderId,
        service: 'صيانة وتكييف (مطلوبة عبر الـ AI)',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      const orders = JSON.parse(localStorage.getItem('motqan_global_orders_registry') || '[]');
      orders.unshift(newOrder);
      localStorage.setItem('motqan_global_orders_registry', JSON.stringify(orders));
      return `✨ تم إنشاء طلب صيانة جديد بنجاح برقم مرجعي [${orderId}] وتم توجيهه إلى غرفة العمليات والمشرفين!`;
    },

    updateKnowledgeBase: function(newConfig) {
      localStorage.setItem('mucs_ai_knowledge_base', JSON.stringify(newConfig));
    },

    getKnowledgeBase: function() {
      return getDefaultKnowledgeBase();
    }
  };
})();
