/* ==========================================================================
   PriSMA · Edición N°1 — script.js
   JavaScript moderno, sin dependencias.
   1. Menú responsivo   2. Smooth scroll   3. Scrollspy + barra de progreso
   4. Carrusel "Voces del PSM"            5. Animaciones con IntersectionObserver
   ========================================================================== */

(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1. MENÚ RESPONSIVO
     --------------------------------------------------------------- */
  const nav       = $('#nav');
  const navToggle = $('#navToggle');
  const navMenu   = $('#navMenu');

  const closeMenu = () => {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
  };

  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });

  navMenu.addEventListener('click', (e) => {
    if (e.target.matches('a')) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeMenu();
  });

  /* ---------------------------------------------------------------
     2. SMOOTH SCROLL (con respaldo si el navegador no soporta CSS)
     --------------------------------------------------------------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - (nav.offsetHeight - 4);
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------------------------------------------------------------
     3. SCROLLSPY + BARRA DE PROGRESO + BOTÓN "ARRIBA"
     --------------------------------------------------------------- */
  const progress = $('#navProgress');
  const toTop    = $('#toTop');
  const links    = $$('.nav__menu a');
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  let ticking = false;

  const onScroll = () => {
    const y      = window.pageYOffset;
    const height = document.documentElement.scrollHeight - window.innerHeight;

    progress.style.width = (height > 0 ? (y / height) * 100 : 0) + '%';
    nav.classList.toggle('is-stuck', y > 12);
    toTop.classList.toggle('is-visible', y > window.innerHeight * 0.85);

    /* sección activa */
    let current = sections[0];
    const line = y + nav.offsetHeight + 120;
    sections.forEach((sec) => { if (sec.offsetTop <= line) current = sec; });

    links.forEach((a) => {
      a.classList.toggle('is-active', current && a.getAttribute('href') === '#' + current.id);
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  onScroll();

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------------
     4. CARRUSEL "VOCES DEL PSM"
     --------------------------------------------------------------- */
  const slider = $('#slider');

  if (slider) {
    const track  = $('#sliderTrack');
    const slides = $$('.slide', track);
    const dotsBox = $('#sliderDots');
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');

    let index = 0;
    let timer = null;
    const DELAY = 8000;

    /* --- puntos de navegación --- */
    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Ir a la entrevista ' + (i + 1));
      b.addEventListener('click', () => { goTo(i); restart(); });
      dotsBox.appendChild(b);
      return b;
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';

      dots.forEach((d, n) => {
        d.classList.toggle('is-active', n === index);
        d.setAttribute('aria-selected', String(n === index));
      });
      slides.forEach((s, n) => {
        s.setAttribute('aria-hidden', String(n !== index));
        /* evita que el teclado entre en diapositivas ocultas */
        s.inert = n !== index;
      });
    }

    const next = () => goTo(index + 1);
    const prev = () => goTo(index - 1);

    nextBtn.addEventListener('click', () => { next(); restart(); });
    prevBtn.addEventListener('click', () => { prev(); restart(); });

    /* --- teclado --- */
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { next(); restart(); }
      if (e.key === 'ArrowLeft')  { prev(); restart(); }
    });

    /* --- gestos táctiles --- */
    let startX = 0, startY = 0, dragging = false;

    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
      stop();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0 ? next() : prev();
      }
      restart();
    });

    /* --- reproducción automática --- */
    function play()    { if (!reduceMotion) timer = setInterval(next, DELAY); }
    function stop()    { clearInterval(timer); }
    function restart() { stop(); play(); }

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : restart();
    });

    goTo(0);
    play();
  }

  /* ---------------------------------------------------------------
     5. ANIMACIONES AL HACER SCROLL (IntersectionObserver)
     --------------------------------------------------------------- */
  const revealables = $$('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);   // se anima una sola vez
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach((el) => observer.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------------
     6. AÑO ACTUAL / DETALLES MENORES
     --------------------------------------------------------------- */
  console.info('PriSMA · Edición N°1 — Politécnico Santiago Mariño, Extensión Barinas');
})();
