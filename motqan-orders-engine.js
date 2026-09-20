/**
 * motqan-orders-engine.js
 * محرك استقبال وتوزيع الطلبات والتحكم بالصلاحيات
 */
const MotqanOrders = (function () {
  const ORDERS_KEY = 'motqan_orders_master_store';

  return {
    getAllOrders: function () {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    },
    createOrder: function ({ clientName, clientPhone, domain, address, coordinates, notes }) {
      const controls = MotqanDB.getGlobalControls();
      if (controls.systemLocked) throw new Error('استقبال الطلبات متوقف مؤقتاً بأمر الإدارة');
      if (controls.bannedUsers.includes(clientPhone)) throw new Error('الحساب محظور من إنشاء طلبات جديدة');

      const orders = this.getAllOrders();
      const services = MotqanDB.getServices();
      const price = services[domain] ? services[domain].basePrice : 100.0;

      const newOrder = {
        orderId: 'OXY-' + Math.floor(10000 + Math.random() * 90000),
        clientName,
        clientPhone,
        domain,
        price,
        address,
        coordinates,
        notes,
        status: 'pending', // pending, assigned, in_route, completed, cancelled
        assignedTech: null,
        assignedBy: null,
        createdAt: new Date().toISOString()
      };

      orders.unshift(newOrder);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      return newOrder;
    },
    // صلاحية المشرف: تعيين فني للطلب
    assignTechnician: function (orderId, techName, supervisorName) {
      const orders = this.getAllOrders();
      const ord = orders.find(o => o.orderId === orderId);
      if (ord) {
        ord.status = 'assigned';
        ord.assignedTech = techName;
        ord.assignedBy = supervisorName;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }
    },
    // صلاحية الفني: تحديث حالة التنفيذ
    updateStatusByTech: function (orderId, status) {
      const orders = this.getAllOrders();
      const ord = orders.find(o => o.orderId === orderId);
      if (ord) {
        ord.status = status; // in_route أو completed
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }
    },
    // صلاحية المالك المطلقة: إلغاء أو حذف أي طلب فوراً
    ownerForceCancel: function (orderId) {
      const orders = this.getAllOrders();
      const ord = orders.find(o => o.orderId === orderId);
      if (ord) {
        ord.status = 'cancelled';
        ord.cancelledBy = 'Owner (علي)';
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }
    }
  };
})();
