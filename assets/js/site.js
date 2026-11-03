/* =========================================================
   Anar Events — site.js (v1, 3 Nov 2026)
   Requires (loaded before this file, all pinned):
     GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.18 (unpkg)
   Every motion is a numbered block below. If GSAP is missing or
   prefers-reduced-motion is on, nothing is hidden and nothing scrubs.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     TREE LAYERS: the only place that knows the image files
     (painted, transparent WebPs in assets/tree/painted/).
     Keys match data-layer="" attributes in the HTML.
     --------------------------------------------------------- */
  var ART = 'assets/tree/painted/';
  /* each layer: the file stem and the rendered width (sizes) so the browser picks the 1400px or the 2752px file */
  var TREE_LAYERS = {
    leftBranch:   { file: 'left-branch',  sizes: '(min-width:1400px) 520px, 26vw' },
    rightBranch:  { file: 'right-branch', sizes: '(min-width:1400px) 520px, 26vw' },
    cloud1:       { file: 'cloud-1',      sizes: '120vw' },
    cloud2:       { file: 'cloud-2',      sizes: '140vw' }
  };
  /* The leaf band (bottom-canopy.webp) and ground band (ground-bottom.webp) are static
     in-flow images in the HTML, so they never sit behind text. */

  /* Parallax speed per layer (fraction of the page's scroll distance).
     Positive = moves up as you scroll down. */
  var SPEED = { leftBranch: 0.06, rightBranch: 0.08 };
  var BRANCH_MAX = function () { return Math.round(window.innerHeight * 0.4); };   /* px: branches drift up at most ~40vh */

  var html = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData === true);
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var motion = hasGsap && !reduced;
  var isDesktop = function () { return window.matchMedia('(min-width: 768px)').matches; };
  var wideScreen = function () { return window.matchMedia('(min-width: 901px)').matches; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  html.classList.add(motion ? 'motion' : 'reduced');
  if (motion) { gsap.registerPlugin(ScrollTrigger); }

  /* 0. Tree layer sources from the map (every page): src + srcset (1400w, 2752w) + sizes */
  $$('[data-layer]').forEach(function (el) {
    var layer = TREE_LAYERS[el.getAttribute('data-layer')];
    if (!layer) { return; }
    el.setAttribute('sizes', layer.sizes);
    el.setAttribute('srcset', ART + layer.file + '-1400.webp 1400w, ' + ART + layer.file + '.webp 2752w');
    el.src = ART + layer.file + '.webp';
  });

  /* ---------------------------------------------------------
     0b. Hero video (index): no src in the HTML. The loop mp4
         (1080 from 901px, else 720; a <source media> attribute
         is ignored inside <video>) is appended after window
         'load', never under prefers-reduced-motion or Save-Data
         unless the visitor presses Play. Plays only while the
         tab is visible and the hero is on screen; pauses off
         screen and on document.hidden. The "Pause video / Play
         video" control sits in the header bar; aria-pressed
         "true" means paused. The poster shows in every other case.
     --------------------------------------------------------- */
  var heroVideo = $('.hero__video');
  var heroToggle = $('.hero-toggle');
  var videoLoaded = false, videoFailed = false;
  var userPaused = reduced || saveData;   /* starts on the poster when the visitor asked for less motion or data */
  var heroVisible = function () {
    if (!heroVideo || document.hidden) { return false; }
    var r = heroVideo.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  };
  var playVideo = function () {
    if (!heroVideo || videoFailed || userPaused || !heroVisible()) { return; }
    var p = heroVideo.play();
    if (p && p.catch) { p.catch(function () {}); }
  };
  var setToggle = function () {
    if (!heroToggle) { return; }
    heroToggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    heroToggle.setAttribute('aria-label', userPaused ? 'Play video' : 'Pause video');
  };
  function loadHeroVideo() {
    if (!heroVideo || videoLoaded || videoFailed || userPaused) { return; }
    var src = heroVideo.getAttribute(wideScreen() ? 'data-src-desktop' : 'data-src-mobile');
    if (!src) { return; }
    videoLoaded = true;
    var source = document.createElement('source');
    source.type = 'video/mp4';
    source.src = src;
    var fallback = function () {   /* a missing file or a decode error: back to the poster, silently */
      if (videoFailed) { return; }
      videoFailed = true;
      try { heroVideo.pause(); if (source.parentNode) { heroVideo.removeChild(source); } heroVideo.load(); } catch (e) { /* poster is showing */ }
      if (heroToggle) { heroToggle.hidden = true; }
    };
    source.addEventListener('error', fallback);
    heroVideo.addEventListener('error', fallback);
    heroVideo.appendChild(source);
    heroVideo.load();
    playVideo();
  }
  if (heroVideo) {
    if (!userPaused) {
      if (document.readyState === 'complete') { loadHeroVideo(); }
      else { window.addEventListener('load', loadHeroVideo, { once: true }); }
    }
    /* pause when the hero leaves the viewport; resume when it is back (if not paused by the visitor) */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && videoLoaded) { playVideo(); } else { heroVideo.pause(); }
        });
      }, { threshold: 0.05 }).observe(heroVideo);
    }
    document.addEventListener('visibilitychange', function () {
      if (!videoLoaded) { return; }
      if (document.hidden) { heroVideo.pause(); } else { playVideo(); }
    });
    if (heroToggle) {
      setToggle();
      heroToggle.addEventListener('click', function () {
        userPaused = !userPaused;
        setToggle();
        if (userPaused) { heroVideo.pause(); }
        else if (!videoLoaded) { loadHeroVideo(); }
        else { playVideo(); }
      });
    }
  } else if (heroToggle) {
    heroToggle.hidden = true;
  }

  /* ---------------------------------------------------------
     Smooth scroll (Lenis) wired to the GSAP ticker
     --------------------------------------------------------- */
  var lenis = null;
  if (motion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    html.classList.add('lenis');
  }
  function headerOffset() { return -($('.site-header') ? $('.site-header').offsetHeight + 8 : 0); }
  /* focus moves to the destination (keyboard and screen-reader users continue from there) */
  function focusEl(el) {
    if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); }
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
  function scrollToEl(el) {
    if (lenis) { lenis.scrollTo(el, { offset: headerOffset(), duration: 1.4 }); }
    else { el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }   /* scroll-margin-top clears the header */
    focusEl(el);
  }
  /* Same-page anchors (including "index.html#inquire" when on index) */
  $$('a[href*="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var url = new URL(a.href, location.href);
      var samePage = url.pathname.replace(/\/index\.html$/, '/') === location.pathname.replace(/\/index\.html$/, '/');
      if (!samePage || !url.hash) { return; }
      var target = document.getElementById(url.hash.slice(1));
      if (!target) { return; }
      e.preventDefault();
      closeNav();
      scrollToEl(target);
      history.pushState(null, '', url.hash);
    });
  });
  /* Land on a hash with the header offset */
  if (location.hash) {
    var landing = document.getElementById(location.hash.slice(1));
    if (landing) { setTimeout(function () { scrollToEl(landing); }, 60); }
  }

  /* ---------------------------------------------------------
     Header: solid once scrolled; mobile drawer
     (on index with motion on, block 2 drives the solid state
      from the wordmark morph instead of the 40px threshold)
     --------------------------------------------------------- */
  var header = $('.site-header');
  var navToggle = $('.nav-toggle');
  var morphDrivesHeader = false;
  function onScrollState() {
    if (!header || morphDrivesHeader) { return; }
    header.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset) > 40);
  }
  if (lenis) { lenis.on('scroll', onScrollState); } else { window.addEventListener('scroll', onScrollState, { passive: true }); }
  onScrollState();
  function closeNav() {
    if (!header || !navToggle) { return; }
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeNav(); } });
  }

  /* ---------------------------------------------------------
     5. Accordion panels (every mode: reduced motion, no GSAP):
        hover expands (pointer devices), click / Enter / Space
        and focus expand (touch, keyboard); arrow keys, Home and
        End move between triggers. Stacked cards on phones. On
        desktop a closed panel's body is inert and aria-hidden
        (it is faded out), the open one is live.
     --------------------------------------------------------- */
  $$('[data-accordion]').forEach(function (acc) {
    var panels = $$('.accordion__panel', acc);
    var triggers = panels.map(function (p) { return $('.accordion__trigger', p); });
    var hoverable = window.matchMedia('(hover: hover)').matches;
    function syncBodies() {
      panels.forEach(function (p) {
        var bodyEl = $('.accordion__body', p);
        if (!bodyEl) { return; }
        var closed = isDesktop() && !p.classList.contains('is-open');
        bodyEl.inert = closed;
        if (closed) { bodyEl.setAttribute('aria-hidden', 'true'); } else { bodyEl.removeAttribute('aria-hidden'); }
      });
    }
    function open(target) {
      panels.forEach(function (p, i) {
        var on = p === target;
        p.classList.toggle('is-open', on);
        if (triggers[i]) { triggers[i].setAttribute('aria-expanded', on ? 'true' : 'false'); }
      });
      syncBodies();
    }
    panels.forEach(function (p, i) {
      var btn = triggers[i];
      if (hoverable) { p.addEventListener('mouseenter', function () { if (isDesktop()) { open(p); } }); }
      if (!btn) { return; }
      btn.addEventListener('click', function () { open(p); });
      btn.addEventListener('focus', function () { if (isDesktop()) { open(p); } });
      btn.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { next = (i + 1) % triggers.length; }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { next = (i - 1 + triggers.length) % triggers.length; }
        else if (e.key === 'Home') { next = 0; }
        else if (e.key === 'End') { next = triggers.length - 1; }
        if (next === null || !triggers[next]) { return; }
        e.preventDefault();
        triggers[next].focus();
        open(panels[next]);
      });
    });
    syncBodies();
    window.addEventListener('resize', syncBodies);
  });

  /* ---------------------------------------------------------
     6. Inquiry form: posts to the Formspree action with fetch
        (Accept: application/json); pending / sent / failed in the
        role="status" region; 12 s timeout; the entered values
        stay on every failure; the submit button is restored in
        finally. Without fetch the form submits normally.
     --------------------------------------------------------- */
  var form = $('.form[data-ajax]');
  if (form && window.fetch && window.FormData) {
    var status = $('.form__status', form);
    var submitBtn = $('button[type="submit"]', form);
    var contactLinks = function () {   /* DOM nodes, no innerHTML */
      var frag = document.createDocumentFragment();
      var add = function (text, href) {
        if (!href) { frag.appendChild(document.createTextNode(text)); return; }
        var a = document.createElement('a');
        a.href = href; a.textContent = text;
        if (/^https?:/.test(href)) { a.rel = 'noopener'; }
        frag.appendChild(a);
      };
      add(' write to '); add('hello@anarevents.com', 'mailto:hello@anarevents.com');
      add(' or '); add('WhatsApp us', 'https://wa.me/19252639949'); add('.');
      return frag;
    };
    var say = function (kind, text, links) {
      if (!status) { return; }
      status.hidden = false;
      status.className = 'form__status is-' + kind;
      status.textContent = text;
      if (links) { status.appendChild(contactLinks()); }
    };
    var snapshot = function () {
      try { return new URLSearchParams(new FormData(form)).toString(); } catch (err) { return null; }
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (/FORMSPREE_ID/.test(form.action)) {
        say('error', 'Online inquiries are not connected yet. Your entries are still here. Please', true);
        if (status) { status.focus(); }
        return;
      }
      if (submitBtn && submitBtn.disabled) { return; }
      if (submitBtn) { submitBtn.disabled = true; }
      say('wait', 'Sending…');
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timedOut = false, timer;
      var timeout = new Promise(function (_, reject) {
        timer = setTimeout(function () { timedOut = true; if (controller) { controller.abort(); } reject(new Error('timeout')); }, 12000);
      });
      var sent = snapshot();
      var options = { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } };
      if (controller) { options.signal = controller.signal; }
      var request = Promise.race([timeout, Promise.resolve().then(function () { return fetch(form.action, options); })])
        .then(function (r) { if (!r.ok) { throw new Error('bad status'); } })
        .then(function () {
          say('ok', 'Thank you. Your message is on its way; we reply within one business day.');
          if (sent !== null && snapshot() === sent) { form.reset(); }   /* edits made while pending are kept */
          if (status) { status.focus(); }
        })
        .catch(function () {
          say('error', timedOut
            ? 'The connection timed out, so we could not confirm delivery. Nothing you typed was lost: please try again in a moment, or'
            : 'Your message did not send. Nothing you typed was lost: please try again, or', true);
          if (status) { status.focus(); }
        });
      var done = function () { clearTimeout(timer); if (submitBtn) { submitBtn.disabled = false; } };
      if (request.finally) { request.finally(done); } else { request.then(done, done); }
    });
  }

  if (!motion) { return; }   /* ===== everything below is motion only ===== */

  /* ---------------------------------------------------------
     1. Hero: the tagline fades (the wordmark is handled by the
        morph in block 2);
     2b. two cloud layers roll in from the bottom at different speeds;
        then the hero fades to cream.
     --------------------------------------------------------- */
  var hero = $('.hero');
  if (hero) {
    var heroTl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
    heroTl
      .to('.hero__tag', { opacity: 0, ease: 'none', duration: 0.5 }, 0)
      .fromTo('.hero__cloud--1', { yPercent: 35, opacity: 0 }, { yPercent: -55, opacity: 1, ease: 'none', duration: 1 }, 0)
      .fromTo('.hero__cloud--2', { yPercent: 55, opacity: 0 }, { yPercent: -30, opacity: 1, ease: 'none', duration: 1 }, 0)
      .to('.hero__fade', { opacity: 1, ease: 'none', duration: 0.45 }, 0.55);
  }

  /* ---------------------------------------------------------
     2. Wordmark morph: the hero wordmark travels up and shrinks
        into the header's logo slot over the first 70% of the hero
        (one scrubbed transform: translate + scale, measured with
        getBoundingClientRect at build and on every refresh).
        At the end it is swapped for the header logo (same artwork,
        same box); scrolling back up reverses it.
     --------------------------------------------------------- */
  var morph = $('.logo-morph');
  var heroWordImg = $('.hero__word img');
  var headerLogoBox = $('.site-logo');   /* the anchor: always laid out (visibility hidden until docked) */
  if (hero && morph && heroWordImg && headerLogoBox && header) {
    var MORPH_END = 0.7;   /* fraction of the hero height */
    var from = { x: 0, y: 0, w: 1 }, to = { x: 0, y: 0, w: 1 };
    function measure() {
      /* hero wordmark in document coordinates (the hero sits at the top of the page) */
      var sy = window.scrollY || window.pageYOffset;
      var h = heroWordImg.getBoundingClientRect();
      from = { x: h.left, y: h.top + sy, w: h.width };
      /* header logo box in viewport coordinates (the header is fixed) */
      var l = headerLogoBox.getBoundingClientRect();
      to = { x: l.left, y: l.top, w: l.width };
      morph.style.width = from.w + 'px';
      morph.style.height = (from.w * 552 / 1600) + 'px';
    }
    var docked = null;   /* null: not yet applied, so the first call always sets the classes */
    function setDocked(on) {
      if (on === docked) { return; }
      docked = on;
      header.classList.toggle('logo-docked', on);
      header.classList.toggle('is-scrolled', on);
      morph.classList.toggle('is-on', !on);
    }
    morphDrivesHeader = true;
    measure();
    morph.classList.add('is-built');   /* hides the in-flow hero wordmark for good; the morph layer draws it */
    morph.classList.add('is-on');
    var cream = getComputedStyle(html).getPropertyValue('--cream').trim() || '#F0E6D5';
    var brown = getComputedStyle(html).getPropertyValue('--brown').trim() || '#432617';
    var morphTl = gsap.timeline({
      scrollTrigger: {
        trigger: hero, start: 'top top',
        end: function () { return '+=' + Math.round(hero.offsetHeight * MORPH_END); },
        scrub: true, invalidateOnRefresh: true,
        onRefreshInit: measure,
        onUpdate: function (st) { setDocked(st.progress >= 1); },
        onRefresh: function (st) { setDocked(st.progress >= 1); }
      }
    });
    morphTl
      .fromTo(morph,
        { x: function () { return from.x; }, y: function () { return from.y; }, scale: 1 },
        { x: function () { return to.x; }, y: function () { return to.y; }, scale: function () { return to.w / from.w; }, ease: 'none', duration: 1 }, 0)
      /* last stretch: the wordmark turns red as the header bar turns cream beneath it */
      .to('.logo-morph__cream', { opacity: 0, ease: 'none', duration: 0.2 }, 0.8)
      .to('.logo-morph__red', { opacity: 1, ease: 'none', duration: 0.2 }, 0.8)
      .fromTo(header, { backgroundColor: 'rgba(240,230,213,0)', color: cream }, { backgroundColor: cream, color: brown, ease: 'none', duration: 0.2 }, 0.8);
  }

  /* ---------------------------------------------------------
     3. Side-branch parallax (every page): the two fixed branches
        drift up slowly as the page scrolls.
     --------------------------------------------------------- */
  var frame = $('.tree-frame');
  if (frame) {
    var scrollDist = function () { return Math.max(1, html.scrollHeight - window.innerHeight); };
    $$('img[data-layer]', frame).forEach(function (el, i) {
      var s = SPEED[el.getAttribute('data-layer')];
      if (typeof s === 'undefined') { return; }
      gsap.to(el, {
        y: function () { return Math.max(-scrollDist() * s, -BRANCH_MAX()); },
        ease: 'none',
        scrollTrigger: { trigger: body, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true }
      });
      /* a slow 8s sway, +-1.2 degrees about the branch's root (CSS transform-origin); motion-only, so it never runs under reduced motion */
      gsap.fromTo(el, { rotation: i % 2 ? 1.2 : -1.2 }, { rotation: i % 2 ? -1.2 : 1.2, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  }

  /* ---------------------------------------------------------
     4. Kashida draw-on: any .kashida-draw path draws with scroll
        (stroke-dashoffset scrubbed from full length to 0)
     --------------------------------------------------------- */
  $$('.kashida-draw path').forEach(function (p) {
    var len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    gsap.to(p, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: p.closest('svg'), start: 'top 88%', end: 'top 45%', scrub: true }
    });
  });

  /* ---------------------------------------------------------
     7. Journey line with dots (and the steps line on How we work):
        [data-track] holds .track-line path(s) and .track-dot(s).
        The line draws across the section; each dot pops as the
        line reaches it.
     --------------------------------------------------------- */
  $$('[data-track]').forEach(function (track) {
    var paths = $$('.track-line path', track);
    var dots = $$('.track-dot', track);
    if (!paths.length) { return; }
    var tl = gsap.timeline({
      scrollTrigger: { trigger: track, start: 'top 75%', end: 'bottom 70%', scrub: true }
    });
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      tl.to(p, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
    });
    dots.forEach(function (d, i) {
      tl.fromTo(d, { scale: 0 }, { scale: 1, ease: 'back.out(2)', duration: 0.06 }, (i + 0.5) / dots.length - 0.03);
    });
  });

  /* ---------------------------------------------------------
     9. Section reveals (fade + rise, 0.9s ease-out), once;
     10. images scale 1.02 -> 1 on reveal; .stagger children stagger.
     --------------------------------------------------------- */
  $$('.reveal').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: function () { el.classList.add('is-in'); }
    });
  });
  $$('.reveal-img').forEach(function (el) {
    gsap.to(el, {
      scale: 1, duration: 1.2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
  $$('.stagger').forEach(function (group) {
    gsap.to(group.children, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08,
      scrollTrigger: { trigger: group, start: 'top 88%', once: true }
    });
  });

  /* Refresh triggers once fonts and images have settled */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ScrollTrigger.refresh(); }); }
})();
