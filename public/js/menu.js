/**
 * menu.js
 * Controla el toggle del menú horizontal (topbar) en vistas móviles/tablet.
 */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnToggleMenu');
    const nav = document.getElementById('cfTopbarNav');

    btn?.addEventListener('click', () => {
        nav?.classList.toggle('cf-topbar-nav-open');
    });
});
