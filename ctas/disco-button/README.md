# disco button

Hover the button and a mirror ball drops in above it and starts to spin. The rest of the page dims, and every spot of light the ball throws shows the page underneath at full colour as it sweeps past.

- **Hover** (desktop) brings the ball in. Moving away fades it out.
- **Click or tap** downloads the file in `href`. The ball keeps spinning until the download has finished, and for at least `minDuration` seconds even if it's quicker. The arrow turns into a tick and the label changes to `doneText`.
- Keyboard focus brings the ball in too. With `prefers-reduced-motion`, the ball turns very slowly and the flashes are off.

Open [`index.html`](index.html) for the playground.

## Usage

```html
<a class="disco-button" href="/resume.pdf" download>
  <span class="disco-button__label">Download resume</span>
</a>

<script src="disco-button.js"></script>
<script>
  const disco = DiscoButton.mount(document.querySelector(".disco-button"), {
    colors: { light: "#f2f2f0", accent: "#ff5c9e" },
    spots: 72,
  });
</script>
```

Anything you leave out uses the default. Presets are on `DiscoButton.presets`: `studio` (the monochrome default), `ice` (cool blue light) and `gold` (warm and soft).

Two things to know:

- **The file should be on your own site.** The button fetches it so it knows when the download is done. A file on another domain can't be fetched that way, so the button just opens it instead.
- **Keep the button out of stacking contexts.** The effect covers the page with fixed layers at `z-index` 50 to 72 and lifts the button to 70 so it stays lit. If a parent of the button has a `transform`, `filter`, `opacity` below 1 or its own `z-index`, the button gets dimmed along with everything else.

## Options

| Option | Default | What it does |
|---|---|---|
| `colors.button` | `#f2eee6` | Button face at rest |
| `colors.text` | `#0b0b0b` | Label colour at rest |
| `colors.border` | `#0b0b0b` | Outline and icon divider at rest |
| `colors.light` | `#f2f2f0` | Colour of the light spots and beams |
| `colors.accent` | `#ff5c9e` | The occasional coloured tile, and the button's outer glow |
| `shape` | `"square"` | `"square"`, `"rounded"` or `"pill"` |
| `icon` | `true` | Download arrow in its own box on the right |
| `font` | `""` | CSS `font-family` for the label; empty uses a monospace stack |
| `ballSize` | `52` | Ball radius in px (a bit smaller on phones) |
| `speed` | `1` | How fast the ball turns, 0 to 3 |
| `tiles` | `26` | Rows of mirror tiles; more rows means smaller tiles and more spots |
| `sparkle` | `1` | How often single tiles glint, 0 to 1.5 |
| `hang` | `34` | Gap between the ball and the top of the button, px |
| `string` | `true` | Draw the string the ball hangs from |
| `spots` | `72` | Most light spots on screen at once (halved on phones) |
| `spotSize` | `1` | Spot size multiplier, 0.4 to 2.5 |
| `spread` | `0.3` | How far the spots fly from the ball, 0.12 to 0.7 |
| `accentShare` | `0.06` | Share of tiles that throw accent-coloured light, 0 to 1 |
| `beams` | `0.14` | Strength of the light shafts, 0 to 0.6 |
| `glow` | `0.08` | Soft glow around each spot, 0 to 0.4 |
| `haze` | `0.16` | Glow around the ball itself, 0 to 0.6 |
| `spotlight` | `0.14` | Cone of light from the ball onto the button, 0 to 0.5 |
| `buttonGlow` | `0.6` | Halo around the lit button, 0 to 1.5 |
| `flashes` | `true` | Now and then a beam flares, like it hit a camera lens |
| `flashEvery` | `4.5` | Roughly how often, in seconds |
| `dim` | `0.62` | How dark the page goes, 0 to 0.95 |
| `colourLeft` | `0` | How much colour the dimmed page keeps, 0 (grey) to 1 |
| `blur` | `0.6` | Blur on the dimmed page, px |
| `pool` | `0.75` | Pool of light around the button, 0 to 1 |
| `minDuration` | `2` | After a click, keep spinning at least this long, in seconds |
| `fadeIn` | `260` | ms |
| `fadeOut` | `340` | ms |
| `busyText` | `"Fetching resume…"` | Label while downloading; `""` keeps the label |
| `doneText` | `"Resume downloaded"` | Label once done; `""` keeps the label |

## API

`DiscoButton.mount(element, options, env)` returns:

| Method | What it does |
|---|---|
| `update(options)` | Change any options live |
| `setLabel(text)` | Change the resting label |
| `show()` / `hide()` | Keep the effect on, or let it go again |
| `reroll()` | Shuffle the mirror tiles |
| `reset()` | Back to the resting button |
| `destroy()` | Remove everything the engine added |

The optional third argument, `env`, is for previews and isn't part of the copyable options:

| Key | What it does |
|---|---|
| `container` | Keep the effect inside this element instead of the whole page |
| `action` | A function returning a promise, run on click instead of the download |
| `hoverOnly` | Leave clicks alone, for a preview inside a link |
| `onState` | Called with `"rest"`, `"hover"`, `"downloading"`, `"holding"`, `"pinned"`, `"fading out"` or `"done"` |

Add `data-demo` to the element to fake the download instead of fetching anything.

`DiscoButton.source` holds the engine's own source text, which is how the playground builds a self-contained snippet.

## How the light works

Each mirror tile is a flat mirror. Two hidden spotlights sit behind the ball, and for every tile facing them the engine reflects the light (`r = d − 2(d·n)n`) and projects it onto the page. When the ball turns, the spots sweep faster than the ball itself, the way light off a real mirror does. The dim layer is a full-page overlay with one hole per spot, so wherever light lands you see the page as it really is.
