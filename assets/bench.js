/* Shared playground helpers: the light/dark switch, the DialKit panel,
   and the copy buttons. Each playground.js uses these. */
(function () {
  "use strict";

  var KEY = "cta-experiments-theme";
  var rootEl = document.documentElement;
  var listeners = [];
  var dialRoot = null, dialTarget = null;

  function current() { return rootEl.getAttribute("data-theme") || "light"; }

  function setTheme(mode) {
    rootEl.setAttribute("data-theme", mode);
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-set") === mode));
    });
    // DialKit's root takes its theme when it's created, so rebuild it to match
    if (dialTarget && window.DialKit) {
      if (dialRoot) dialRoot.destroy();
      dialRoot = DialKit.createDialRoot({ mode: "inline", target: dialTarget, theme: mode });
    }
    listeners.forEach(function (fn) { fn(mode); });
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var mode = saved || "light"; // beige by default; dark only when someone picks it
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.addEventListener("click", function () { setTheme(b.getAttribute("data-theme-set")); });
    });
    setTheme(mode);
  }

  function panel(target) {
    dialTarget = target;
    setTheme(current());
  }

  var toastEl = null, toastTimer = 0;
  function toast(msg) {
    toastEl = toastEl || document.getElementById("toast");
    if (!toastEl) return;
    toastEl.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.textContent = ""; }, 1800);
  }

  function copy(text, what, codeEl) {
    var fallback = function () {
      if (!codeEl) { toast("copy blocked here"); return; }
      var d = codeEl.closest("details"); if (d) d.open = true;
      var r = document.createRange(); r.selectNodeContents(codeEl);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      toast("selected, press copy");
    };
    try { navigator.clipboard.writeText(text).then(function () { toast(what + " copied"); }, fallback); }
    catch (e) { fallback(); }
  }

  window.Bench = {
    theme: current,
    onTheme: function (fn) { listeners.push(fn); },
    panel: panel,
    toast: toast,
    copy: copy,
  };
  initTheme();
})();
