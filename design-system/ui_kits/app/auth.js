// Wirtschaftln — auth & profile state (localStorage-backed).
// Prototype only: no real backend. Demo login always succeeds.
(function () {
  const AUTH_KEY = 'wn_auth_v1';      // 'in' when logged in
  const PROFILE_KEY = 'wn_profile_v1'; // the registered/own member profile

  const Auth = {
    isLoggedIn() { try { return localStorage.getItem(AUTH_KEY) === 'in'; } catch (e) { return false; } },
    login() { try { localStorage.setItem(AUTH_KEY, 'in'); } catch (e) {} },
    logout() { try { localStorage.removeItem(AUTH_KEY); } catch (e) {} },

    getProfile() {
      try { const r = localStorage.getItem(PROFILE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
    },
    saveProfile(p) {
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {}
    },
    clearProfile() { try { localStorage.removeItem(PROFILE_KEY); } catch (e) {} },
  };
  window.WNAuth = Auth;
})();
