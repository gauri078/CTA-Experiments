# Adding a new button

Copy this checklist when you start the next experiment (for example `ctas/neon-button/`).

## 1. Make the folder

```
ctas/neon-button/
  neon-button.js      the button
  index.html          playground
  playground.js       playground controls
  README.md           options and usage
```

The easiest start is to copy `ctas/disco-button/` and rename things.

## 2. The engine file

Wrap everything in a factory function so the playground can hand out the engine's own source. Expose the same four things the vine does:

```js
(function (root) {
  function factory() {
    "use strict";
    var DEFAULTS = { /* every option, with a comment on each */ };
    var PRESETS = { /* a few named looks */ };

    function mount(el, options) {
      // inject your CSS once, build the effect around `el`, wire hover / tap / click
      return { update: function (next) {}, show: function () {}, replay: function () {}, reset: function () {}, destroy: function () {} };
    }

    return { mount: mount, defaults: DEFAULTS, presets: PRESETS, version: "1.0.0" };
  }

  var api = factory();
  api.source = "(" + factory.toString() + ")()";
  root.NeonButton = api;
})(window);
```

Rules that keep the buttons easy to reuse:

- **No dependencies and no external files.** Inject CSS from the engine; draw with CSS, SVG or canvas.
- **One element in, one element out.** `mount()` takes the person's own `<a>` or `<button>` and builds around it.
- **Touch screens get the effect too.** Hover on desktop; on touch, the first tap plays it, then the link opens.
- **Respect `prefers-reduced-motion`.**
- **`data-demo` stops navigation**, so the playground can be clicked freely.

## 3. The playground

Copy `ctas/disco-button/index.html` and `playground.js`. Swap the engine `<script>` and the demo markup, then describe your settings in the `DialKit.createDialKit(...)` call. Each key becomes a control:

```js
DialKit.createDialKit("Neon button", {
  button: { label: "Download resume", colour: "#ff5c9e" }, // a folder with a text field and a colour picker
  glow: [0.6, 0, 1.5, 0.05],                               // a slider: [default, min, max, step]
  flicker: true,                                           // an on/off toggle
  shape: { type: "select", options: ["square", "pill"] },  // a dropdown
});
```

In `kit.subscribe(values => ...)`, copy the values into your options and call `update()`. Keep the page structure (stage, stage bar, copy box, `<div id="panel">`) so every playground looks the same; `assets/bench.js` handles light/dark and builds the panel when you call `Bench.panel(...)`.

Keep the two copy buttons: `snippet()` should inline `YourCTA.source` and `JSON.stringify(options)`, so what people copy works on its own.

## 4. List it

- Add a card to the gallery in `/index.html` (copy the vine card).
- Add a row to the table in `/README.md`.
