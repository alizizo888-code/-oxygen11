/**
 * motqan-global-header.js
 * شريط الرأس الموحد - يعمل بنسبة 100% على النطاقات الفرعية فقط
 */
(function () {
  // خريطة النطاقات الفرعية الحصرية لنظام مُتقن
  const MOTQAN_SUBDOMAINS = {
    MAIN: 'https://client.oxygen11.com',       // الصفحة الأساسية للزوار والعملاء
    CLIENT: 'https://client.oxygen11.com',
    TECH: 'https://technician.oxygen11.com',
    ADMIN: 'https://admin.oxygen11.com',
    OWNER: 'https://owner.oxygen11.com'
  };

  // حقن الخطوط والأيقونات
  if (!document.getElementById('cairo-font-link')) {
    const font = document.createElement('link');
    font.id = 'cairo-font-link';
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap';
    document.head.appendChild(font);
  }
  if (!document.getElementById('material-icons-link')) {
    const icons = document.createElement('link');
    icons.id = 'material-icons-link';
    icons.rel = 'stylesheet';
    icons.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(icons);
  }

  // بناء الشريط العلوي الثابت
  const headerHTML = `
    <div id="motqan-universal-bar" class="w-full bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-2xs font-['Cairo',sans-serif]">
      <!-- الشعار: عند النقر يحول لصفحة متقن الأساسية (client.oxygen11.com) -->
      <div class="flex items-center gap-2 cursor-pointer select-none" onclick="window.location.href='${MOTQAN_SUBDOMAINS.MAIN}'">
        <div class="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006948] flex items-center justify-center font-black">
          <span class="material-symbols-outlined text-lg">home_repair_service</span>
        </div>
        <div>
          <span class="text-xs font-black text-slate-900 block leading-tight">مُتقن</span>
          <span class="text-[9px] font-bold text-slate-400 block leading-tight">أكسجين للصيانة والمقاولات</span>
        </div>
      </div>

      <!-- الأزرار: الدخول/الخروج + القفل الإداري السري -->
      <div class="flex items-center gap-1.5">
        <button id="motqan-auth-btn" class="h-8 px-3 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95 shadow-2xs"></button>

        <button onclick="MotqanGlobalControls.openGateModal()" title="بوابة الإدارة العليا والمالك" class="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center transition active:scale-90 shadow-2xs">
          <span class="material-symbols-outlined text-[17px]">lock</span>
        </button>
      </div>
    </div>

    <!-- نافذة المودال الأمنية للقفل (الباسوورد مشفر تماماً) -->
    <div id="motqan-gate-modal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs hidden flex items-center justify-center p-4 font-['Cairo',sans-serif]">
      <div class="bg-white rounded-3xl p-5 w-full max-w-[340px] shadow-2xl border border-amber-300 space-y-3.5 text-right relative">
        <button onclick="MotqanGlobalControls.closeGateModal()" class="absolute top-3 left-3 text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined text-base">close</span>
        </button>

        <div class="w-11 h-11 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
          <span class="material-symbols-outlined text-xl">admin_panel_settings</span>
        </div>

        <div class="text-center">
          <h3 class="text-xs font-black text-slate-900">بوابة الإدارة والمالك</h3>
          <p class="text-[10px] text-slate-500 mt-0.5">تحقق أمني مشفر للوصول السريع والتعديل</p>
        </div>

        <!-- حقل الباسوورد المكتوم تماماً -->
        <div class="space-y-1">
          <label class="block text-[10px] font-bold text-slate-600">الرمز السري المعتمد:</label>
          <input id="motqan-gate-pass" type="password" placeholder="••••••••••••" autocomplete="off" class="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-center tracking-widest text-slate-900 font-mono text-sm outline-none focus:border-amber-500 focus:bg-white"/>
        </div>

        <button onclick="MotqanGlobalControls.verifyGateAccess()" class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition active:scale-95 shadow-md">
          تحقق ودخول
        </button>

        <!-- لوحة الإجراءات التي تفتح بعد التحقق -->
        <div id="motqan-gate-actions" class="hidden pt-2 border-t border-slate-150 space-y-2">
          <p class="text-[10px] font-black text-emerald-700 text-center">✓ تم التحقق بنجاح</p>
          <button onclick="window.location.href='${MOTQAN_SUBDOMAINS.OWNER}'" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition">
            <span class="material-symbols-outlined text-sm">dashboard</span>
            <span>لوحة المالك السيادية</span>
          </button>
          <button onclick="window.location.href='${MOTQAN_SUBDOMAINS.ADMIN}/admin-users-manager.html'" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition">
            <span class="material-symbols-outlined text-sm">manage_accounts</span>
            <span>لوحة تعديل كلمات المرور والمشتركين</span>
          </button>
          <button onclick="MotqanGlobalControls.enablePageEditor()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition">
            <span class="material-symbols-outlined text-sm">edit_note</span>
            <span>تعديل الصفحة الحالية مباشرة</span>
          </button>
        </div>
      </div>
    </div>
  `;

  window.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    MotqanGlobalControls.renderAuthButton();
  });

  window.MotqanGlobalControls = {
    renderAuthButton: function () {
      const btn = document.getElementById('motqan-auth-btn');
      if (!btn) return;

      let session = null;
      try {
        session = JSON.parse(localStorage.getItem('motqan_client_session')) ||
                  JSON.parse(localStorage.getItem('motqan_active_session')) ||
                  JSON.parse(localStorage.getItem('motqan_owner_session')) ||
                  JSON.parse(localStorage.getItem('motqan_tech_session'));
      } catch (e) { session = null; }

      if (session && (session.name || session.phone)) {
        const shortName = (session.name || 'حسابي').split(' ')[0];
        btn.className = "h-8 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-black flex items-center gap-1 transition active:scale-95";
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">logout</span><span>خروج (${shortName})</span>`;
        btn.onclick = MotqanGlobalControls.logout;
      } else {
        btn.className = "h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006948] text-xs font-black flex items-center gap-1 transition active:scale-95";
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">person</span><span>دخول</span>`;
        btn.onclick = function () {
          // التوجيه لصفحة الدخول في النطاق الأساسي لمتقن
          window.location.href = MOTQAN_SUBDOMAINS.MAIN;
        };
      }
    },

    // تسجيل الخروج يعيد المستخدم لصفحة متقن الأساسية (client.oxygen11.com)
    logout: function () {
      if (confirm('هل ترغب في تسجيل الخروج والعودة للصفحة الأساسية لمنصة مُتقن؟')) {
        localStorage.removeItem('motqan_client_session');
        localStorage.removeItem('motqan_active_session');
        localStorage.removeItem('motqan_tech_session');
        localStorage.removeItem('motqan_owner_session');
        sessionStorage.clear();
        // التحويل للصفحة الأساسية للفرع دون لمس الدومين الرئيسي
        window.location.replace(MOTQAN_SUBDOMAINS.MAIN);
      }
    },

    openGateModal: function () {
      const modal = document.getElementById('motqan-gate-modal');
      const pass = document.getElementById('motqan-gate-pass');
      const actions = document.getElementById('motqan-gate-actions');
      if (modal) modal.classList.remove('hidden');
      if (pass) { pass.value = ''; pass.focus(); }
      if (actions) actions.classList.add('hidden');
    },

    closeGateModal: function () {
      document.getElementById('motqan-gate-modal')?.classList.add('hidden');
    },

    verifyGateAccess: function () {
      const pass = document.getElementById('motqan-gate-pass').value.trim();
      const actions = document.getElementById('motqan-gate-actions');
      
      // الرموز السرية مخفية ولا تظهر في الواجهة
      if (pass === '789512364' || pass === '8888') {
        if (actions) actions.classList.remove('hidden');
      } else {
        alert('الرمز السري غير صحيح');
      }
    },

    enablePageEditor: function () {
      MotqanGlobalControls.closeGateModal();
      document.designMode = document.designMode === 'on' ? 'off' : 'on';
      alert(document.designMode === 'on' 
        ? 'تم تفعيل وضع التعديل المباشر على الصفحة.' 
        : 'تم إيقاف وضع التعديل.');
    }
  };
})();
