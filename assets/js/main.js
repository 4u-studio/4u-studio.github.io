/* ============================================================
   合同会社4U — Company Site (v2) — interactions
   ============================================================ */
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  const toggle = document.getElementById('menuToggle');
  if (toggle) {
    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('#mobileMenu a').forEach((a) =>
      a.addEventListener('click', closeMenu)
    );
    // close on tap of empty area inside the menu
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) closeMenu();
      });
    }
    // close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
    });
  }

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- flow steps: staggered reveal ---------- */
  const steps = document.querySelectorAll('.flow .step');
  if (steps.length) {
    const stepIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = [...steps].indexOf(e.target);
            const delay = reduceMotion ? 0 : i * 140;
            setTimeout(() => e.target.classList.add('in'), delay);
            stepIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    steps.forEach((s) => stepIo.observe(s));
  }

  /* ---------- nav active state ---------- */
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (sections.length) {
    const navIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute('id');
            navLinks.forEach((a) =>
              a.classList.toggle('active', a.getAttribute('href') === '#' + id)
            );
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => navIo.observe(s));
  }

  /* ---------- founder story toggle (mobile collapse) ---------- */
  const storyToggle = document.getElementById('storyToggle');
  const storyMore = document.getElementById('storyMore');
  const mqMobile = window.matchMedia('(max-width: 760px)');
  if (storyToggle && storyMore) {
    const syncStory = () => {
      if (mqMobile.matches) {
        if (storyToggle.getAttribute('aria-expanded') !== 'true') {
          storyMore.setAttribute('hidden', '');
        }
      } else {
        storyMore.removeAttribute('hidden');
        storyMore.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      }
    };
    syncStory();
    mqMobile.addEventListener('change', syncStory);

    storyToggle.addEventListener('click', () => {
      const willOpen = storyMore.hasAttribute('hidden');
      if (willOpen) {
        storyMore.removeAttribute('hidden');
        storyToggle.setAttribute('aria-expanded', 'true');
        storyToggle.firstChild.textContent = '代表ストーリーを閉じる';
        storyMore.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      } else {
        storyMore.setAttribute('hidden', '');
        storyToggle.setAttribute('aria-expanded', 'false');
        storyToggle.firstChild.textContent = '代表ストーリーをもっと読む';
      }
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      if (isOpen) {
        item.classList.remove('open');
        q.setAttribute('aria-expanded', 'false');
        a.style.maxHeight = '0px';
      } else {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
  window.addEventListener(
    'resize',
    () => {
      document.querySelectorAll('.faq-item.open .faq-a').forEach((a) => {
        a.style.maxHeight = a.scrollHeight + 'px';
      });
    },
    { passive: true }
  );

  /* ---------- scroll-top & sticky CTA ---------- */
  const toTop = document.getElementById('toTop');
  const stickyCta = document.getElementById('stickyCta');
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
  const toggleScrollUi = () => {
    const y = window.scrollY;
    const isMobile = window.innerWidth <= 760;
    const ctaShowing = isMobile && y > 560;
    if (stickyCta) stickyCta.classList.toggle('show', ctaShowing);
    if (toTop) toTop.classList.toggle('show', y > 600 && !ctaShowing);
  };
  toggleScrollUi();
  window.addEventListener('scroll', toggleScrollUi, { passive: true });
  window.addEventListener('resize', toggleScrollUi, { passive: true });

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
