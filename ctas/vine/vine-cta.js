/*!
 * Vine CTA, part of cta-experiments by Gauri Tsering Sharma.
 *
 * A button whose vines slip out from behind it, wrap back over its edges and
 * across its face, then open into flowers. Hover grows it on desktop, a tap
 * grows it on touch screens, and a click presses only the button while the
 * growth stays where it is.
 *
 * Usage:
 *   <a class="vine-cta" href="/resume.pdf" download>
 *     <span class="vine-cta__label">Download resume</span>
 *   </a>
 *   <script src="vine-cta.js"></script>
 *   <script>VineCTA.mount(document.querySelector(".vine-cta"), { ...options });</script>
 *
 * Every option is listed in DEFAULTS below. Anything you leave out falls back to it.
 * No dependencies. Respects prefers-reduced-motion.
 */
(function (root) {
  function factory() {
    "use strict";

    /* ------------------------------------------------------------ options */

    var DEFAULTS = {
      icon: true, // download arrow before the label, turns into a tick once clicked
      shape: "pill", // "pill" | "rounded" | "square"
      font: "", // CSS font-family for the label; empty inherits from the page
      colors: {
        button: "#231a16", // the button face
        pressed: "#3a2219", // the face after it has been clicked
        text: "#efe6da", // label colour
        glow: "#7a1824", // soft halo behind the button while it blooms
        stem: "#4e6032", // vine colour (the tips; the roots are drawn darker)
        leaf: "#3a4f27",
      },
      // Flower types. Each bloom picks one, weighted by `weight`.
      // shape: "ruffled" (3 layers) | "soft" (2 layers) | "wide" (orchid-like) | "slender" (lily-like)
      // speckles / stamens: a colour to add them, or "" for none.
      flowers: [
        { petal: "#7d1726", tip: "#e9b8ad", centre: "#0a0103", shape: "ruffled", speckles: "", stamens: "", weight: 3 },
        { petal: "#968491", tip: "#f6f1ee", centre: "#140a10", shape: "soft", speckles: "", stamens: "", weight: 1 },
      ],
      vines: 7, // how many vines, 3 to 10
      reach: 1, // how far they go past the button, 0.5 to 1.5
      length: 1, // how long each vine runs, 0.6 to 1.5
      thickness: 1, // stem thickness, 0.5 to 2
      leaves: 1, // leaf density, 0 to 2
      blooms: 1, // how many vines end in a flower, 0 to 1.5
      bloomSize: 1, // flower size, 0.5 to 1.8
      buds: true, // closed buds on some of the shorter stems
      thorns: true, // thorns on the main stems
      haze: false, // a soft glow behind each flower
      speed: 1, // growth speed, 0.4 to 2.5
      seed: 7, // any number; a different number grows a different pattern
      retract: true, // pull the vines back in when the pointer leaves (before any click)
    };

    var PRESETS = {
      oxblood: {
        colors: { button: "#231a16", pressed: "#3a2219", text: "#efe6da", glow: "#7a1824", stem: "#4e6032", leaf: "#3a4f27" },
        flowers: [
          { petal: "#7d1726", tip: "#e9b8ad", centre: "#0a0103", shape: "ruffled", speckles: "", stamens: "", weight: 3 },
          { petal: "#968491", tip: "#f6f1ee", centre: "#140a10", shape: "soft", speckles: "", stamens: "", weight: 1 },
        ],
        thorns: true,
        haze: false,
        blooms: 1,
        buds: true,
        leaves: 1,
      },
      orchid: {
        colors: { button: "#3e2430", pressed: "#55283c", text: "#faecbb", glow: "#e58aa8", stem: "#7a7c56", leaf: "#6f7a55" },
        flowers: [
          { petal: "#cc4a7c", tip: "#fde3ec", centre: "#f6cf84", shape: "wide", speckles: "#96164a", stamens: "", weight: 2 },
          { petal: "#ec96b0", tip: "#fdeff3", centre: "#f6c46e", shape: "slender", speckles: "", stamens: "#d6608c", weight: 1 },
          { petal: "#f6d6a0", tip: "#fffaf0", centre: "#eeb46e", shape: "soft", speckles: "", stamens: "", weight: 1 },
        ],
        thorns: true,
        haze: true,
        blooms: 1,
        buds: true,
        leaves: 1,
      },
      // just moss: dense soft leaves, no thorns, no flowers
      moss: {
        colors: { button: "#1f2a22", pressed: "#2c3b2f", text: "#e9efe4", glow: "#9fc27a", stem: "#5d7a3c", leaf: "#5f8a3a" },
        flowers: [],
        thorns: false,
        haze: false,
        blooms: 0,
        buds: false,
        leaves: 2,
      },
    };

    /* ------------------------------------------------------------ helpers */

    var TAU = Math.PI * 2;
    var STEP = 2.4; // px per growth step
    var BASE_SPEED = 0.15; // px of vine per ms at speed 1
    var BLOOM_MS = 900;
    var RETRACT_MS = 550;

    function clamp(v, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return v < a ? a : v > b ? b : v; }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function back(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
    function diff(to, from) { return ((to - from + Math.PI) % TAU + TAU) % TAU - Math.PI; }
    function rng(s) {
      return function () {
        s |= 0; s = (s + 0x6d2b79f5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function rgb(hex) {
      var h = String(hex || "#000").replace("#", "");
      if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
      var n = parseInt(h.slice(0, 6), 16) || 0;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function mix(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
    function css(c, a) { return a == null ? "rgb(" + c.join(",") + ")" : "rgba(" + c.join(",") + "," + a + ")"; }
    var BLACK = [0, 0, 0], WHITE = [255, 255, 255];

    function merge(base, over) {
      var out = {};
      Object.keys(base).forEach(function (k) { out[k] = base[k]; });
      Object.keys(over || {}).forEach(function (k) {
        var v = over[k];
        if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) out[k] = merge(base[k], v);
        else if (v !== undefined) out[k] = v;
      });
      return out;
    }

    /* ------------------------------------------------------------ styles */

    var STYLE_ID = "vine-cta-style";
    var STYLES =
      ".vine-cta{--vc-button:#231a16;--vc-pressed:#3a2219;--vc-text:#efe6da;--vc-glow:rgba(122,24,36,.28);--vc-ring:#7a1824;" +
      "position:relative;isolation:isolate;display:inline-flex;align-items:center;justify-content:center;min-height:56px;padding:0 32px;" +
      "border-radius:var(--vc-radius,999px);color:var(--vc-text);text-decoration:none;cursor:pointer;font-size:15px;font-weight:500;line-height:1;" +
      "letter-spacing:.02em;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;box-sizing:border-box}" +
      ".vine-cta::before{content:'';position:absolute;inset:-30px -44px;z-index:-2;pointer-events:none;" +
      "background:radial-gradient(50% 50% at 50% 55%,var(--vc-glow),transparent 70%);opacity:0;transition:opacity 1.2s ease}" +
      ".vine-cta.is-bloom::before{opacity:1}" +
      ".vine-cta__face{position:absolute;inset:0;z-index:0;border-radius:inherit;background:var(--vc-button);pointer-events:none;" +
      "box-shadow:inset 0 1px 0 rgba(255,255,255,.06),inset 0 -10px 18px rgba(0,0,0,.22),0 10px 24px -12px rgba(0,0,0,.55);" +
      "transition:background-color .6s ease,transform .3s cubic-bezier(.34,1.56,.64,1)}" +
      ".vine-cta.is-done .vine-cta__face{background:var(--vc-pressed)}" +
      ".vine-cta__canvas{position:absolute;pointer-events:none}" +
      ".vine-cta__canvas--back{z-index:-1}.vine-cta__canvas--front{z-index:1}" +
      ".vine-cta__label{position:relative;z-index:2;display:inline-flex;align-items:center;gap:10px;font-family:var(--vc-font,inherit);" +
      "text-shadow:0 1px 6px rgba(0,0,0,.45);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}" +
      ".vine-cta:active .vine-cta__face,.vine-cta:active .vine-cta__label{transform:translateY(2px) scale(.96);transition-duration:.08s}" +
      ".vine-cta:focus-visible{outline:none}.vine-cta:focus-visible .vine-cta__face{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--vc-ring)}" +
      ".vine-cta__icon{width:17px;height:17px;flex:none}.vine-cta__check{display:none}" +
      ".vine-cta.is-done .vine-cta__arrow{display:none}.vine-cta.is-done .vine-cta__check{display:block}";

    function injectStyles() {
      if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
      var s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }

    var ICONS =
      '<svg class="vine-cta__icon vine-cta__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>' +
      '<svg class="vine-cta__icon vine-cta__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

    /* ------------------------------------------------------------ growth plan
       Every vine starts hidden behind the button, slips out past an edge
       (the back layer), then turns and climbs back over the edge onto the
       face (the front layer). Computed once per size and settings. */

    var EDGES = [["top", 0.16], ["bottom", 0.34], ["right", 0.5], ["top", 0.72], ["bottom", 0.84], ["left", 0.45], ["top", 0.44], ["bottom", 0.6], ["top", 0.9], ["bottom", 0.12]];

    var SHAPES = {
      ruffled: [[9, 1, 0.4], [7, 0.72, 0.42], [5, 0.45, 0.4]],
      soft: [[7, 1, 0.42], [5, 0.62, 0.4]],
      wide: [[5, 1, 0.5], [3, 0.62, 0.42]],
      slender: [[6, 1.15, 0.24], [3, 0.6, 0.3]],
    };

    function plan(W, H, tw, C, MX, MY) {
      var R = rng(C.seed), CW = W + MX * 2, CH = H + MY * 2, bx = MX, by = MY;
      var inside = function (x, y, m) { m = m || 0; return x > bx + m && x < bx + W - m && y > by + m && y < by + H - m; };
      var text = { x: bx + W / 2, y: by + H / 2, rx: tw / 2 + 12, ry: H * 0.28 };
      var branches = [], leaves = [], flowers = [];
      var speed = BASE_SPEED * clamp(C.speed, 0.2, 4);
      var kinds = (C.flowers || []).filter(function (f) { return f && (f.weight == null || f.weight > 0); });
      var weightSum = kinds.reduce(function (s, f) { return s + (f.weight == null ? 1 : f.weight); }, 0);
      var pick = function () {
        var r = R() * weightSum;
        for (var i = 0; i < kinds.length; i++) { r -= kinds[i].weight == null ? 1 : kinds[i].weight; if (r <= 0) return kinds[i]; }
        return kinds[kinds.length - 1];
      };

      function walk(x, y, a, len, w, depth, birth, kind, way, layer) {
        var state = layer == null ? 0 : 3, f = layer == null ? 0 : layer, wi = 0;
        var pts = [{ x: x, y: y, a: a, f: f, h: inside(x, y) && f === 0 }];
        var ph = R() * TAU, fr = 0.06 + R() * 0.08, amp = 0.1 + R() * 0.1, curl = R() < 0.5 ? -1 : 1;
        for (var i = 1; i < len; i++) {
          var t = Math.sin(ph + i * fr) * amp * 0.3 + (R() - 0.5) * 0.08;
          var steering = way && wi < way.length;
          if (steering) {
            var q = way[wi];
            t += diff(Math.atan2(q[1] - y, q[0] - x), a) * 0.2;
            if (Math.hypot(q[0] - x, q[1] - y) < 8) wi++;
          }
          if (state !== 0) {
            var dx = (x - text.x) / text.rx, dy = (y - text.y) / text.ry, dd = dx * dx + dy * dy;
            if (dd < 1.7) t += diff(Math.atan2(y - text.y, x - text.x), a) * 0.22 * (1.7 - dd);
          }
          var mx = Math.min(22, MX * 0.5), ex = Math.max(mx - x, x - (CW - mx), 22 - y, y - (CH - 22));
          if (ex > 0) t += diff(Math.atan2(CH / 2 - y, CW / 2 - x), a) * Math.min(0.45, 0.12 + ex * 0.03);
          if (!steering && f === 1 && inside(x, y, 3)) { var along = Math.abs(diff(0, a)) < Math.PI / 2 ? 0 : Math.PI; t += diff(along, a) * 0.08; }
          if (kind === "tendril") t += curl * Math.pow(i / len, 2.2) * 0.65;
          a += Math.max(-0.35, Math.min(0.35, t));
          x += Math.cos(a) * STEP; y += Math.sin(a) * STEP;
          if (state === 0 && !inside(x, y)) state = 1;
          else if (state === 1 && inside(x, y, 1.5)) { state = 2; f = 1; }
          pts.push({ x: x, y: y, a: a, f: f, h: f === 0 && inside(x, y) });
        }
        var b = { pts: pts, w: w, birth: birth, dur: (len * STEP) / speed, depth: depth, kind: kind, thorns: depth === 0 && C.thorns };
        branches.push(b);

        if (kind !== "tendril" && C.leaves > 0) {
          var side = R() < 0.5 ? 1 : -1, gap = 1 / clamp(C.leaves, 0.1, 3);
          for (var j = Math.round((8 + R() * 7) * gap); j < len - 4; j += Math.max(3, Math.round((8 + R() * 9) * gap))) {
            if (pts[j].h) continue;
            side = -side;
            leaves.push({ b: b, i: j, side: side, L: (7 + R() * 6) * (0.6 + (w / 3) * 0.5), droop: (R() - 0.3) * 0.5 });
          }
        }
        if (depth < 2) {
          var kids = depth === 0 ? 2 + ((R() * 2) | 0) : R() < 0.6 ? 1 : 0;
          for (var k = 0; k < kids; k++) {
            var bi = Math.floor(len * (0.35 + R() * 0.5)), tries = 0;
            while (pts[bi].h && tries++ < 8) bi = Math.floor(len * (0.35 + R() * 0.5));
            if (pts[bi].h) continue;
            var p = pts[bi], kk = R() < (depth === 0 ? 0.35 : 0.6) ? "tendril" : "stem";
            walk(p.x, p.y, p.a + (R() < 0.5 ? -1 : 1) * (0.6 + R() * 0.6), Math.max(10, Math.min(40, Math.floor((len - bi) * (0.3 + R() * 0.3)))),
              w * 0.58, depth + 1, birth + (bi * STEP) / speed, kk, null, p.f);
          }
        }
        var tip = pts[pts.length - 1], tx = (tip.x - text.x) / (text.rx + 16), ty = (tip.y - text.y) / (text.ry + 12);
        var room = Math.min(tip.x, CW - tip.x, tip.y, CH - tip.y);
        var ok = !tip.h && tx * tx + ty * ty > 1.15 && room > 12;
        var big = room > (depth === 0 ? 20 : 14);
        var bloomChance = depth === 0 ? clamp(C.blooms, 0, 1) : depth === 1 ? 0.4 * clamp(C.blooms, 0, 2) : 0;
        if (kind === "stem" && ok && big && kinds.length && R() < bloomChance) {
          var def = pick(), shape = SHAPES[def.shape] || SHAPES.ruffled;
          var r = (depth === 0 ? 13 + R() * 7 : 8 + R() * 4) * clamp(C.bloomSize, 0.3, 2.5);
          var petals = [], spots = [], stamens = [];
          shape.forEach(function (L, li) {
            var off = R() * TAU;
            for (var n = 0; n < L[0]; n++) {
              petals.push({ li: li, ang: off + (n * TAU) / L[0] + (R() - 0.5) * 0.4, len: L[1] * (0.76 + R() * 0.34), w: L[2] + R() * 0.12, bend: (R() - 0.5) * 0.55, curl: R() * 0.24 });
            }
          });
          if (def.speckles) for (var s = 0; s < 16; s++) { var sa = R() * TAU, sd = r * (0.12 + R() * 0.38); spots.push([Math.cos(sa) * sd, Math.sin(sa) * sd, 0.35 + R() * 0.7]); }
          if (def.stamens) for (var m = 0; m < 6; m++) stamens.push([R() * TAU, 0.8 + R() * 0.45, (R() - 0.5) * 0.8]);
          flowers.push({ x: tip.x, y: tip.y, a: tip.a, r: r, birth: birth + b.dur - 160, def: def, nl: shape.length, petals: petals, spots: spots, stamens: stamens, f: tip.f });
        } else if (kind === "stem" && ok && C.buds && R() < 0.6) {
          flowers.push({ x: tip.x, y: tip.y, a: tip.a, r: (3.5 + R() * 2) * clamp(C.bloomSize, 0.5, 2), birth: birth + b.dur - 80, bud: true, def: kinds.length ? pick() : null, f: tip.f });
        }
      }

      var cx = function (x) { return Math.max(bx + 7, Math.min(bx + W - 7, x)); };
      var cy = function (y) { return Math.max(by + 6, Math.min(by + H - 6, y)); };
      EDGES.slice(0, clamp(Math.round(C.vines), 1, EDGES.length)).forEach(function (e, i) {
        var edge = e[0], u = e[1];
        var n = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[edge];
        var tg = [-n[1], n[0]], sgn = R() < 0.5 ? 1 : -1;
        var E = edge === "top" ? [bx + W * u, by] : edge === "bottom" ? [bx + W * u, by + H] : edge === "left" ? [bx, by + H * u] : [bx + W, by + H * u];
        var side = edge === "left" || edge === "right";
        var out = Math.min(12 + R() * 16, (side ? MX : MY) * 0.75), slide = side ? 10 + R() * 14 : 16 + R() * 22;
        var S = [E[0] - n[0] * 12, E[1] - n[1] * 12];
        var O = [E[0] + n[0] * out + tg[0] * sgn * slide, E[1] + n[1] * out + tg[1] * sgn * slide];
        var bk = side ? 16 + R() * 14 : 8 + R() * 6, slide2 = side ? 18 + R() * 10 : 34 + R() * 26;
        var Ri = [cx(E[0] - n[0] * bk + tg[0] * sgn * slide2), cy(E[1] - n[1] * bk + tg[1] * sgn * slide2)];
        var A = side ? [cx(E[0] - n[0] * (W * 0.25)), cy(by + H * (R() < 0.5 ? 0.18 : 0.82))] : [cx(Ri[0] + tg[0] * sgn * (40 + R() * 50)), cy(Ri[1])];
        var a0 = Math.atan2(n[1], n[0]) + sgn * (0.35 + R() * 0.3);
        walk(S[0], S[1], a0, Math.round((70 + ((R() * 28) | 0)) * clamp(C.length, 0.4, 2)), (1.8 + R() * 0.8) * clamp(C.thickness, 0.3, 3), 0, (i * 85 + R() * 60) / clamp(C.speed, 0.2, 4), "stem", [O, Ri, A], null);
      });

      var total = 0;
      branches.forEach(function (b) { total = Math.max(total, b.birth + b.dur); });
      flowers.forEach(function (f) { total = Math.max(total, f.birth + BLOOM_MS); });
      return { branches: branches, leaves: leaves, flowers: flowers, total: total, CW: CW, CH: CH, MX: MX, MY: MY };
    }

    /* ------------------------------------------------------------ painting */

    function palette(C) {
      var stem = rgb(C.colors.stem), leaf = rgb(C.colors.leaf);
      return {
        stemDark: mix(stem, BLACK, 0.72),
        stemLight: stem,
        leaf: [css(mix(leaf, BLACK, 0.62)), css(leaf), css(mix(leaf, WHITE, 0.25))],
        vein: css(mix(leaf, BLACK, 0.75)),
      };
    }

    function flowerStops(def, li) {
      var petal = rgb(def.petal), tip = rgb(def.tip), centre = rgb(def.centre), dk = li * 0.2;
      return [
        css(mix(centre, petal, 0.25), 0.98),
        css(mix(petal, BLACK, dk), 0.95),
        css(mix(mix(petal, tip, 0.55), BLACK, dk), 0.82),
        css(mix(tip, BLACK, dk * 0.8), 0.55),
      ];
    }

    function drawStems(ctx, P, T, L, pal) {
      P.branches.forEach(function (b) {
        var len = b.pts.length, n = ease(clamp((T - b.birth) / b.dur)) * (len - 1);
        if (n <= 0) return;
        for (var i = 0; i < n; i++) {
          var p = b.pts[i], q = b.pts[Math.min(i + 1, len - 1)], f = Math.min(1, n - i);
          if (p.f !== L || p.h) continue;
          var ex = p.x + (q.x - p.x) * f, ey = p.y + (q.y - p.y) * f;
          var w = b.w * (1 - (i / len) * 0.7);
          w *= clamp((n - i) / 7, 0.18, 1);
          ctx.lineWidth = w;
          ctx.strokeStyle = css(mix(pal.stemDark, pal.stemLight, Math.min(1, (i / len) * 1.15)));
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ex, ey); ctx.stroke();
          if (w > 1.2) {
            var nx = -Math.sin(p.a) * w * 0.22, ny = Math.cos(p.a) * w * 0.22;
            ctx.lineWidth = w * 0.3; ctx.strokeStyle = "rgba(255,255,255,.16)";
            ctx.beginPath(); ctx.moveTo(p.x - nx, p.y - ny); ctx.lineTo(ex - nx, ey - ny); ctx.stroke();
          }
          if (b.thorns && i % 9 === 5 && i < n - 3) {
            var s = i % 18 === 5 ? 1 : -1, ta = p.a + s * 1.9, tl = w * 1.4 + 1;
            ctx.fillStyle = css(mix(pal.stemDark, pal.stemLight, 0.25));
            ctx.beginPath();
            ctx.moveTo(p.x + Math.cos(p.a) * w * 0.6, p.y + Math.sin(p.a) * w * 0.6);
            ctx.lineTo(p.x + Math.cos(ta) * tl, p.y + Math.sin(ta) * tl);
            ctx.lineTo(p.x - Math.cos(p.a) * w * 0.6, p.y - Math.sin(p.a) * w * 0.6);
            ctx.fill();
          }
        }
      });
    }

    function drawLeaves(ctx, P, T, L, pal) {
      P.leaves.forEach(function (l) {
        if (l.b.pts[l.i].f !== L) return;
        var b = l.b, len = b.pts.length, n = ease(clamp((T - b.birth) / b.dur)) * (len - 1);
        var g = clamp((n - l.i) / 12);
        if (g <= 0) return;
        var p = b.pts[l.i], s = back(g), Ln = l.L;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.a + l.side * (0.8 + l.droop)); ctx.scale(s, s * l.side);
        var gr = ctx.createLinearGradient(0, 0, Ln, 0);
        gr.addColorStop(0, pal.leaf[0]); gr.addColorStop(0.6, pal.leaf[1]); gr.addColorStop(1, pal.leaf[2]);
        ctx.fillStyle = gr; ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(Ln * 0.28, -Ln * 0.42, Ln * 0.78, -Ln * 0.32, Ln, 0);
        ctx.bezierCurveTo(Ln * 0.72, Ln * 0.18, Ln * 0.3, Ln * 0.3, 0, 0); ctx.fill();
        ctx.globalAlpha = 0.4; ctx.strokeStyle = pal.vein; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(Ln * 0.05, 0); ctx.quadraticCurveTo(Ln * 0.5, -Ln * 0.06, Ln * 0.95, 0); ctx.stroke();
        ctx.restore();
      });
    }

    function petalPath(ctx, l, w, bend, curl) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(l * 0.12, -l * w * 1.15, l * 0.7, -l * w * (1.1 - curl), l, l * bend * 0.25);
      ctx.bezierCurveTo(l * 0.78, l * w * (0.75 + curl), l * 0.2, l * w * 0.95, 0, 0);
    }

    function drawFlowers(ctx, P, T, L, C) {
      P.flowers.forEach(function (f) {
        if (f.f !== L) return;
        var t = clamp((T - f.birth) / BLOOM_MS);
        if (t <= 0) return;
        var o = ease(t), r = f.r, def = f.def;
        ctx.save(); ctx.translate(f.x, f.y);
        if (f.bud) {
          var bs = back(t);
          ctx.rotate(f.a); ctx.scale(bs, bs);
          var bg = ctx.createLinearGradient(0, 0, r * 2, 0);
          bg.addColorStop(0, C.colors.leaf);
          bg.addColorStop(0.5, def ? def.petal : C.colors.stem);
          bg.addColorStop(1, def ? def.tip : C.colors.leaf);
          ctx.fillStyle = bg; petalPath(ctx, r * 2, 0.38, 0, 0); ctx.fill();
          ctx.restore(); return;
        }
        if (C.haze) {
          var hz = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.7), hc = mix(rgb(def.petal), rgb(def.tip), 0.5);
          hz.addColorStop(0, css(hc, 0.32)); hz.addColorStop(1, css(hc, 0));
          ctx.globalAlpha = o; ctx.fillStyle = hz; ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        }
        for (var li = 0; li < f.nl; li++) {
          var stops = flowerStops(def, li), lo = clamp(o * 1.15 - li * 0.12);
          f.petals.forEach(function (p) {
            if (p.li !== li) return;
            var closed = f.a + (p.ang - Math.PI) * 0.12, ang = closed + diff(p.ang, closed) * lo, l = r * p.len * (0.3 + 0.7 * lo);
            ctx.save(); ctx.rotate(ang);
            var g = ctx.createRadialGradient(0, 0, 0, 0, 0, l);
            g.addColorStop(0, stops[0]); g.addColorStop(0.32, stops[1]); g.addColorStop(0.75, stops[2]); g.addColorStop(1, stops[3]);
            ctx.fillStyle = g; petalPath(ctx, l, p.w * (0.55 + 0.45 * lo), p.bend, p.curl); ctx.fill();
            ctx.globalAlpha = 0.3 * lo; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 0.45;
            ctx.beginPath(); ctx.moveTo(l * 0.15, 0); ctx.quadraticCurveTo(l * 0.5, l * p.bend * 0.1, l * 0.85, l * p.bend * 0.2); ctx.stroke();
            ctx.globalAlpha = 1; ctx.restore();
          });
        }
        var so = clamp((o - 0.45) / 0.55);
        if (so > 0) {
          var centre = rgb(def.centre), cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.34);
          cg.addColorStop(0, css(centre, 0.95)); cg.addColorStop(0.6, css(centre, 0.5)); cg.addColorStop(1, css(centre, 0));
          ctx.globalAlpha = so; ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, TAU); ctx.fill();
          if (def.speckles) {
            ctx.fillStyle = def.speckles;
            f.spots.forEach(function (sp) { ctx.beginPath(); ctx.arc(sp[0] * so, sp[1] * so, sp[2], 0, TAU); ctx.fill(); });
          }
          if (def.stamens) {
            var anther = css(mix(rgb(def.stamens), BLACK, 0.55));
            f.stamens.forEach(function (st) {
              var l2 = r * st[1] * so, ex = Math.cos(st[0]) * l2, ey = Math.sin(st[0]) * l2;
              ctx.strokeStyle = def.stamens; ctx.lineWidth = 0.7;
              ctx.beginPath(); ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(Math.cos(st[0] + st[2]) * l2 * 0.55, Math.sin(st[0] + st[2]) * l2 * 0.55, ex, ey); ctx.stroke();
              ctx.fillStyle = anther; ctx.beginPath(); ctx.ellipse(ex, ey, 1.5, 0.8, st[0], 0, TAU); ctx.fill();
            });
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      });
    }

    /* ------------------------------------------------------------ mount */

    var RADII = { pill: "999px", rounded: "14px", square: "4px" };
    var STRUCTURAL = ["vines", "reach", "length", "thickness", "leaves", "blooms", "bloomSize", "buds", "thorns", "speed", "seed", "flowers"];

    function mount(el, options) {
      if (!el) throw new Error("VineCTA.mount needs an element");
      injectStyles();
      var C = merge(DEFAULTS, options || {});
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

      el.classList.add("vine-cta");
      var label = el.querySelector(".vine-cta__label");
      if (!label) {
        label = document.createElement("span");
        label.className = "vine-cta__label";
        while (el.firstChild) label.appendChild(el.firstChild);
        el.appendChild(label);
      }
      var face = document.createElement("span");
      face.className = "vine-cta__face"; face.setAttribute("aria-hidden", "true");
      var backC = document.createElement("canvas"), frontC = document.createElement("canvas");
      backC.className = "vine-cta__canvas vine-cta__canvas--back";
      frontC.className = "vine-cta__canvas vine-cta__canvas--front";
      backC.setAttribute("aria-hidden", "true"); frontC.setAttribute("aria-hidden", "true");
      el.insertBefore(face, el.firstChild);
      el.insertBefore(backC, face);
      el.appendChild(frontC);
      var iconWrap = null;

      var layer = document.createElement("canvas"), lc = layer.getContext("2d");
      var sheets = [{ c: backC, ctx: backC.getContext("2d") }, { c: frontC, ctx: frontC.getContext("2d") }];
      var P = null, pal = palette(C), dpr = 1, T = 0, target = 0, last = 0, raf = 0, lastPointer = "mouse", timer = 0, dead = false;

      function applyLook() {
        var g = rgb(C.colors.glow);
        el.style.setProperty("--vc-button", C.colors.button);
        el.style.setProperty("--vc-pressed", C.colors.pressed);
        el.style.setProperty("--vc-text", C.colors.text);
        el.style.setProperty("--vc-glow", css(g, 0.28));
        el.style.setProperty("--vc-ring", C.colors.glow);
        el.style.setProperty("--vc-radius", RADII[C.shape] || RADII.pill);
        if (C.font) el.style.setProperty("--vc-font", C.font); else el.style.removeProperty("--vc-font");
        if (C.icon && !iconWrap) {
          iconWrap = document.createElement("span");
          iconWrap.style.display = "inline-flex";
          iconWrap.innerHTML = ICONS;
          label.insertBefore(iconWrap, label.firstChild);
        } else if (!C.icon && iconWrap) { iconWrap.remove(); iconWrap = null; }
        pal = palette(C);
      }

      function layout() {
        var W = el.offsetWidth, H = el.offsetHeight;
        if (!W) return;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        var rect = el.getBoundingClientRect();
        var free = Math.min(rect.left, document.documentElement.clientWidth - rect.right);
        var MX = Math.max(18, Math.min(74 * clamp(C.reach, 0.3, 2), free - 4));
        var MY = Math.max(20, 58 * clamp(C.reach, 0.3, 2));
        P = plan(W, H, label.offsetWidth, C, MX, MY);
        layer.width = P.CW * dpr; layer.height = P.CH * dpr;
        sheets.forEach(function (s) {
          s.c.style.left = -P.MX + "px"; s.c.style.top = -P.MY + "px";
          s.c.style.width = P.CW + "px"; s.c.style.height = P.CH + "px";
          s.c.width = P.CW * dpr; s.c.height = P.CH * dpr;
        });
        if (T > P.total) T = P.total;
        paint();
      }

      function paint() {
        if (!P) return;
        var shadow = mix(rgb(C.colors.button), BLACK, 0.6);
        sheets.forEach(function (s, L) {
          lc.setTransform(dpr, 0, 0, dpr, 0, 0); lc.clearRect(0, 0, P.CW, P.CH);
          lc.lineCap = "round"; lc.lineJoin = "round";
          if (T > 0) { drawStems(lc, P, T, L, pal); drawLeaves(lc, P, T, L, pal); drawFlowers(lc, P, T, L, C); }
          var ctx = s.ctx;
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, s.c.width, s.c.height);
          ctx.shadowColor = css(shadow, L ? 0.6 : 0.32);
          ctx.shadowBlur = (L ? 6 : 5) * dpr; ctx.shadowOffsetX = 1.5 * dpr; ctx.shadowOffsetY = (L ? 3 : 2) * dpr;
          ctx.drawImage(layer, 0, 0);
        });
      }

      function tick(now) {
        if (dead) return;
        var dt = Math.min(48, now - last); last = now;
        if (reduce.matches) T = target ? P.total : 0;
        else if (target) T = Math.min(P.total, T + dt);
        else T = Math.max(0, T - (dt * P.total) / RETRACT_MS);
        paint();
        raf = (target && T < P.total) || (!target && T > 0) ? requestAnimationFrame(tick) : 0;
      }
      function go(on) {
        target = on ? 1 : 0;
        if (!raf && P) { last = performance.now(); raf = requestAnimationFrame(tick); }
      }
      function bloom(on) {
        if (on) { el.classList.add("is-bloom"); go(1); }
        else if (!el.classList.contains("is-done") && C.retract) { el.classList.remove("is-bloom"); go(0); }
      }

      var handlers = [
        ["pointerenter", function (e) { if (e.pointerType !== "touch") bloom(true); }],
        ["pointerleave", function (e) { if (e.pointerType !== "touch") bloom(false); }],
        ["pointerdown", function (e) { lastPointer = e.pointerType; if (e.pointerType === "touch") bloom(true); }],
        ["focus", function () { if (el.matches(":focus-visible")) bloom(true); }],
        ["blur", function () { bloom(false); }],
        ["click", function (e) {
          var first = !el.classList.contains("is-done");
          el.classList.add("is-done"); bloom(true);
          if (el.hasAttribute("data-demo")) { e.preventDefault(); return; }
          // on touch screens growth only starts at the tap, so let it bloom before the link opens
          if (first && lastPointer === "touch") { e.preventDefault(); timer = setTimeout(function () { el.click(); }, 1100); }
        }],
      ];
      handlers.forEach(function (h) { el.addEventListener(h[0], h[1]); });

      var ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(layout) : null;
      if (ro) ro.observe(el);
      window.addEventListener("resize", layout);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!dead) layout(); });
      applyLook();
      layout();

      return {
        element: el,
        get options() { return JSON.parse(JSON.stringify(C)); },
        update: function (next) {
          var prev = C;
          C = merge(C, next || {});
          if (next && next.colors) C.colors = merge(prev.colors, next.colors);
          applyLook();
          var structural = STRUCTURAL.some(function (k) { return next && k in next && JSON.stringify(next[k]) !== JSON.stringify(prev[k]); });
          if (structural || (next && "icon" in next) || (next && "font" in next)) layout(); else paint();
        },
        show: function () { el.classList.add("is-bloom"); T = P ? P.total : 0; target = 1; paint(); },
        replay: function () { el.classList.remove("is-done"); el.classList.add("is-bloom"); T = 0; go(1); },
        reset: function () { el.classList.remove("is-bloom", "is-done"); go(0); },
        destroy: function () {
          dead = true; cancelAnimationFrame(raf); clearTimeout(timer);
          if (ro) ro.disconnect();
          window.removeEventListener("resize", layout);
          handlers.forEach(function (h) { el.removeEventListener(h[0], h[1]); });
          face.remove(); backC.remove(); frontC.remove(); if (iconWrap) iconWrap.remove();
          el.classList.remove("is-bloom", "is-done");
        },
      };
    }

    return { mount: mount, defaults: DEFAULTS, presets: PRESETS, version: "1.0.0" };
  }

  var api = factory();
  // The engine's own source, so a page can hand out a self-contained copy of it.
  api.source = "(" + factory.toString() + ")()";
  root.VineCTA = api;
})(typeof window !== "undefined" ? window : this);
