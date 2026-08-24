/* CLASS 04 — resilient Studio shell. Opens/closes even if the main app boot fails. */
(() => {
  'use strict';
  const studio = document.getElementById('studio');
  const backdrop = document.getElementById('studio-backdrop');
  if (!studio || !backdrop) return;

  function openStudioShell() {
    studio.setAttribute('aria-hidden', 'false');
    studio.classList.add('is-open');
    backdrop.classList.add('is-open');
    document.body.classList.add('studio-open');
    window.setTimeout(() => document.getElementById('studio-close')?.focus(), 150);
  }

  function closeStudioShell() {
    studio.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    studio.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('studio-open');
  }

  document.querySelectorAll('.studio-open').forEach((button) => {
    button.addEventListener('click', openStudioShell);
  });
  document.getElementById('studio-close')?.addEventListener('click', closeStudioShell);
  backdrop.addEventListener('click', closeStudioShell);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && studio.getAttribute('aria-hidden') === 'false') closeStudioShell();
  });

  window.RestaurantStudioShell = { open: openStudioShell, close: closeStudioShell };
})();
