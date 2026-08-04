/* =============================================================================
   PRATHAM KURIL — Portfolio interactivity
   Vanilla JS, no dependencies. Every feature is opt-in via feature detection so
   a single file drives index / projects / resume / 404. All motion respects
   prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- Boot -- */
  function runBoot() {
    var boot = $("#boot");
    if (!boot) return Promise.resolve();
    if (reduceMotion || sessionStorage.getItem("booted")) {
      document.body.classList.remove("booting");
      document.body.classList.add("boot-done");
      return Promise.resolve();
    }
    document.body.classList.add("booting");
    var lines = $$(".boot-line", boot);
    var bar = $(".boot-bar > i", boot);
    var skip = $(".boot-skip", boot);
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      sessionStorage.setItem("booted", "1");
      document.body.classList.add("boot-done");
      setTimeout(function () { document.body.classList.remove("booting"); }, 420);
    }
    if (skip) skip.addEventListener("click", finish);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") { finish(); document.removeEventListener("keydown", onKey); }
    });

    return new Promise(function (resolve) {
      var i = 0;
      (function step() {
        if (done) { resolve(); return; }
        if (i < lines.length) {
          lines[i].classList.add("show");
          if (bar) bar.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
          i++;
          setTimeout(step, 200);
        } else {
          setTimeout(function () { finish(); resolve(); }, 380);
        }
      })();
    });
  }

  /* ------------------------------------------------------ Terminal type -- */
  function typeHero() {
    var term = $("#term-type");
    if (!term) return;
    var steps;
    try { steps = JSON.parse(term.getAttribute("data-seq")); }
    catch (e) { return; }

    if (reduceMotion) {
      term.innerHTML = steps.map(function (s) {
        return '<div class="term-line"><span class="' + (s.cmd ? "prompt" : "term-typed") + '">' +
          escapeHtml(s.t) + "</span></div>";
      }).join("");
      return;
    }

    term.innerHTML = "";
    var idx = 0;
    function next() {
      if (idx >= steps.length) {
        var cur = $(".term-cursor", term);
        if (cur) { var wrap = document.createElement("div"); wrap.className = "term-line"; wrap.innerHTML = '<span class="prompt"></span><span class="term-cursor"></span>'; term.appendChild(wrap); }
        return;
      }
      var s = steps[idx];
      var line = document.createElement("div");
      line.className = "term-line";
      var label = document.createElement("span");
      label.className = s.cmd ? "prompt" : "term-typed";
      line.appendChild(label);
      var cursor = document.createElement("span");
      cursor.className = "term-cursor";
      line.appendChild(cursor);
      term.appendChild(line);

      var text = s.t, ci = 0;
      var speed = s.cmd ? 34 : 12;
      (function typeChar() {
        if (ci <= text.length) {
          label.textContent = text.slice(0, ci);
          ci++;
          setTimeout(typeChar, speed + (s.cmd ? Math.random() * 40 : 0));
        } else {
          if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
          idx++;
          setTimeout(next, s.cmd ? 240 : 120);
        }
      })();
    }
    next();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------------------------------------------- Scroll reveal ---- */
  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------- Stat counters -- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dur = 1300, start = null;
      var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      if (reduceMotion) { el.textContent = format(target); return; }
      function format(v) {
        return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US");
      }
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = format(target);
      }
      requestAnimationFrame(tick);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------- London clock - */
  function initClock() {
    var el = $("#clock");
    if (!el) return;
    function tick() {
      try {
        var s = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
        }).format(new Date());
        el.textContent = s + " LDN";
      } catch (e) { el.textContent = "LDN"; }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------- Copy to clipboard  */
  function initCopy() {
    var toast = $("#copy-toast");
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(function () { toast.classList.remove("show"); }, 1600);
    }
    $$("[data-copy]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var val = el.getAttribute("data-copy");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          e.preventDefault();
          navigator.clipboard.writeText(val).then(function () {
            showToast("copied: " + val);
          }).catch(function () { showToast(val); });
        }
      });
    });
  }

  /* -------------------------------------------------------- Mobile nav --- */
  function initNav() {
    var toggle = $(".nav-toggle");
    var links = $(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$("a", links).forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("open"); });
      });
    }
    // active section highlight on scroll (index page anchors)
    var navAnchors = $$('.nav-links a[href^="#"]');
    if (navAnchors.length && "IntersectionObserver" in window) {
      var map = {};
      navAnchors.forEach(function (a) {
        var id = a.getAttribute("href").slice(1);
        var sec = document.getElementById(id);
        if (sec) map[id] = a;
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            navAnchors.forEach(function (a) { a.classList.remove("active"); });
            if (map[en.target.id]) map[en.target.id].classList.add("active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    }
  }

  /* ------------------------------------------------- Project filters ----- */
  function initFilters() {
    var filters = $$(".filter");
    var cards = $$("[data-cats]");
    if (!filters.length || !cards.length) return;
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filters.forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        var f = btn.getAttribute("data-filter");
        cards.forEach(function (card) {
          var cats = card.getAttribute("data-cats");
          var show = f === "all" || cats.indexOf(f) !== -1;
          card.hidden = !show;
        });
      });
    });
  }

  /* --------------------------------------------------- Command palette --- */
  function initCmdK() {
    var pal = $("#cmdk");
    if (!pal) return;
    var input = $(".cmdk-input input", pal);
    var list = $(".cmdk-list", pal);
    var items = $$(".cmdk-item", pal);
    var active = 0;

    function open() {
      pal.classList.add("open");
      input.value = "";
      filter("");
      setActive(0);
      setTimeout(function () { input.focus(); }, 20);
    }
    function close() { pal.classList.remove("open"); }
    function isOpen() { return pal.classList.contains("open"); }

    function visibleItems() { return items.filter(function (it) { return !it.hidden; }); }
    function setActive(i) {
      var vis = visibleItems();
      if (!vis.length) return;
      active = (i + vis.length) % vis.length;
      items.forEach(function (it) { it.classList.remove("active"); });
      vis[active].classList.add("active");
      vis[active].scrollIntoView({ block: "nearest" });
    }
    function filter(q) {
      q = q.toLowerCase().trim();
      items.forEach(function (it) {
        var t = (it.getAttribute("data-label") || it.textContent).toLowerCase();
        it.hidden = q && t.indexOf(q) === -1;
      });
      setActive(0);
    }
    function trigger(it) {
      var href = it.getAttribute("data-href");
      var ext = it.getAttribute("data-ext") === "1";
      close();
      if (it.getAttribute("data-print") === "1") { setTimeout(function () { window.print(); }, 60); return; }
      if (!href) return;
      if (ext) { window.open(href, "_blank", "noopener"); }
      else if (href.charAt(0) === "#") {
        var t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        else window.location.href = "index.html" + href;
      } else { window.location.href = href; }
    }

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (!isOpen()) return;
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") { e.preventDefault(); var vis = visibleItems(); if (vis[active]) trigger(vis[active]); }
    });
    if (input) input.addEventListener("input", function () { filter(input.value); });
    items.forEach(function (it) {
      it.addEventListener("click", function () { trigger(it); });
      it.addEventListener("mousemove", function () {
        var vis = visibleItems(); var i = vis.indexOf(it); if (i > -1) setActive(i);
      });
    });
    pal.addEventListener("click", function (e) { if (e.target === pal) close(); });
    $$("[data-cmdk-open]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); open(); }); });
  }

  /* ----------------------------------------------------- Konami egg ------ */
  function initKonami() {
    var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var pos = 0;
    document.addEventListener("keydown", function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) {
        pos = 0;
        document.body.classList.add("konami-flash");
        var toast = $("#copy-toast");
        if (toast) { toast.textContent = "// cheat mode: unlocked ✦ ship it"; toast.classList.add("show"); setTimeout(function () { toast.classList.remove("show"); }, 2200); }
        setTimeout(function () { document.body.classList.remove("konami-flash"); }, 1200);
      }
    });
  }

  /* ---------------------------------------------------- Year stamps ------ */
  function initYear() { $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }

  /* --------------------------------------------------------- Print CV ---- */
  function initPrint() {
    $$("[data-print]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); window.print(); });
    });
  }

  /* ------------------------------------------------------------ Boot ----- */
  function init() {
    initNav();
    initReveal();
    initCounters();
    initClock();
    initCopy();
    initFilters();
    initCmdK();
    initKonami();
    initYear();
    initPrint();
    runBoot().then(typeHero);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
