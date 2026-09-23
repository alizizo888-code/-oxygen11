/**
 * MUCS Advanced Technician Engine (God-Mode & Field Automation)
 * محرك الفني الميداني المتقدم - الأتمتة، الرادار، والتوجيه الإداري
 */
const MUCS_TechEngine = (function() {
  
  let techSession = {};
  let heartbeatInterval = null;

  return {
    init: function() {
      this.loadSession();
      this.startHeartbeatSync();
      this.listenToAdminDirectives();
    },

    loadSession: function() {
      try {
        techSession = JSON.parse(localStorage.getItem('motqan_tech_session') || '{}');
      } catch(e) { console.error("Session load error", e); }
    },

    // 1. نبضات الحياة والتتبع الميداني (Heartbeat & Stealth GPS Sync)
    // يرسل موقع الفني وحالته للمشرف والمالك كل 15 ثانية لتحديث الخريطة الحية
    startHeartbeatSync: function() {
      heartbeatInterval = setInterval(() => {
        if (!techSession.phone) return;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const telemetryPayload = {
              techPhone: techSession.phone,
              techName: techSession.name || 'فني ميداني',
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              battery: 'Optimal', // يمكن ربطه ببطارية الجهاز لاحقاً
              lastActive: new Date().toISOString(),
              status: localStorage.getItem('mucs_tech_status') || 'available'
            };

            // رفع البيانات للسجل المركزي ليراها المشرف فوراً
            localStorage.setItem(`mucs_telemetry_${techSession.phone}`, JSON.stringify telemetryPayload);
          }, (err) => {
            console.warn("Telemetry GPS warning:", err.code);
          }, { enableHighAccuracy: true });
        }
      }, 15000);
    },

    // 2. استقبال التعليمات والتوجيهات المباشرة من الإدارة (Admin Command Relay)
    // يتيح للمالك أو المشرف إرسال أوامر فورية لشاشة الفني
    listenToAdminDirectives: function() {
      setInterval(() => {
        const directive = localStorage.getItem(`mucs_directive_to_${techSession.phone}`);
        if (directive) {
          const commandObj = JSON.parse(directive);
          
          // تنفيذ الأمر الموجه من الإدارة فوراً
          this.executeAdminCommand(commandObj);
          
          // مسح الأمر بعد تنفيذه لكي لا يتكرر
          localStorage.removeItem(`mucs_directive_to_${techSession.phone}`);
        }
      }, 5000);
    },

    executeAdminCommand: function(cmd) {
      switch(cmd.action) {
        case 'FORCE_ALERT':
          alert(`🚨 تنبيه عاجل من الإدارة:\n${cmd.message}`);
          break;
        case 'CANCEL_ORDER':
          alert(`⚠️ تم إلغاء الطلب [${cmd.orderId}] من قبل الإدارة المركزية.`);
          window.location.reload();
          break;
        case 'UPDATE_CONFIG':
          console.log("تحديث إعدادات الفني عن بُعد بواسطة المالك.");
          break;
        default:
          console.log("أمر إداري غير معروف:", cmd);
      }
    },

    // 3. تحديث حالة الميدان (في الطريق، تم الوصول، تم الإنجاز مع توثيق قانوني)
    updateOrderStatus: function(orderId, newStatus, notes = '') {
      const fieldActionLog = {
        orderId: orderId,
        techPhone: techSession.phone,
        status: newStatus, // 'enroute', 'arrived', 'completed'
        notes: notes,
        timestamp: new Date().toISOString()
      };

      // حفظ السجل للتدقيق القانوني ولإبلاغ العميل والمشرف
      const logs = JSON.parse(localStorage.getItem('mucs_field_audit_logs') || '[]');
      logs.unshift(fieldActionLog);
      localStorage.setItem('mucs_field_audit_logs', JSON.stringify(logs));

      alert(`تم تحديث حالة الطلب إلى [${newStatus}] بنجاح وتوثيقها في السجل المركزي.`);
    }
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  MUCS_TechEngine.init();
});
