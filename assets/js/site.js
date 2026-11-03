/* =========================================================
   Anar Events — site.js (v2, 3 Nov 2026)
   Requires (loaded before this file, self-hosted under assets/js/vendor, all pinned):
     GSAP 3.12.5 + ScrollTrigger 3.12.5, Lenis 1.1.18
   Every motion is a numbered block inside buildMotion(). If GSAP is missing,
   prefers-reduced-motion is on, or the visitor presses the header's Pause
   control, nothing is hidden and nothing scrubs: killMotion() reverts every
   tween to the plain CSS state.
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
    /* the rendered widths from the CSS: clamp(220px,26vw,520px) from 768px (220px up to 846px, 520px from 2000px), 200px on phones */
    leftBranch:   { file: 'left-branch',  sizes: '(min-width:2000px) 520px, (min-width:847px) 26vw, (min-width:768px) 220px, 200px' },
    rightBranch:  { file: 'right-branch', sizes: '(min-width:1400px) 520px, 26vw' },
    cloud1:       { file: 'cloud-1',      sizes: '120vw' },
    cloud2:       { file: 'cloud-2',      sizes: '140vw' }
  };
  /* The leaf band (bottom-canopy.webp) and ground band (ground-bottom.webp) are static
     in-flow images in the HTML, so they never sit behind text. */

  /* Parallax speed per layer (fraction of the page's scroll distance).
     Positive = moves up as you scroll down. */
  var SPEED = { leftBranch: 0.06, rightBranch: 0.08 };

  var html = document.documentElement;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var onMQ = function (mq, fn) { if (mq.addEventListener) { mq.addEventListener('change', fn); } else if (mq.addListener) { mq.addListener(fn); } };
  var rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopQuery = window.matchMedia('(min-width: 768px)');
  var reduced = rmq.matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData === true);
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var isDesktop = function () { return desktopQuery.matches; };
  /* the 1080 loop only where it is seen: 1280px wide and up on a dense (>= 1.5x) screen; everything else gets the 720 */
  var wideScreen = function () { return window.matchMedia('(min-width: 1280px)').matches && (window.devicePixelRatio || 1) >= 1.5; };
  /* the celebrations strip (one open panel, the rest collapsed) needs the width AND the height (site.css: same query);
     shorter landscape viewports stack the cards like phones */
  var stripQuery = window.matchMedia('(min-width: 768px) and (min-height: 701px)');
  var isStrip = function () { return stripQuery.matches; };

  var header = $('.site-header');
  var headerHeight = function () { return header ? header.offsetHeight : 0; };
  /* px: a branch (top: 25vh left, 38vh right, from the CSS) drifts up at most to 16px below the header bar, so a branch
     tip never passes under it */
  var BRANCH_MAX = function (el) {
    var top = parseFloat(getComputedStyle(el).top);
    if (!isFinite(top)) { top = 0.25 * window.innerHeight; }
    return Math.max(0, Math.round(top - headerHeight() - 16));
  };

  /* userPaused: the visitor pressed Pause, or the OS asks for reduced motion / less data at load.
     pressedPause: the visitor chose it (so the OS turning reduced motion off again does not restart the motion).
     The visitor's choice is kept for the session (sessionStorage) across the four pages. A saved 'playing' never
     overrides prefers-reduced-motion or Save-Data on load: those are honoured first; the saved choice only counts
     where motion is allowed (a Play press within the page still works, it is just not replayed on the next load).
     motionOn: the GSAP motion is built right now. */
  var MOTION_KEY = 'anar-motion';
  var readChoice = function () { try { return sessionStorage.getItem(MOTION_KEY); } catch (e) { return null; } };
  var writeChoice = function (v) { try { sessionStorage.setItem(MOTION_KEY, v); } catch (e) { /* private mode: not remembered */ } };
  var choice = readChoice();
  var pressedPause = choice === 'paused';
  var userPaused = pressedPause || reduced || saveData;
  var motionOn = false;
  var canMotion = function () { return hasGsap && !reduced && !userPaused; };
  /* html.paused: anchors jump at once and the celebrations strip opens without its transitions (site.css) */
  var syncPaused = function () { html.classList.toggle('paused', userPaused); };
  html.classList.add(canMotion() ? 'motion' : 'reduced');
  syncPaused();
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); }

  /* 0. Tree layer sources from the map (every page): src + srcset (700w, 1400w, 2752w) + sizes.
        The clouds only move (hero scroll timeline), so they are requested once motion is built; the right branch is
        display:none on phones, so it loads only from 768px. */
  var layerSrc = function (el) {
    var layer = TREE_LAYERS[el.getAttribute('data-layer')];
    if (!layer || el.getAttribute('srcset')) { return; }
    el.setAttribute('sizes', layer.sizes);
    el.setAttribute('srcset', ART + layer.file + '-700.webp 700w, ' + ART + layer.file + '-1400.webp 1400w, ' + ART + layer.file + '.webp 2752w');
    el.src = ART + layer.file + '.webp';
  };
  var loadLayers = function () {
    $$('[data-layer]').forEach(function (el) {
      var key = el.getAttribute('data-layer');
      if (key === 'cloud1' || key === 'cloud2') { return; }   /* loaded by buildMotion */
      if (key === 'rightBranch' && !isDesktop()) { return; }
      layerSrc(el);
    });
  };
  loadLayers();
  onMQ(desktopQuery, function (e) { if (e.matches) { loadLayers(); } });

  /* ---------------------------------------------------------
     0b. Hero video (index): no src in the HTML. The loop mp4
         (1080 only from 1280px wide at DPR >= 1.5, else 720; a <source media>
         attribute is ignored inside <video>) is appended after window
         'load', never under prefers-reduced-motion or Save-Data
         unless the visitor presses Play. Plays only while the
         tab is visible and the hero is on screen; pauses off
         screen and on document.hidden. The "Pause motion / Play
         motion" control sits in the header bar and pauses the
         video AND every GSAP motion (pauseAll / playAll below);
         aria-pressed "true" means paused. The poster shows in
         every other case.
     --------------------------------------------------------- */
  var heroVideo = $('.hero__video');
  var heroToggle = $('.hero-toggle');
  var videoLoaded = false, videoFailed = false;
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
    heroToggle.setAttribute('aria-label', userPaused ? 'Play motion' : 'Pause motion');
  };
  function loadHeroVideo() {
    if (!heroVideo || videoLoaded || videoFailed || userPaused) { return; }
    var src = heroVideo.getAttribute(wideScreen() ? 'data-src-desktop' : 'data-src-mobile');
    if (!src) { return; }
    videoLoaded = true;
    var source = document.createElement('source');
    source.type = 'video/mp4';
    source.src = src;
    var fallback = function () {   /* a missing file or a decode error: back to the poster, silently (the control keeps pausing the rest) */
      if (videoFailed) { return; }
      videoFailed = true;
      try { heroVideo.pause(); if (source.parentNode) { heroVideo.removeChild(source); } heroVideo.load(); } catch (e) { /* poster is showing */ }
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
  }
  /* the control is useful wherever something moves: a video or GSAP; otherwise it is hidden */
  if (heroToggle && !heroVideo && !hasGsap) { heroToggle.hidden = true; }

  /* ---------------------------------------------------------
     Smooth scroll (Lenis) wired to the GSAP ticker. It runs
     only while motion is on: Pause motion, reduced motion and
     Save-Data all destroy it (stopLenis) and it is built again
     when motion returns (startLenis); while it is off, anchors
     jump at once (html.paused sets scroll-behavior:auto).
     --------------------------------------------------------- */
  var lenis = null;
  var lenisTick = function (t) { if (lenis) { lenis.raf(t * 1000); } };
  function startLenis() {
    if (lenis || !hasGsap || reduced || userPaused || typeof window.Lenis === 'undefined') { return; }
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);
    html.classList.add('lenis');
    if (header && header.classList.contains('nav-open')) { lenis.stop(); }
  }
  function stopLenis() {
    if (!lenis) { return; }
    gsap.ticker.remove(lenisTick);
    lenis.destroy();
    lenis = null;
    html.classList.remove('lenis');
  }
  startLenis();
  /* the destination's own scroll-margin-top (header + 8px; header + 24px for #inquire and the CTA) */
  function headerOffset(el) {
    var m = el ? parseFloat(getComputedStyle(el).scrollMarginTop) : NaN;
    return -(isFinite(m) && m > 0 ? m : headerHeight() + 8);
  }
  /* focus moves to the destination (keyboard and screen-reader users continue from there) */
  function focusEl(el) {
    if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); }
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
  function scrollToEl(el) {
    if (lenis) { lenis.scrollTo(el, { offset: headerOffset(el), duration: 1.4 }); }
    /* scroll-margin-top clears the header; 'auto' follows the CSS, which is instant while paused (html.paused) */
    else { el.scrollIntoView({ behavior: (reduced || userPaused) ? 'auto' : 'smooth', block: 'start' }); }
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
     Header: solid once scrolled; mobile drawer.
     (on index with motion on, block 2 drives the solid state
      from the wordmark morph instead of the 40px threshold)
     The links are visible by default (CSS); only once the
     toggle is wired (html.nav-ready) do they collapse into the
     drawer. Escape closes and returns focus to the toggle; a
     click outside the header, focus leaving the header, or the
     viewport growing past 768px closes it; the collapsed drawer
     is aria-hidden; Lenis stops while it is open.
     --------------------------------------------------------- */
  var navToggle = $('.nav-toggle');
  var nav = $('.site-nav');
  var morphDrivesHeader = false;
  function onScrollState() {
    if (!header || morphDrivesHeader) { return; }
    header.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset) > 40);
  }
  window.addEventListener('scroll', onScrollState, { passive: true });   /* Lenis scrolls the window, so this fires either way */
  onScrollState();
  function syncNav() {
    if (!header || !navToggle || !nav) { return; }
    var phone = !isDesktop();
    var open = header.classList.contains('nav-open');
    if (open && !phone) { header.classList.remove('nav-open'); open = false; }
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (phone && !open) { nav.setAttribute('aria-hidden', 'true'); } else { nav.removeAttribute('aria-hidden'); }
    if (lenis) { if (open) { lenis.stop(); } else { lenis.start(); } }
  }
  function closeNav() {
    if (!header) { return; }
    header.classList.remove('nav-open');
    syncNav();
  }
  if (navToggle && nav && header) {
    navToggle.addEventListener('click', function () {
      header.classList.toggle('nav-open');
      syncNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { closeNav(); navToggle.focus(); }
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('nav-open') && !header.contains(e.target)) { closeNav(); }
    }, true);
    header.addEventListener('focusout', function (e) {
      if (header.classList.contains('nav-open') && e.relatedTarget && !header.contains(e.relatedTarget)) { closeNav(); }
    });
    onMQ(desktopQuery, function (e) { if (e.matches) { closeNav(); } else { syncNav(); } });
    window.addEventListener('resize', syncNav, { passive: true });
    syncNav();
    html.classList.add('nav-ready');   /* only now do the links collapse into the drawer (CSS) */
  }

  /* ---------------------------------------------------------
     5. Accordion panels (every mode: reduced motion, no GSAP):
        hover expands (pointer devices), click / Enter / Space
        and focus expand (touch, keyboard); arrow keys, Home and
        End move between triggers. Stacked cards (phones and
        viewports 700px tall or less: isStrip() false), every
        body shown, so the overlay triggers are hidden there (out
        of the tab order; back on the strip). On the strip a
        closed panel's body is inert and aria-hidden (it is faded
        out), the open one is live.
     --------------------------------------------------------- */
  $$('[data-accordion]').forEach(function (acc) {
    var panels = $$('.accordion__panel', acc);
    var triggers = panels.map(function (p) { return $('.accordion__trigger', p); });
    var hoverable = window.matchMedia('(hover: hover)').matches;
    function syncBodies() {
      var stacked = !isStrip();
      panels.forEach(function (p, i) {
        var bodyEl = $('.accordion__body', p);
        if (triggers[i]) { triggers[i].hidden = stacked; }
        if (!bodyEl) { return; }
        var closed = !stacked && !p.classList.contains('is-open');
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
      if (hoverable) { p.addEventListener('mouseenter', function () { if (isStrip()) { open(p); } }); }
      if (!btn) { return; }
      btn.addEventListener('click', function () { open(p); });
      btn.addEventListener('focus', function () { if (isStrip()) { open(p); } });
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
    onMQ(stripQuery, syncBodies);
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
  if (form) {
    /* the wedding date cannot be in the past: min = today (local) */
    var dateEl = $('input[type="date"]', form);
    if (dateEl) {
      var now = new Date();
      var two = function (n) { return (n < 10 ? '0' : '') + n; };
      dateEl.min = now.getFullYear() + '-' + two(now.getMonth() + 1) + '-' + two(now.getDate());
    }
    /* per-field validation: an invalid control gets aria-invalid="true" and a message under it (.field__error, added
       to its aria-describedby, the help line kept); `input` clears it as soon as the entry is valid. The browser's
       bubble is replaced (noValidate + the invalid event cancelled); submit focuses the first invalid field. */
    var messageFor = function (el) {
      var v = el.validity;
      if (v.valueMissing) { return 'Please fill in this field.'; }
      if (v.typeMismatch && el.type === 'email') { return 'Please enter an email address like name@example.com.'; }
      if (v.rangeUnderflow && el.type === 'date') { return 'Please choose today or a later date.'; }
      if (v.rangeUnderflow) { return 'Please enter ' + el.min + ' or more.'; }
      if (v.badInput || v.stepMismatch) { return 'Please enter a whole number.'; }
      return el.validationMessage || 'Please check this entry.';
    };
    var errorFor = function (el, create) {
      var field = el.closest('.field');
      var err = field ? $('.field__error', field) : null;
      if (!err && create && field) {
        err = document.createElement('p');
        err.className = 'field__error';
        err.id = (el.id || el.name) + '-error';
        field.appendChild(err);
      }
      return err;
    };
    var describe = function (el, id, on) {
      var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      var at = ids.indexOf(id);
      if (on && at < 0) { ids.push(id); }
      if (!on && at >= 0) { ids.splice(at, 1); }
      if (ids.length) { el.setAttribute('aria-describedby', ids.join(' ')); } else { el.removeAttribute('aria-describedby'); }
    };
    var flagField = function (el) {
      var err = errorFor(el, true);
      el.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = messageFor(el); describe(el, err.id, true); }
    };
    var clearField = function (el) {
      var err = errorFor(el, false);
      el.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; describe(el, err.id, false); }
    };
    var controls = $$('.field input, .field textarea, .field select', form);
    controls.forEach(function (el) {
      el.addEventListener('invalid', function (e) { e.preventDefault(); flagField(el); });
      el.addEventListener('input', function () {
        if (el.validity.valid) { clearField(el); }
        else if (el.getAttribute('aria-invalid') === 'true') { flagField(el); }
      });
    });
    form.addEventListener('reset', function () { controls.forEach(clearField); });
    form.noValidate = true;
    form.addEventListener('submit', function (e) {
      if (form.checkValidity()) { return; }   /* fires `invalid` on each failing control (flagged above) */
      e.preventDefault();
      var first = $('[aria-invalid="true"]', form);
      if (first) { first.focus(); }
    });
  }
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
      if (!form.checkValidity()) { return; }   /* the per-field messages and focus are handled above */
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

  /* =========================================================
     MOTION. Everything below builds inside one gsap.context so
     killMotion() can revert every tween, ScrollTrigger and
     inline style in one call (the Pause control, a reduced-
     motion change) and buildMotion() can rebuild it (Play).
     ========================================================= */
  var ctx = null;
  var hero = $('.hero');
  var morph = $('.logo-morph');
  var heroWordImg = $('.hero__word img');
  var headerLogoBox = $('.site-logo');   /* the anchor: always laid out (visibility hidden until docked) */
  var frame = $('.tree-frame');
  /* drawn paths (kashida scribbles, the journey and steps lines): the length is measured when the SVG is laid out
     (hidden SVGs give 0 and are skipped) and measured again on every ScrollTrigger refresh (a resize can swap the
     journey's horizontal and vertical lines) */
  var dashPaths = [];
  function pathLength(p) {
    try {
      if (!p.getClientRects().length) { return 0; }   /* display:none (the other journey line) */
      var len;
      if (getComputedStyle(p).vectorEffect === 'non-scaling-stroke') {
        /* the journey and steps lines are stretched (preserveAspectRatio none): their dash lengths are in screen px,
           so the length is the rendered box, not the viewBox units of getTotalLength() */
        var b = p.getBoundingClientRect();
        len = Math.max(b.width, b.height);
      } else {
        len = p.getTotalLength();
      }
      return (isFinite(len) && len > 0) ? len : 0;
    } catch (e) { return 0; }
  }
  function dashSet(d) {
    d.len = pathLength(d.p);
    d.p.style.strokeDasharray = d.len ? d.len : 'none';
    d.p.style.strokeDashoffset = d.len;
  }
  function remeasureDash() { dashPaths.forEach(dashSet); }
  function dashTrack(p) {
    var d = { p: p, len: 0 };
    dashSet(d);
    dashPaths.push(d);
    return d;
  }

  function buildMotion() {
    if (motionOn || !hasGsap) { return; }
    motionOn = true;
    html.classList.add('motion');
    html.classList.remove('reduced');
    dashPaths = [];
    revealTweens = [];
    $$('.hero__cloud[data-layer]').forEach(layerSrc);   /* the clouds are requested only now */
    ctx = gsap.context(function () {

      /* ---------------------------------------------------------
         1. Hero: the tagline fades (the wordmark is handled by the
            morph in block 2);
         2b. two cloud layers roll in from the bottom at different speeds
            (hidden by CSS until this timeline sets them); then the hero fades to cream.
         --------------------------------------------------------- */
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
      if (hero && morph && heroWordImg && headerLogoBox && header) {
        var MORPH_END = 0.7;   /* fraction of the hero height */
        var from = { x: 0, y: 0, w: 1 }, to = { x: 0, y: 0, w: 1 };
        var measure = function () {
          /* the start box is the in-flow <h1> img (never the .logo-morph layer, which may be mid-transform when a
             refresh runs): its rect relative to the hero's own rect, plus the hero's document top, so the value does
             not depend on the scroll position at the time of the measure */
          var sy = window.scrollY || window.pageYOffset;
          var hr = hero.getBoundingClientRect();
          var h = heroWordImg.getBoundingClientRect();
          from = { x: h.left, y: (h.top - hr.top) + (hr.top + sy), w: h.width };
          /* header logo box in viewport coordinates (the header is fixed) */
          var l = headerLogoBox.getBoundingClientRect();
          to = { x: l.left, y: l.top, w: l.width };
          morph.style.width = from.w + 'px';
          morph.style.height = (from.w * 552 / 1600) + 'px';
        };
        var docked = null;   /* null: not yet applied, so the first call always sets the classes */
        var setDocked = function (on) {
          if (on === docked) { return; }
          docked = on;
          header.classList.toggle('logo-docked', on);
          header.classList.toggle('is-scrolled', on);
          morph.classList.toggle('is-on', !on);
        };
        morphDrivesHeader = true;
        measure();
        morph.classList.add('is-built');   /* hides the in-flow hero wordmark while motion is on; the morph layer draws it */
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
         3. Side-branch parallax (every page): the fixed branches
            drift up slowly as the page scrolls, never further than
            BRANCH_MAX (16px below the header bar); a slow 8s sway,
            +-1.2 degrees about the branch's root (CSS transform-
            origin). Both live only here, so neither runs under
            reduced motion or while paused.
         --------------------------------------------------------- */
      if (frame) {
        var scrollDist = function () { return Math.max(1, html.scrollHeight - window.innerHeight); };
        $$('img[data-layer]', frame).forEach(function (el, i) {
          var s = SPEED[el.getAttribute('data-layer')];
          if (typeof s === 'undefined') { return; }
          gsap.to(el, {
            y: function () { return Math.max(-scrollDist() * s, -BRANCH_MAX(el)); },
            ease: 'none',
            scrollTrigger: { trigger: body, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true }
          });
          gsap.fromTo(el, { rotation: i % 2 ? 1.2 : -1.2 }, { rotation: i % 2 ? -1.2 : 1.2, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        });
      }

      /* ---------------------------------------------------------
         4. Kashida draw-on: any .kashida-draw path draws with scroll
            (stroke-dashoffset scrubbed from full length to 0)
         --------------------------------------------------------- */
      $$('.kashida-draw path').forEach(function (p) {
        var d = dashTrack(p);
        gsap.fromTo(p, { strokeDashoffset: function () { return d.len; } }, {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: { trigger: p.closest('svg'), start: 'top 88%', end: 'top 45%', scrub: true, invalidateOnRefresh: true }
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
          scrollTrigger: { trigger: track, start: 'top 75%', end: 'bottom 70%', scrub: true, invalidateOnRefresh: true }
        });
        paths.forEach(function (p) {
          var d = dashTrack(p);
          tl.fromTo(p, { strokeDashoffset: function () { return d.len; } }, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
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
        revealTweens.push({ el: el, tw: gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onComplete: function () { el.classList.add('is-in'); }
        }) });
      });
      $$('.reveal-img').forEach(function (el) {
        gsap.to(el, {
          scale: 1, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
      $$('.stagger').forEach(function (group) {
        revealTweens.push({ el: group, tw: gsap.to(group.children, {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 88%', once: true }
        }) });
      });
    });
    ScrollTrigger.addEventListener('refreshInit', remeasureDash);
    ScrollTrigger.refresh();
  }

  /* a control reached by the keyboard (a link, the form, an accordion trigger) is shown at once, together with every
     hidden .reveal / .stagger ancestor, instead of waiting for its scroll position */
  var revealTweens = [];
  document.addEventListener('focusin', function (e) {
    if (!motionOn || !revealTweens.length) { return; }
    var el = e.target;
    while (el && el !== body) {
      for (var i = 0; i < revealTweens.length; i++) {
        if (revealTweens[i].el === el && revealTweens[i].tw.progress() < 1) { revealTweens[i].tw.progress(1); }
      }
      el = el.parentElement;
    }
  });
  /* a <details> opening or closing changes the page height: every trigger below it is re-measured */
  $$('details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (motionOn) { ScrollTrigger.refresh(); } });
  });

  function killMotion() {
    if (!motionOn) { return; }
    motionOn = false;
    ScrollTrigger.removeEventListener('refreshInit', remeasureDash);
    if (ctx) { ctx.revert(); ctx = null; }   /* every tween, trigger and inline style it set */
    dashPaths.forEach(function (d) { d.p.style.strokeDasharray = ''; d.p.style.strokeDashoffset = ''; });
    dashPaths = [];
    revealTweens = [];
    if (frame) { $$('img[data-layer]', frame).forEach(function (el) { el.style.transform = ''; }); }   /* the sway and parallax leave an identity transform behind */
    if (morph) { morph.classList.remove('is-on'); morph.classList.remove('is-built'); morph.removeAttribute('style'); }
    if (header) { header.classList.remove('logo-docked'); }
    morphDrivesHeader = false;
    html.classList.remove('motion');
    html.classList.add('reduced');
    onScrollState();
  }

  /* ---------------------------------------------------------
     Pause motion / Play motion (the control in the header bar
     of every page) and the prefers-reduced-motion change event.
     Pause stops the video, the branch sway and parallax, the
     clouds, the morph and the reveals; Play rebuilds them (the
     video only, under reduced motion). The visitor's press is
     kept for the session. An OS change to reduced motion at
     runtime also destroys Lenis; when motion returns, Lenis and
     (unless the visitor pressed Pause) the motion come back.
     --------------------------------------------------------- */
  function pauseAll() {
    userPaused = true;
    setToggle();
    syncPaused();
    if (heroVideo) { heroVideo.pause(); }
    killMotion();
    stopLenis();   /* smooth scrolling is motion too: anchors jump at once while paused */
  }
  function playAll() {
    userPaused = false;
    setToggle();
    syncPaused();
    if (canMotion()) { buildMotion(); }
    startLenis();   /* never under reduced motion (startLenis checks) */
    if (heroVideo) { if (!videoLoaded) { loadHeroVideo(); } else { playVideo(); } }
  }
  if (heroToggle) {
    setToggle();
    heroToggle.addEventListener('click', function () {
      pressedPause = !userPaused;
      writeChoice(pressedPause ? 'paused' : 'playing');
      if (userPaused) { playAll(); } else { pauseAll(); }
    });
  }
  onMQ(rmq, function (e) {
    reduced = e.matches;
    if (reduced) { pauseAll(); }
    else if (!pressedPause && !saveData) { playAll(); }
  });

  /* ---- start ---- */
  if (canMotion()) { buildMotion(); }

  /* Refresh triggers once fonts and images have settled */
  if (hasGsap) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ScrollTrigger.refresh(); }); }
  }
})();
