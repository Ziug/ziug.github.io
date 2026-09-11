document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('navToggle');
  const nav = document.querySelector('.main-nav');
  if (!btn || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    btn.textContent = open ? '✕' : '☰';
  };

  btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 800) setOpen(false);
  });
});
