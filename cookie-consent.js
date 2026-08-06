(function () {
  'use strict';

  const CONFIG = {
    version: '1.0',
    cookieName: 'cc_consent',
    expiryDaysAccept: 365,
    expiryDaysReject: 180
  };

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getStored() {
    try {
      var raw = localStorage.getItem(CONFIG.cookieName);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.version !== CONFIG.version) return null;
      if (new Date(data.expires) < new Date()) return null;
      return data;
    } catch (e) { return null; }
  }

  function store(categories) {
    var allRejected = !categories.functional && !categories.statistics && !categories.marketing;
    var expires = new Date();
    expires.setDate(expires.getDate() + (allRejected ? CONFIG.expiryDaysReject : CONFIG.expiryDaysAccept));
    var data = {
      version: CONFIG.version,
      timestamp: new Date().toISOString(),
      consentId: uuid(),
      categories: categories,
      expires: expires.toISOString()
    };
    localStorage.setItem(CONFIG.cookieName, JSON.stringify(data));
    return data;
  }

  var banner  = document.getElementById('cc-banner');
  var overlay = document.getElementById('cc-modal-overlay');
  var revoke  = document.getElementById('cc-revoke');

  function showBanner() {
    banner.hidden = false;
    requestAnimationFrame(function () { banner.classList.add('cc-visible'); });
    revoke.hidden = true;
  }

  function hideBanner() {
    banner.classList.remove('cc-visible');
    setTimeout(function () { banner.hidden = true; }, 350);
    revoke.hidden = false;
  }

  function openModal() {
    var stored = getStored();
    if (stored) {
      document.querySelectorAll('[data-cc-category]').forEach(function (cb) {
        var cat = cb.getAttribute('data-cc-category');
        if (cat !== 'necessary') cb.checked = !!stored.categories[cat];
      });
    }
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('cc-visible'); });
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('cc-visible');
    setTimeout(function () { overlay.hidden = true; }, 250);
    document.body.style.overflow = '';
  }

  function applyConsent(data) {
    var cats = data.categories;
    // Funktional (z.B. Google Maps): cats.functional
    // Statistik (z.B. Matomo):       cats.statistics
    // Marketing (z.B. Pixel):         cats.marketing
    window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: cats }));
  }

  function acceptAll() {
    var data = store({ necessary: true, functional: true, statistics: true, marketing: true });
    hideBanner(); closeModal(); applyConsent(data);
  }

  function rejectAll() {
    var data = store({ necessary: true, functional: false, statistics: false, marketing: false });
    hideBanner(); closeModal(); applyConsent(data);
  }

  function saveSelection() {
    var categories = { necessary: true };
    document.querySelectorAll('[data-cc-category]').forEach(function (cb) {
      var cat = cb.getAttribute('data-cc-category');
      if (cat !== 'necessary') categories[cat] = cb.checked;
    });
    var data = store(categories);
    hideBanner(); closeModal(); applyConsent(data);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cc-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-cc-action');
    if (action === 'accept')   acceptAll();
    if (action === 'reject')   rejectAll();
    if (action === 'settings') openModal();
    if (action === 'save')     saveSelection();
  });

  revoke.addEventListener('click', openModal);

  // Escape schließt Modal nur wenn bereits Einwilligung vorhanden
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden && getStored()) closeModal();
  });

  // Init
  var existing = getStored();
  if (existing) {
    applyConsent(existing);
    revoke.hidden = false;
  } else {
    showBanner();
  }

  // Public API
  window.CookieConsent = {
    reset:      function () { localStorage.removeItem(CONFIG.cookieName); location.reload(); },
    openModal:  openModal,
    getConsent: getStored
  };
})();
