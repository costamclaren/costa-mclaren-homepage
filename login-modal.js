(function () {
  var backdrop = document.getElementById('loginModal');
  var closeBtn = document.getElementById('loginModalClose');
  var navBtn   = document.querySelector('.nav-login');

  function openLoginModal() {
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLoginModal() {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navBtn)   navBtn.addEventListener('click', openLoginModal);
  if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);

  if (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeLoginModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) {
      closeLoginModal();
    }
  });
})();
