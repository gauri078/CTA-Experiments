/*!
 * Disco Button, part of cta-experiments by Gauri Tsering Sharma.
 *
 * Hover the button and a mirror ball drops in above it and starts to spin.
 * The rest of the page dims, and every spot of light the ball throws reveals
 * the page underneath at full colour as it sweeps past. Click it and the ball
 * keeps turning until the file has downloaded, for at least a couple of seconds.
 *
 * Usage:
 *   <a class="disco-button" href="/resume.pdf" download>
 *     <span class="disco-button__label">Download resume</span>
 *   </a>
 *   <script src="disco-button.js"></script>
 *   <script>DiscoButton.mount(document.querySelector(".disco-button"), { ...options });</script>
 *
 * Every option is listed in DEFAULTS below. Anything you leave out falls back to it.
 * No dependencies. Respects prefers-reduced-motion.
 */
(function (root) {
  function factory() {
    "use strict";

    /* ------------------------------------------------------------ options */

    var DEFAULTS = {
      icon: true, // download arrow in its own box on the right, turns into a tick once done
      shape: "square", // "square" | "rounded" | "pill"
      font: "", // CSS font-family for the label; empty uses a monospace stack
      colors: {
        button: "#f2eee6", // button face at rest
        text: "#0b0b0b", // label colour at rest
        border: "#0b0b0b", // outline and icon divider at rest
        light: "#f2f2f0", // colour of the light spots and beams
        accent: "#ff5c9e", // the occasional coloured tile, and the button's outer glow
      },
      ballSize: 52, // ball radius in px (a bit smaller on phones)
      speed: 1, // how fast the ball turns, 0 to 3
      tiles: 26, // rows of mirror tiles; more rows means smaller tiles and more spots
      sparkle: 1, // how often single tiles glint, 0 to 1.5
      hang: 34, // gap between the ball and the top of the button, px
      string: true, // draw the string the ball hangs from
      spots: 72, // most light spots on screen at once (halved on phones)
      spotSize: 1, // spot size multiplier, 0.4 to 2.5
      spread: 0.3, // how far the spots fly from the ball, 0.12 to 0.7
      accentShare: 0.06, // share of tiles that throw accent-coloured light, 0 to 1
      beams: 0.14, // strength of the light shafts through the haze, 0 to 0.6
      glow: 0.08, // soft glow around each spot, 0 to 0.4
      haze: 0.16, // glow around the ball itself, 0 to 0.6
      spotlight: 0.14, // cone of light from the ball onto the button, 0 to 0.5
      buttonGlow: 0.6, // halo around the lit button, 0 to 1.5
      flashes: true, // now and then a beam hits the "lens" and the scene flares
      flashEvery: 4.5, // roughly how often, in seconds
      dim: 0.62, // how dark the page goes, 0 to 0.95
      colourLeft: 0, // how much colour the dimmed page keeps, 0 (grey) to 1
      blur: 0.6, // blur on the dimmed page, px
      pool: 0.75, // pool of light around the button, 0 to 1
      minDuration: 2, // after a click, keep spinning at least this long, in seconds
      fadeIn: 260, // ms
      fadeOut: 340, // ms
      busyText: "Downloading…", // label while downloading; "" keeps the label
      doneText: "Downloaded", // label once done; "" keeps the label
    };

    var PRESETS = {
      // the monochrome look from Gauri's portfolio
      studio: {},
      // cool blue spots, like light off a club ball
      ice: { colors: { light: "#dcebff", accent: "#5e9bff" }, accentShare: 0.2, dim: 0.74, beams: 0.24, haze: 0.26, spread: 0.34 },
      // warm and soft, keeps a little of the page's colour
      gold: { colors: { light: "#ffe9b8", accent: "#ffb347" }, accentShare: 0.14, speed: 0.7, dim: 0.55, colourLeft: 0.25, beams: 0.12, spotlight: 0.2 },
    };

    /* ------------------------------------------------------------ helpers */

    var TAU = Math.PI * 2;
    var CSS_ID = "disco-button-css";
    var CSS = [
      ".disco-button{--db-bg:#f2eee6;--db-fg:#0b0b0b;--db-line:#0b0b0b;--db-accent:#ff5c9e;--db-glow:.6;--db-radius:0px;",
      "position:relative;z-index:70;display:inline-grid;grid-template-columns:1fr 44px;align-items:stretch;min-width:240px;",
      "border:1px solid var(--db-line);border-radius:var(--db-radius);background:var(--db-bg);color:var(--db-fg);",
      "font:500 11.5px/1 var(--db-font,ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace);letter-spacing:.06em;text-transform:uppercase;",
      "text-decoration:none;cursor:pointer;padding:0;overflow:hidden;-webkit-tap-highlight-color:transparent;",
      "transition:box-shadow .5s,background-color .3s,color .3s,border-color .3s}",
      ".disco-button.no-icon{grid-template-columns:1fr}",
      ".disco-button__label{display:block;padding:14px 16px;text-align:center}",
      ".disco-button__icon{display:grid;place-items:center;border-left:1px solid var(--db-line);transition:border-color .3s}",
      ".disco-button__icon svg{width:15px;height:15px;transition:transform .3s}",
      ".disco-button:hover .disco-button__icon svg,.disco-button.is-lit .disco-button__icon svg{transform:translateY(2px)}",
      ".disco-button .db-check{display:none}.disco-button.is-done .db-arrow{display:none}.disco-button.is-done .db-check{display:block}",
      ".disco-button.is-lit{background:#fff;color:#0b0b0b;border-color:#fff;",
      "box-shadow:0 0 0 1px rgba(255,255,255,.7),0 0 36px 6px rgba(255,255,255,calc(.55 * var(--db-glow))),",
      "0 0 110px 28px color-mix(in srgb,var(--db-accent) calc(30% * var(--db-glow)),transparent)}",
      ".disco-button.is-lit .disco-button__icon{border-color:#0b0b0b}",
      ".disco-button:focus-visible{outline:2px solid var(--db-accent);outline-offset:3px}",
    ].join("");
    var ICON =
      '<svg class="db-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M8 2v10M3.5 7.5L8 12l4.5-4.5M2 14.5h12"/></svg>' +
      '<svg class="db-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';

    function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
    function merge(a, b) {
      var out = JSON.parse(JSON.stringify(a));
      Object.keys(b || {}).forEach(function (k) { out[k] = isObj(b[k]) && isObj(out[k]) ? merge(out[k], b[k]) : JSON.parse(JSON.stringify(b[k])); });
      return out;
    }
    function hex(h) {
      h = String(h || "").replace("#", "");
      if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
      var n = parseInt(h, 16) || 0;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function norm(x, y, z) { var l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; }
    function N(lat, lon, th) { return [Math.cos(lat) * Math.sin(lon + th), Math.sin(lat), Math.cos(lat) * Math.cos(lon + th)]; }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    // two hidden spotlights behind the ball (on the page side), aimed back toward the viewer
    var LIGHTS = [norm(0.22, -0.32, 1), norm(-0.38, -0.12, 1)];
    // a front key light so the ball itself shows highlights to the camera
    var KEY = norm(-0.45, 0.55, 1);
    var HALF = norm(KEY[0], KEY[1], KEY[2] + 1);

    /* ------------------------------------------------------------ mount
       env (optional, not part of the copyable options):
         container: an element to keep the effect inside (defaults to the whole page)
         action:    a function returning a promise, run on click instead of the download
         hoverOnly: true to leave clicks alone (for previews inside a link, like a gallery card)
         onState:   called with "rest", "hover", "downloading", "holding", "pinned", "fading out" or "done" */
    function mount(el, options, env) {
      if (!el) throw new Error("DiscoButton.mount needs an element");
      env = env || {};
      var C = merge(DEFAULTS, options || {});
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

      if (!document.getElementById(CSS_ID)) {
        var st = document.createElement("style"); st.id = CSS_ID; st.textContent = CSS; document.head.appendChild(st);
      }
      el.classList.add("disco-button");
      var labelEl = el.querySelector(".disco-button__label");
      if (!labelEl) { labelEl = document.createElement("span"); labelEl.className = "disco-button__label"; labelEl.textContent = el.textContent.trim() || "Download"; el.textContent = ""; el.appendChild(labelEl); }
      var restText = labelEl.textContent;
      var iconEl = null;

      var container = env.container || document.body;
      var fixed = container === document.body || container === document.documentElement;
      function layer(tag, z) {
        var e = document.createElement(tag);
        e.setAttribute("aria-hidden", "true");
        e.style.cssText = "position:" + (fixed ? "fixed" : "absolute") + ";left:0;top:0;width:100%;height:100%;pointer-events:none;display:none;z-index:" + z;
        return e;
      }
      var dim = layer("div", 50), glow = layer("canvas", 51), top = layer("canvas", 72);
      glow.style.mixBlendMode = "screen";
      dim.style.webkitMaskRepeat = "no-repeat"; dim.style.maskRepeat = "no-repeat";
      dim.style.maskComposite = "intersect"; dim.style.webkitMaskComposite = "source-in";
      if (!fixed && getComputedStyle(container).position === "static") container.style.position = "relative";
      container.appendChild(dim); container.appendChild(glow); container.appendChild(top);
      var gctx = glow.getContext("2d"), bctx = top.getContext("2d");

      /* mirror-ball tiles: rows of squares on a sphere */
      var tiles = [];
      function build() {
        tiles = [];
        var ROWS = Math.max(6, Math.round(C.tiles));
        for (var i = 0; i < ROWS; i++) {
          var lat0 = -Math.PI / 2 + (i / ROWS) * Math.PI, lat1 = -Math.PI / 2 + ((i + 1) / ROWS) * Math.PI, lat = (lat0 + lat1) / 2;
          var n = Math.max(4, Math.round(2 * ROWS * Math.cos(lat))), off = Math.random() * TAU;
          for (var j = 0; j < n; j++) {
            var lon0 = off + (j / n) * TAU, lon1 = off + ((j + 1) / n) * TAU;
            tiles.push({ lat: lat, lat0: lat0, lat1: lat1, lon: (lon0 + lon1) / 2, lon0: lon0, lon1: lon1, r: Math.random(),
              ph: Math.random() * TAU, sp: 0.6 + Math.random() * 1.8, jx: (Math.random() - 0.5) * 0.03, jy: (Math.random() - 0.5) * 0.03 });
          }
        }
      }
      var rgbLight = [242, 242, 240], rgbAcc = [255, 92, 158];
      function tint(T) { return T.r < C.accentShare ? rgbAcc : rgbLight; }

      function drawBall(ctx, cx, cy, R, th, t) {
        var body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
        body.addColorStop(0, "#3c3c3c"); body.addColorStop(1, "#0a0a0a");
        ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
        var inset = 0.14, base = [38, 38, 40];
        for (var k = 0; k < tiles.length; k++) {
          var T = tiles[k], n = N(T.lat, T.lon, th);
          if (n[2] <= 0.02) continue;
          var la0 = T.lat0 + (T.lat1 - T.lat0) * inset, la1 = T.lat1 - (T.lat1 - T.lat0) * inset;
          var lo0 = T.lon0 + (T.lon1 - T.lon0) * inset, lo1 = T.lon1 - (T.lon1 - T.lon0) * inset;
          var c = [[la0, lo0], [la0, lo1], [la1, lo1], [la1, lo0]].map(function (q) { var p = N(q[0], q[1], th); return [cx + R * p[0], cy - R * p[1]]; });
          var spec = Math.pow(Math.max(n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2], 0), 70);
          var env2 = 0.16 + 0.36 * Math.max(0, n[1] * 0.6 + 0.4) * n[2];
          var tw = Math.pow(Math.max(0, Math.sin(t * T.sp + T.ph + th * 6)), 24) * 0.9 * C.sparkle;
          var kk = Math.min(1, env2 + spec * 1.3 + tw), col = tint(T);
          ctx.fillStyle = "rgb(" + ((base[0] + (col[0] - base[0]) * kk) | 0) + "," + ((base[1] + (col[1] - base[1]) * kk) | 0) + "," + ((base[2] + (col[2] - base[2]) * kk) | 0) + ")";
          ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); for (var q = 1; q < 4; q++) ctx.lineTo(c[q][0], c[q][1]); ctx.closePath(); ctx.fill();
          if (spec > 0.35 || tw > 0.5) {
            var s = R * 0.22 * Math.max(spec, tw), mx = (c[0][0] + c[2][0]) / 2, my = (c[0][1] + c[2][1]) / 2;
            ctx.strokeStyle = "rgba(255,255,255," + 0.75 * Math.max(spec, tw) + ")"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(mx - s, my); ctx.lineTo(mx + s, my); ctx.moveTo(mx, my - s); ctx.lineTo(mx, my + s); ctx.stroke();
          }
        }
        var rim = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.01);
        rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(0,0,0,.55)");
        ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      }

      // each lit tile is a flat mirror: r = d − 2(d·n)n, projected onto the page plane behind the ball
      function spots(th, bx, by, D, W, H) {
        var small = W < 560, k = C.spotSize * (small ? 0.72 : 1), cap = Math.round(C.spots * (small ? 0.5 : 1)), out = [];
        for (var li = 0; li < LIGHTS.length; li++) {
          var L = LIGHTS[li];
          for (var i = 0; i < tiles.length; i++) {
            var T = tiles[i], n = N(T.lat, T.lon, th);
            var dn = L[0] * n[0] + L[1] * n[1] + L[2] * n[2];
            if (dn >= -0.05) continue;
            var rx = L[0] - 2 * dn * n[0] + T.jx, ry = L[1] - 2 * dn * n[1] + T.jy, rz = L[2] - 2 * dn * n[2];
            if (rz > -0.08) continue;
            var t = D / -rz, x = bx + rx * t, y = by - ry * t;
            var s = k * Math.min(50, 11 * Math.pow(t / D, 0.8) + 7);
            if (x < -s || y < -s || x > W + s || y > H + s) continue;
            var a = Math.min(1, -dn * 1.25) * Math.min(1, (-rz - 0.08) * 3.5);
            out.push({ x: x, y: y, w: s * (1 + Math.abs(rx) * 0.5), h: s * (1 + Math.abs(ry) * 0.5), a: a, tint: tint(T) });
          }
        }
        out.sort(function (p, q) { return q.a - p.a; });
        return out.slice(0, cap);
      }

      /* state */
      var hovering = false, pinned = false, busy = false, done = false, minUntil = 0, level = 0, rot = 0, last = 0;
      var flash = 0, nextFlash = 0, running = false, W = 0, H = 0, raf = 0, dead = false, lastState = "";
      function wanted() { return pinned || hovering || busy || performance.now() < minUntil; }
      function rectOf() { return fixed ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } : container.getBoundingClientRect(); }
      function report() {
        var s = busy ? "downloading" : performance.now() < minUntil ? "holding" : pinned ? "pinned" : hovering ? "hover" : running ? "fading out" : done ? "done" : "rest";
        if (s !== lastState) { lastState = s; if (env.onState) env.onState(s); }
      }
      function size() {
        var r = rectOf(), dpr = Math.min(2, window.devicePixelRatio || 1);
        W = r.width; H = r.height;
        [glow, top].forEach(function (c) { c.width = Math.max(1, W * dpr); c.height = Math.max(1, H * dpr); c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); });
      }
      function applyLook() {
        rgbLight = hex(C.colors.light); rgbAcc = hex(C.colors.accent);
        el.style.setProperty("--db-bg", C.colors.button);
        el.style.setProperty("--db-fg", C.colors.text);
        el.style.setProperty("--db-line", C.colors.border);
        el.style.setProperty("--db-accent", C.colors.accent);
        el.style.setProperty("--db-glow", String(C.buttonGlow));
        el.style.setProperty("--db-radius", C.shape === "pill" ? "999px" : C.shape === "rounded" ? "10px" : "0px");
        if (C.font) el.style.setProperty("--db-font", C.font); else el.style.removeProperty("--db-font");
        if (C.icon && !iconEl) { iconEl = document.createElement("i"); iconEl.className = "disco-button__icon"; iconEl.setAttribute("aria-hidden", "true"); iconEl.innerHTML = ICON; el.appendChild(iconEl); }
        if (!C.icon && iconEl) { iconEl.remove(); iconEl = null; }
        el.classList.toggle("no-icon", !C.icon);
        dim.style.background = "rgba(0,0,0," + C.dim + ")";
        var bf = "grayscale(" + (1 - C.colourLeft) + ") brightness(" + Math.max(0.05, 1 - C.dim * 0.9).toFixed(2) + ") blur(" + C.blur + "px)";
        dim.style.backdropFilter = bf; dim.style.webkitBackdropFilter = bf;
      }
      function show() {
        if (running || dead) return;
        running = true; [dim, glow, top].forEach(function (e) { e.style.display = "block"; });
        size(); last = 0; raf = requestAnimationFrame(loop);
      }
      function hide() {
        running = false; [dim, glow, top].forEach(function (e) { e.style.display = "none"; });
        dim.style.opacity = 0; el.classList.remove("is-lit"); report();
      }
      function loop(t) {
        if (!running || dead) return;
        var dt = Math.min(64, last ? t - last : 16); last = t;
        render(t, dt); report();
        if (running) raf = requestAnimationFrame(loop);
      }

      function render(t, dt) {
        var target = wanted() ? 1 : 0;
        level = target ? Math.min(1, level + dt / Math.max(16, C.fadeIn)) : Math.max(0, level - dt / Math.max(16, C.fadeOut));
        if (level === 0 && !target) { hide(); return; }
        el.classList.toggle("is-lit", level > 0.3);
        var Lv = ease(level);
        rot += dt * 0.0006 * C.speed * (reduce.matches ? 0.15 : 1);

        var c = rectOf();
        if (Math.abs(c.width - W) > 0.5 || Math.abs(c.height - H) > 0.5) size();
        var b = el.getBoundingClientRect(), bl = b.left - c.left, bt = b.top - c.top;
        var R = C.ballSize * (W < 560 ? 0.78 : 1), bx = bl + b.width / 2;
        var restY = Math.max(R + 26, bt - R - C.hang);
        var by = -R * 2 + (restY + R * 2) * Lv;
        var sp = spots(rot, bx, by, Math.max(W, H) * C.spread, W, H);

        // the dim layer gets a hole wherever light lands, plus a pool around the button
        var holes = sp.map(function (s) {
          return "radial-gradient(" + s.w.toFixed(1) + "px " + s.h.toFixed(1) + "px at " + s.x.toFixed(1) + "px " + s.y.toFixed(1) + "px, rgba(0,0,0," + (1 - s.a * Lv).toFixed(3) + ") 55%, #000 100%)";
        });
        holes.push("radial-gradient(" + (b.width * 0.85).toFixed(0) + "px " + (b.height * 2.4).toFixed(0) + "px at " + bx.toFixed(0) + "px " + (bt + b.height / 2).toFixed(0) + "px, rgba(0,0,0," + (1 - C.pool * Lv).toFixed(3) + ") 30%, #000 100%)");
        var m = holes.join(",");
        dim.style.webkitMaskImage = m; dim.style.maskImage = m;
        dim.style.opacity = Lv;

        gctx.clearRect(0, 0, W, H);
        gctx.globalCompositeOperation = "lighter";
        sp.forEach(function (s) {
          var col = s.tint.join(",");
          if (C.beams > 0) {
            var ang = Math.atan2(s.y - by, s.x - bx), hw = s.w * 0.55, px = -Math.sin(ang), py = Math.cos(ang);
            var gr = gctx.createLinearGradient(bx, by, s.x, s.y);
            gr.addColorStop(0, "rgba(" + col + "," + C.beams * s.a * Lv + ")"); gr.addColorStop(1, "rgba(" + col + ",0)");
            gctx.fillStyle = gr;
            gctx.beginPath(); gctx.moveTo(bx + px * 1.5, by + py * 1.5); gctx.lineTo(s.x + px * hw, s.y + py * hw);
            gctx.lineTo(s.x - px * hw, s.y - py * hw); gctx.lineTo(bx - px * 1.5, by - py * 1.5); gctx.closePath(); gctx.fill();
          }
          if (C.glow > 0) {
            var halo = gctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.w * 1.2);
            halo.addColorStop(0, "rgba(" + col + "," + C.glow * s.a * Lv + ")"); halo.addColorStop(1, "rgba(" + col + ",0)");
            gctx.fillStyle = halo; gctx.fillRect(s.x - s.w * 1.2, s.y - s.w * 1.2, s.w * 2.4, s.w * 2.4);
            var cw = s.w * 0.42, ch = s.h * 0.32;
            gctx.fillStyle = "rgba(" + col + "," + C.glow * 1.75 * s.a * Lv + ")";
            gctx.beginPath();
            if (gctx.roundRect) gctx.roundRect(s.x - cw / 2, s.y - ch / 2, cw, ch, Math.min(cw, ch) * 0.35); else gctx.rect(s.x - cw / 2, s.y - ch / 2, cw, ch);
            gctx.fill();
          }
        });
        if (C.spotlight > 0) {
          var cy0 = by + R * 0.6, cy1 = bt + b.height;
          var cone = gctx.createLinearGradient(0, cy0, 0, cy1);
          cone.addColorStop(0, "rgba(255,255,255," + C.spotlight * 0.3 * Lv + ")"); cone.addColorStop(1, "rgba(255,255,255," + C.spotlight * Lv + ")");
          gctx.fillStyle = cone;
          gctx.beginPath(); gctx.moveTo(bx - R * 0.25, cy0); gctx.lineTo(bx + R * 0.25, cy0); gctx.lineTo(bl + b.width + 14, cy1); gctx.lineTo(bl - 14, cy1); gctx.closePath(); gctx.fill();
        }
        if (C.haze > 0) {
          var hz = gctx.createRadialGradient(bx, by, R * 0.8, bx, by, R * 5);
          hz.addColorStop(0, "rgba(" + rgbLight.join(",") + "," + C.haze * Lv + ")"); hz.addColorStop(1, "rgba(" + rgbLight.join(",") + ",0)");
          gctx.fillStyle = hz; gctx.fillRect(bx - R * 5, by - R * 5, R * 10, R * 10);
        }
        if (C.flashes && !reduce.matches) {
          if (t > nextFlash && level === 1) { if (nextFlash) flash = 1; nextFlash = t + C.flashEvery * 1000 * (0.6 + Math.random() * 0.8); }
          if (flash > 0) {
            var f = gctx.createRadialGradient(bx, by, 0, bx, by, Math.max(W, H) * 0.7);
            f.addColorStop(0, "rgba(255,255,255," + 0.3 * flash + ")"); f.addColorStop(1, "rgba(255,255,255,0)");
            gctx.fillStyle = f; gctx.fillRect(0, 0, W, H);
            flash = Math.max(0, flash - dt / 180);
          }
        }
        gctx.globalCompositeOperation = "source-over";

        bctx.clearRect(0, 0, W, H);
        if (C.string) {
          bctx.strokeStyle = "rgba(235,235,235,.7)"; bctx.lineWidth = 1;
          bctx.beginPath(); bctx.moveTo(bx, 0); bctx.lineTo(bx, by - R); bctx.stroke();
          bctx.fillStyle = "#b8b8b8"; bctx.fillRect(bx - 5, by - R - 7, 10, 9);
        }
        drawBall(bctx, bx, by, R, rot, t / 1000);
      }

      /* the download: fetch the file so we know when it's finished, then save it */
      function fileUrl() { return el.getAttribute("href") || el.getAttribute("data-href") || ""; }
      function download() {
        var url = fileUrl();
        if (!url || url === "#") return Promise.resolve();
        var name = el.getAttribute("download") || decodeURIComponent(url.split("?")[0].split("/").pop() || "download");
        return fetch(url).then(function (res) {
          if (!res.ok) throw new Error("File not found");
          return res.blob();
        }).then(function (blob) {
          var href = URL.createObjectURL(blob), a = document.createElement("a");
          a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
        }).catch(function () {
          // a file on another site can't be fetched; just open it the normal way
          window.location.href = url;
        });
      }
      function setText(t) { if (t) labelEl.textContent = t; }
      function activate(e) {
        e.preventDefault();
        if (busy) return;
        busy = true; minUntil = performance.now() + C.minDuration * 1000; show(); report();
        setText(C.busyText);
        var job = env.action ? env.action() : el.hasAttribute("data-demo") ? new Promise(function (r) { setTimeout(r, 900); }) : download();
        Promise.resolve(job).then(function () {
          done = true; el.classList.add("is-done"); setText(C.doneText);
        }, function () { labelEl.textContent = restText; }).then(function () {
          busy = false; report();
          setTimeout(function () { if (!busy && !wanted() && !dead) { labelEl.textContent = restText; el.classList.remove("is-done"); done = false; report(); } }, C.minDuration * 1000 + 1600);
        });
      }

      var handlers = [];
      function on(type, fn) { el.addEventListener(type, fn); handlers.push([type, fn]); }
      function isHover(e) { return e.pointerType === "mouse" || e.pointerType === "pen"; }
      on("pointerenter", function (e) { if (isHover(e)) { hovering = true; show(); report(); } });
      on("pointerleave", function (e) { if (isHover(e)) { hovering = false; report(); } });
      on("focus", function () { if (el.matches(":focus-visible")) { hovering = true; show(); } });
      on("blur", function () { hovering = false; });
      if (!env.hoverOnly) on("click", activate);
      function onResize() { if (running) size(); }
      window.addEventListener("resize", onResize);

      build(); applyLook(); report();

      return {
        element: el,
        get options() { return JSON.parse(JSON.stringify(C)); },
        update: function (next) {
          var rows = Math.round(C.tiles);
          C = merge(C, next || {});
          if (Math.round(C.tiles) !== rows) build();
          applyLook();
        },
        setLabel: function (t) { restText = t; if (!busy) labelEl.textContent = t; },
        show: function () { pinned = true; show(); report(); },
        hide: function () { pinned = false; report(); },
        reroll: function () { build(); },
        reset: function () { pinned = false; hovering = false; minUntil = 0; done = false; el.classList.remove("is-done"); labelEl.textContent = restText; report(); },
        destroy: function () {
          dead = true; cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          handlers.forEach(function (h) { el.removeEventListener(h[0], h[1]); });
          dim.remove(); glow.remove(); top.remove(); if (iconEl) iconEl.remove();
          el.classList.remove("is-lit", "is-done", "no-icon");
        },
      };
    }

    return { mount: mount, defaults: DEFAULTS, presets: PRESETS, version: "1.0.0" };
  }

  var api = factory();
  // The engine's own source, so a page can hand out a self-contained copy of it.
  api.source = "(" + factory.toString() + ")()";
  root.DiscoButton = api;
})(typeof window !== "undefined" ? window : this);
