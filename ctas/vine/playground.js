/* Playground for the vine CTA: a DialKit panel for the settings, a live
   stage, and two ways out (a self-contained snippet, or the same snippet
   wrapped in instructions for an AI assistant). */
(function () {
  "use strict";

  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var D = VineCTA.defaults;
  var cfg = Object.assign(clone(D), clone(VineCTA.presets.oxblood));
  var label = "button";
  var keepOpen = true;

  var demo = document.getElementById("demo");
  var demoText = document.getElementById("demo-text");
  var codeEl = document.getElementById("code");
  var stateEl = document.getElementById("state");
  var pinBtn = document.getElementById("pin");

  // On the stage the vines stay out while "keep it on" is pressed, so you can see every change.
  var stageOptions = function () { var o = clone(cfg); if (keepOpen) o.retract = false; return o; };
  var cta = VineCTA.mount(demo, stageOptions());
  cta.show();

  function refresh(opts) {
    opts = opts || {};
    cta.update(stageOptions());
    if (opts.replay) cta.replay();
    else if (keepOpen) cta.show();
    codeEl.textContent = snippet();
  }

  /* ------------------------------------------------------------ the panel */

  var SHAPES = ["ruffled", "soft", "wide", "slender"];
  function flowerDial(f) {
    return {
      _collapsed: true,
      petal: f.petal,
      "petal tip": f.tip,
      centre: f.centre,
      shape: { type: "select", options: SHAPES, default: f.shape },
      speckles: Boolean(f.speckles),
      "speckle colour": f.speckles || "#96164a",
      stamens: Boolean(f.stamens),
      "stamen colour": f.stamens || "#d6608c",
      "how often": [f.weight == null ? 1 : f.weight, 0, 5, 1],
    };
  }
  function readFlower(v) {
    return {
      petal: v.petal, tip: v["petal tip"], centre: v.centre, shape: v.shape,
      speckles: v.speckles ? v["speckle colour"] : "", stamens: v.stamens ? v["stamen colour"] : "",
      weight: v["how often"],
    };
  }
  var F = cfg.flowers.concat(D.flowers).slice(0, 2);

  var kit = DialKit.createDialKit("Vine", {
    button: {
      label: label,
      shape: { type: "select", options: ["pill", "rounded", "square"], default: cfg.shape },
      icon: cfg.icon,
      face: cfg.colors.button,
      pressed: cfg.colors.pressed,
      text: cfg.colors.text,
      glow: cfg.colors.glow,
    },
    vines: {
      count: [cfg.vines, 3, 10, 1],
      reach: [cfg.reach, 0.5, 1.5, 0.05],
      length: [cfg.length, 0.6, 1.5, 0.05],
      thickness: [cfg.thickness, 0.5, 2, 0.05],
      leaves: [cfg.leaves, 0, 2, 0.1],
      thorns: cfg.thorns,
      stem: cfg.colors.stem,
      leaf: cfg.colors.leaf,
    },
    flowers: {
      size: [cfg.bloomSize, 0.5, 1.8, 0.05],
      buds: cfg.buds,
      glow: cfg.haze,
      "flower 1": flowerDial(F[0]),
      "flower 2": flowerDial(F[1]),
    },
    motion: {
      speed: [cfg.speed, 0.4, 2.5, 0.05],
      "pull back on leave": D.retract,
      pattern: [cfg.seed, 1, 999, 1],
    },
  });

  var first = true, lastStructure = "";
  kit.subscribe(function (v) {
    cfg.shape = v.button.shape;
    cfg.icon = v.button.icon;
    cfg.colors.button = v.button.face;
    cfg.colors.pressed = v.button.pressed;
    cfg.colors.text = v.button.text;
    cfg.colors.glow = v.button.glow;
    cfg.vines = v.vines.count;
    cfg.reach = v.vines.reach;
    cfg.length = v.vines.length;
    cfg.thickness = v.vines.thickness;
    cfg.leaves = v.vines.leaves;
    cfg.thorns = v.vines.thorns;
    cfg.colors.stem = v.vines.stem;
    cfg.colors.leaf = v.vines.leaf;
    cfg.bloomSize = v.flowers.size;
    cfg.buds = v.flowers.buds;
    cfg.haze = v.flowers.glow;
    cfg.flowers = [readFlower(v.flowers["flower 1"]), readFlower(v.flowers["flower 2"])].filter(function (f) { return f.weight > 0; });
    cfg.blooms = cfg.flowers.length ? (cfg.blooms || 1) : 0;
    cfg.speed = v.motion.speed;
    cfg.retract = v.motion["pull back on leave"];
    cfg.seed = v.motion.pattern;
    label = v.button.label;
    demoText.textContent = label || " ";
    // replay the growth when the shape of the vines changes; colours just repaint
    var structure = JSON.stringify([cfg.vines, cfg.reach, cfg.length, cfg.thickness, cfg.leaves, cfg.thorns, cfg.bloomSize, cfg.buds, cfg.seed, cfg.flowers.map(function (f) { return [f.shape, f.weight, !!f.speckles, !!f.stamens]; })]);
    refresh({ replay: !first && structure !== lastStructure });
    lastStructure = structure; first = false;
  });
  Bench.panel(document.getElementById("panel"));

  /* ------------------------------------------------------------ stage controls */

  function showState() {
    stateEl.textContent = demo.classList.contains("is-done") ? "clicked" : demo.classList.contains("is-bloom") ? "open" : "rest";
  }
  new MutationObserver(showState).observe(demo, { attributes: true, attributeFilter: ["class"] });
  showState();

  pinBtn.addEventListener("click", function () {
    keepOpen = pinBtn.getAttribute("aria-pressed") !== "true";
    pinBtn.setAttribute("aria-pressed", String(keepOpen));
    if (!keepOpen) cta.reset();
    refresh();
  });
  document.getElementById("replay").addEventListener("click", function () { refresh({ replay: true }); });
  document.getElementById("shuffle").addEventListener("click", function () {
    kit.setValue("motion.pattern", 1 + Math.floor(Math.random() * 999));
  });

  /* ------------------------------------------------------------ the code people copy */

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

  function snippet() {
    return (
      "<!-- Vine CTA (cta-experiments by Gauri Tsering Sharma). Set href to where the button should go. -->\n" +
      '<a class="vine-cta" href="#">\n' +
      '  <span class="vine-cta__label">' + esc(label) + "</span>\n" +
      "</a>\n\n" +
      "<script>\n" +
      "/* Vine CTA engine, no dependencies. Include it once per page. */\n" +
      "window.VineCTA = window.VineCTA || " + VineCTA.source + ";\n\n" +
      "/* Your settings. Change these to restyle the button. */\n" +
      'VineCTA.mount(document.querySelector(".vine-cta"), ' + JSON.stringify(cfg, null, 2) + ");\n" +
      "</" + "script>\n"
    );
  }

  function aiPrompt() {
    return (
      "I want to add an animated call-to-action button to my website. The code is below.\n\n" +
      "How it works: the <a class=\"vine-cta\"> element is the button. The script grows vines and flowers around it on hover (tap on phones). " +
      "VineCTA.mount(element, options) attaches it, and returns an object with update(options) and destroy().\n\n" +
      "Please:\n" +
      "1. Place the <a class=\"vine-cta\"> where I want the button, and set its href and text for my site.\n" +
      "2. Include the engine script once. In React, Vue, Svelte or similar, load the engine once, call VineCTA.mount(ref, options) after the element mounts, and call destroy() when it unmounts.\n" +
      "3. Do not rewrite the engine. To restyle, only change the options object passed to VineCTA.mount.\n" +
      "4. Leave about 80px of free space around the button so the vines are not clipped (avoid overflow: hidden on its parent).\n\n" +
      "Options: colors (button, pressed, text, glow, stem, leaf), flowers (a list of { petal, tip, centre, shape: ruffled | soft | wide | slender, speckles, stamens, weight }), " +
      "vines (3 to 10), reach, length, thickness, leaves, blooms, bloomSize, buds, thorns, haze, speed, seed, retract, shape (pill | rounded | square), icon, font.\n\n" +
      "The code:\n\n" + snippet()
    );
  }

  document.getElementById("copy-code").addEventListener("click", function () { Bench.copy(snippet(), "code", codeEl); });
  document.getElementById("copy-ai").addEventListener("click", function () { Bench.copy(aiPrompt(), "prompt", codeEl); });

  codeEl.textContent = snippet();
})();
