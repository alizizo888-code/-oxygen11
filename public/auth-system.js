/**
 * auth-system.js - Subdomain Only Routing
 */
const MotqanAuthSystem = (function () {
  const SUBDOMAINS = {
    MAIN: 'https://client.oxygen11.com',
    client: 'https://client.oxygen11.com',
    tech: 'https://technician.oxygen11.com',
    supervisor: 'https://admin.oxygen11.com',
    owner: 'https://owner.oxygen11.com'
  };

  function transferToSubdomain(role, userObj) {
    const targetUrl = SUBDOMAINS[role] || SUBDOMAINS.client;
    // تشفير وتمرير التوكن مباشرة للفرع
    const token = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(userObj)))));
    window.location.replace(`${targetUrl}/?auth_token=${token}`);
  }

  return {
    login: function (phone, pass, role = 'client') {
      const user = { phone, pass, role, name: 'المستخدم', wallet: 150.0 };
      transferToSubdomain(role, user);
    },
    register: function (name, phone, pass, role = 'client') {
      const user = { name, phone, pass, role, wallet: 0.0, points: 50 };
      transferToSubdomain(role, user);
    },
    logout: function () {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace(SUBDOMAINS.MAIN);
    }
  };
})();
