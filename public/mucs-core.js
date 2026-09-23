/**
 * MUCS Core Engine - محرك بناء الواجهات الموجهة بالإعدادات
 */
const MUCS_Core = (function() {
  
  // هذه الإعدادات سيتم جلبها لاحقاً من قاعدة البيانات (لوحة المالك)
  const registryConfig = {
    meta: {
      appName: "مُتقن",
      appSubtitle: "البوابة المركزية",
      primaryColor: "#006948",
      bgColor: "#0b1320"
    },
    features: {
      enableAuth: true,            // إمكانية إيقاف نظام الدخول بالكامل
      authMode: "otp",             // ['otp', 'password', 'visitor_only']
      showPromoBanner: true,       // زر مخفي لإظهار/إخفاء البانر
      allowTechRegistration: true  // السماح بتسجيل الفنيين
    },
    hooks: {
      // سكريبتات خارجية يمكن للمالك حقنها وقت التشغيل
      externalScripts: [
        // "https://example.com/analytics.js"
      ]
    },
    services: [
      { id: "ac", title: "صيانة وتكييف", icon: "mode_fan", color: "emerald" },
      { id: "plumbing", title: "سباكة وتسريبات", icon: "faucet", color: "blue" },
      { id: "electrical", title: "كهرباء وإنارة", icon: "electric_bolt", color: "amber" },
      { id: "contracting", title: "مقاولات وعزل", icon: "format_paint", color: "purple" }
    ],
    promo: {
      title: "صيانة منزلك بأيدي فنيين معتمدين",
      subtitle: "كاش باك 30% على كل طلب صيانة",
      badge: "عروض التوفير"
    }
  };

  function applyTheme() {
    document.title = `${registryConfig.meta.appName} | ${registryConfig.meta.appSubtitle}`;
    document.documentElement.style.setProperty('--mucs-primary', registryConfig.meta.primaryColor);
    document.documentElement.style.setProperty('--mucs-bg', registryConfig.meta.bgColor);
  }

  function injectExternalHooks() {
    registryConfig.hooks.externalScripts.forEach(scriptUrl => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      document.head.appendChild(script);
    });
  }

  function renderHeader() {
    const header = document.getElementById('mucs-header-container');
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[var(--mucs-primary)] flex items-center justify-center font-black">
          <span class="material-symbols-outlined text-lg">home_repair_service</span>
        </div>
        <div>
          <span class="text-sm font-black text-slate-900 block leading-tight">${registryConfig.meta.appName}</span>
          <span class="text-[10px] font-bold text-slate-500 block leading-tight">${registryConfig.meta.appSubtitle}</span>
        </div>
      </div>
      ${registryConfig.features.enableAuth ? `
        <button onclick="MUCS_Core.switchView('auth')" class="h-9 px-4 rounded-xl bg-[var(--mucs-primary)] text-white text-xs font-black flex items-center gap-1.5 press-scale shadow-md">
          <span class="material-symbols-outlined text-sm">login</span>
          <span>دخول</span>
        </button>
      ` : ''}
    `;
  }

  function renderVisitorView() {
    const hero = document.getElementById('mucs-hero-container');
    if (registryConfig.features.showPromoBanner) {
      hero.innerHTML = `
        <div class="rounded-3xl bg-gradient-to-l from-[var(--mucs-primary)] to-[#065f46] text-white p-5 shadow-lg relative overflow-hidden">
          <div class="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <span class="inline-block bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-2 relative z-10">${registryConfig.promo.badge}</span>
          <h2 class="text-lg font-black leading-tight relative z-10">${registryConfig.promo.title}</h2>
          <p class="text-xs text-emerald-100 mt-1 relative z-10">${registryConfig.promo.subtitle}</p>
          ${registryConfig.features.enableAuth ? `
            <button onclick="MUCS_Core.switchView('auth')" class="mt-4 w-full py-2.5 rounded-xl bg-white text-[var(--mucs-primary)] font-black text-xs press-scale shadow-sm relative z-10">
              تسجيل لطلب الخدمة
            </button>
          ` : ''}
        </div>
      `;
    } else {
      hero.innerHTML = '';
    }

    const servicesGrid = document.getElementById('mucs-services-container');
    servicesGrid.innerHTML = registryConfig.services.map(srv => `
      <div onclick="MUCS_Core.switchView('auth')" class="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm text-center press-scale cursor-pointer hover:border-${srv.color}-400 transition-colors">
        <span class="material-symbols-outlined text-4xl text-${srv.color}-600 mb-2">${srv.icon}</span>
        <h3 class="font-black text-xs text-slate-900">${srv.title}</h3>
      </div>
    `).join('');
  }

  function renderAuthView() {
    const authContainer = document.getElementById('mucs-auth-container');
    
    if (registryConfig.features.authMode === 'otp') {
      authContainer.innerHTML = `
        <div class="mb-5">
          <label class="block text-[11px] font-bold text-slate-500 mb-2 text-center">أنا أستخدم التطبيق كـ :</label>
          <div class="flex gap-3">
            <div id="role-client" onclick="MUCS_Core.selectRole('client')" class="flex-1 border-2 border-[var(--mucs-primary)] bg-emerald-50 text-[var(--mucs-primary)] rounded-xl padding-3 text-center cursor-pointer py-3 transition-all">
              <span class="material-symbols-outlined block text-2xl mb-1">person</span>
              <span class="text-[10px] font-black">عميل</span>
            </div>
            ${registryConfig.features.allowTechRegistration ? `
              <div id="role-tech" onclick="MUCS_Core.selectRole('tech')" class="flex-1 border-2 border-slate-200 bg-slate-50 text-slate-500 rounded-xl padding-3 text-center cursor-pointer py-3 transition-all">
                <span class="material-symbols-outlined block text-2xl mb-1">engineering</span>
                <span class="text-[10px] font-black">فني</span>
              </div>
            ` : ''}
          </div>
          <input type="hidden" id="selected-role" value="client">
        </div>

        <div id="step-phone" class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-700">رقم الجوال:</label>
            <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-12 focus-within:border-[var(--mucs-primary)]" dir="ltr">
              <span class="text-xs font-black text-slate-500 border-r border-slate-300 pr-2 mr-2">🇸🇦 +966</span>
              <input id="phoneNumber" type="tel" placeholder="5XXXXXXXX" class="w-full bg-transparent text-sm font-black outline-none text-left tracking-widest text-slate-800"/>
            </div>
          </div>
          <button onclick="MUCS_Auth.sendOTP()" id="btn-send-otp" class="w-full py-3.5 bg-[var(--mucs-primary)] text-white rounded-xl font-black text-xs shadow-md press-scale">
            إرسال كود التحقق (OTP)
          </button>
          <div class="flex justify-center mt-2"><div id="recaptcha-container"></div></div>
        </div>

        <div id="step-verify" class="hidden space-y-4 text-center">
          <p class="text-[11px] font-bold text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">تم إرسال كود لجوّالك</p>
          <input id="otpCode" type="tel" maxlength="6" placeholder="••••••" class="w-full bg-slate-50 border border-slate-300 rounded-2xl py-3.5 text-center text-2xl font-mono font-black tracking-[0.5em] outline-none focus:border-[var(--mucs-primary)] text-[var(--mucs-primary)]"/>
          <button onclick="MUCS_Auth.verifyOTP()" id="btn-verify-otp" class="w-full py-3.5 bg-[var(--mucs-primary)] text-white rounded-xl font-black text-xs shadow-md press-scale">
            تأكيد الدخول
          </button>
          <button onclick="MUCS_Core.resetAuth()" class="text-[10px] text-slate-500 font-bold underline mt-2">تعديل رقم الجوال</button>
        </div>
      `;
    } else {
      authContainer.innerHTML = `<p class="text-center text-sm font-bold text-slate-500 py-4">نظام الدخول متوقف حالياً للتحديثات.</p>`;
    }
  }

  return {
    initialize: function() {
      applyTheme();
      injectExternalHooks();
      renderHeader();
      renderVisitorView();
      renderAuthView();
    },
    switchView: function(viewId) {
      document.getElementById('view-visitor').classList.add('hidden');
      document.getElementById('view-auth').classList.add('hidden');
      document.getElementById(`view-${viewId}`).classList.remove('hidden');
      if(viewId === 'auth' && typeof MUCS_Auth !== 'undefined') MUCS_Auth.initCaptcha();
    },
    selectRole: function(role) {
      document.getElementById('role-client').className = "flex-1 border-2 border-slate-200 bg-slate-50 text-slate-500 rounded-xl padding-3 text-center cursor-pointer py-3 transition-all";
      if(document.getElementById('role-tech')) document.getElementById('role-tech').className = "flex-1 border-2 border-slate-200 bg-slate-50 text-slate-500 rounded-xl padding-3 text-center cursor-pointer py-3 transition-all";
      
      const selectedEl = document.getElementById(`role-${role}`);
      if(selectedEl) selectedEl.className = "flex-1 border-2 border-[var(--mucs-primary)] bg-emerald-50 text-[var(--mucs-primary)] rounded-xl padding-3 text-center cursor-pointer py-3 transition-all";
      document.getElementById('selected-role').value = role;
    },
    showToast: function(msg, isError = false) {
      const toast = document.getElementById('mucs-toast');
      toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[380px] p-3 rounded-2xl text-xs font-black text-center shadow-2xl z-50 fade-in ${isError ? 'bg-red-600 text-white' : 'bg-[var(--mucs-primary)] text-white'}`;
      toast.innerText = msg;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 4000);
    },
    resetAuth: function() {
      document.getElementById('step-verify').classList.add('hidden');
      document.getElementById('step-phone').classList.remove('hidden');
      if(typeof MUCS_Auth !== 'undefined') MUCS_Auth.initCaptcha();
    }
  };
})();
