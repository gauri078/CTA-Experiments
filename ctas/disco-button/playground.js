/* Playground for the disco button: a DialKit panel for the main settings,
   a live stage, and two ways out (a self-contained snippet, or the same
   snippet wrapped in instructions for an AI assistant). */
(function () {
  "use strict";

  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var D = DiscoButton.defaults;
  var cfg = clone(D);
  var label = "button";
  var pretend = 1; // seconds the fake download takes on the stage

  var demo = document.getElementById("demo");
  var stage = document.getElementById("stage");
  var codeEl = document.getElementById("code");
  var stateEl = document.getElementById("state");
  var pinBtn = document.getElementById("pin");

  var cta = DiscoButton.mount(demo, cfg, {
    container: stage, // keep the effect inside the stage here; on a real page it covers the whole page
    action: function () { return new Promise(function (r) { setTimeout(r, pretend * 1000); }); },
    onState: function (s) { stateEl.textContent = s; },
  });

  /* ------------------------------------------------------------ the panel */

  var kit = DialKit.createDialKit("Disco button", {
    button: {
      label: label,
      shape: { type: "select", options: ["square", "rounded", "pill"], default: D.shape },
      icon: D.icon,
      face: D.colors.button,
      text: D.colors.text,
      border: D.colors.border,
    },
    ball: {
      size: [D.ballSize, 20, 110, 1],
      speed: [D.speed, 0, 3, 0.05],
    },
    light: {
      colour: D.colors.light,
      accent: D.colors.accent,
      spots: [D.spots, 4, 140, 1],
      beams: [D.beams, 0, 0.6, 0.01],
    },
    page: {
      darkness: [D.dim, 0, 0.95, 0.01],
      flashes: D.flashes,
    },
    timing: {
      "min seconds": [D.minDuration, 0, 6, 0.1],
      "test download": [pretend, 0, 8, 0.1],
    },
  });

  kit.subscribe(function (v) {
    cfg.shape = v.button.shape;
    cfg.icon = v.button.icon;
    cfg.colors.button = v.button.face;
    cfg.colors.text = v.button.text;
    cfg.colors.border = v.button.border;
    cfg.ballSize = v.ball.size;
    cfg.speed = v.ball.speed;
    cfg.colors.light = v.light.colour;
    cfg.colors.accent = v.light.accent;
    cfg.spots = v.light.spots;
    cfg.beams = v.light.beams;
    cfg.dim = v.page.darkness;
    cfg.flashes = v.page.flashes;
    cfg.minDuration = v.timing["min seconds"];
    pretend = v.timing["test download"];
    label = v.button.label || " ";
    cta.update(cfg);
    cta.setLabel(label);
    codeEl.textContent = snippet();
  });
  Bench.panel(document.getElementById("panel"));

  /* ------------------------------------------------------------ stage controls */

  pinBtn.addEventListener("click", function () {
    var on = pinBtn.getAttribute("aria-pressed") !== "true";
    pinBtn.setAttribute("aria-pressed", String(on));
    if (on) cta.show(); else cta.hide();
  });
  document.getElementById("reroll").addEventListener("click", function () { cta.reroll(); Bench.toast("tiles re-rolled"); });
  document.getElementById("reset").addEventListener("click", function () {
    pinBtn.setAttribute("aria-pressed", "false");
    cta.reset();
    kit.resetValues();
  });

  /* ------------------------------------------------------------ the code people copy */

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

  function snippet() {
    return (
      "<!-- Disco button (cta-experiments by Gauri Tsering Sharma). Point href at your file. -->\n" +
      '<a class="disco-button" href="/resume.pdf" download>\n' +
      '  <span class="disco-button__label">' + esc(label) + "</span>\n" +
      "</a>\n\n" +
      "<script>\n" +
      "/* Disco button engine, no dependencies. Include it once per page. */\n" +
      "window.DiscoButton = window.DiscoButton || " + DiscoButton.source + ";\n\n" +
      "/* Your settings. Change these to restyle the button. */\n" +
      'DiscoButton.mount(document.querySelector(".disco-button"), ' + JSON.stringify(cfg, null, 2) + ");\n" +
      "</" + "script>\n"
    );
  }

  function aiPrompt() {
    return (
      "I want to add an animated call-to-action button to my website. The code is below.\n\n" +
      "How it works: the <a class=\"disco-button\"> element is the button. On hover (tap on phones) a mirror ball drops in above it, " +
      "the rest of the page dims, and light spots sweep across the page. On click it downloads the file in href and keeps the effect running " +
      "until the download finishes, for at least minDuration seconds. DiscoButton.mount(element, options) attaches it and returns an object " +
      "with update(options), setLabel(text) and destroy().\n\n" +
      "Please:\n" +
      "1. Place the <a class=\"disco-button\"> where I want the button, and set its href and text for my site. The file should be on my own site so it can be fetched.\n" +
      "2. Include the engine script once. In React, Vue, Svelte or similar, load the engine once, call DiscoButton.mount(ref, options) after the element mounts, and call destroy() when it unmounts.\n" +
      "3. Do not rewrite the engine. To restyle, only change the options object passed to DiscoButton.mount.\n" +
      "4. The effect uses fixed layers over the whole page (z-index 50 to 72) and lifts the button to z-index 70 so it stays lit. " +
      "If the button sits inside a parent that creates its own stacking context (transform, filter, opacity below 1, or its own z-index), the button will be dimmed too, so move it or adjust that parent.\n\n" +
      "Options: colors (button, text, border, light, accent), shape (square | rounded | pill), icon, font, ballSize, speed, tiles, sparkle, hang, string, " +
      "spots, spotSize, spread, accentShare, beams, glow, haze, spotlight, buttonGlow, flashes, flashEvery, dim, colourLeft, blur, pool, " +
      "minDuration, fadeIn, fadeOut, busyText, doneText.\n\n" +
      "The code:\n\n" + snippet()
    );
  }

  document.getElementById("copy-code").addEventListener("click", function () { Bench.copy(snippet(), "code", codeEl); });
  document.getElementById("copy-ai").addEventListener("click", function () { Bench.copy(aiPrompt(), "prompt", codeEl); });

  codeEl.textContent = snippet();
})();
