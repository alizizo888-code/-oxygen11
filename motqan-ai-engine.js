/**
 * motqan-ai-engine.js
 * محرك الذكاء الاصطناعي الصوتي والكتابي
 */
const MotqanAI = (function () {
  const recognition = ('webkitSpeechRecognition' in window) 
    ? new webkitSpeechRecognition() 
    : null;

  if (recognition) {
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
  }

  return {
    listenVoicePrompt: function (onResult, onError) {
      if (!recognition) {
        if (onError) onError('المتصفح لا يدعم التسجيل الصوتي المباشر');
        return;
      }
      recognition.onresult = event => {
        const text = event.results[0][0].transcript;
        onResult(text);
      };
      recognition.onerror = err => {
        if (onError) onError(err.error);
      };
      recognition.start();
    },
    speakResponse: function (arabicText) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(arabicText);
        utter.lang = 'ar-SA';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
    },
    processQuery: function (userQuery) {
      const services = MotqanDB.getServices();
      let reply = "أهلاً بك في مُتقن! بخصوص طلبك، خدماتنا معتمدة بضمان 30 يوماً.";
      if (userQuery.includes('مكيف') || userQuery.includes('تكييف')) {
        reply = `سعر غسيل وصيانة التكييف المعتمد يبدأ من ${services.ac.basePrice} ر.س للجهاز، مع ضمان ذهبي 30 يوماً.`;
      } else if (userQuery.includes('تسريب') || userQuery.includes('سباك')) {
        reply = `كشف تسريبات المياه الإلكتروني بالنيتروجين بدون تكسير قيمته ${services.plumbing.basePrice} ر.س مع تقرير رسمي معتمد.`;
      }
      return reply;
    }
  };
})();
