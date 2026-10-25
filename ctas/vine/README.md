# vine

Vines slip out from behind the button, wrap back over its edges and across its face, then open into flowers.

- **Hover** (desktop) grows it. Moving away pulls it back in, unless `retract` is off.
- **Tap** (touch screens) grows it, and the link opens a beat later so the bloom is seen first.
- **Click** presses only the button. The face deepens to the `pressed` colour, the arrow turns into a tick, and the growth stays.
- Keyboard focus grows it too. With `prefers-reduced-motion`, it appears without the animation.

Open [`index.html`](index.html) for the playground. Its settings panel covers the main options; everything else below can be set in code.

## Usage

```html
<a class="vine-cta" href="/resume.pdf" download>
  <span class="vine-cta__label">Download resume</span>
</a>

<script src="vine-cta.js"></script>
<script>
  const vine = VineCTA.mount(document.querySelector(".vine-cta"), {
    colors: { button: "#231a16", text: "#efe6da" },
    vines: 7,
  });
</script>
```

Anything you leave out uses the default. Presets are on `VineCTA.presets`: `oxblood` (dark brown with deep red flowers), `orchid` (plum with orchids and lilies) and `moss` (dense leafy vines, no flowers).

Leave roughly 80px of room around the button, and avoid `overflow: hidden` on its parent, or the vines get clipped.

## Options

| Option | Default | What it does |
|---|---|---|
| `colors.button` | `#231a16` | Button face |
| `colors.pressed` | `#3a2219` | Face after the button has been clicked |
| `colors.text` | `#efe6da` | Label colour |
| `colors.glow` | `#7a1824` | Soft halo behind the button while it blooms |
| `colors.stem` | `#4e6032` | Vine colour (roots are drawn darker) |
| `colors.leaf` | `#3a4f27` | Leaf colour |
| `flowers` | two types | List of flower types, see below |
| `vines` | `7` | Number of vines, 3 to 10 |
| `reach` | `1` | How far vines go past the button, 0.5 to 1.5 |
| `length` | `1` | How long each vine runs, 0.6 to 1.5 |
| `thickness` | `1` | Stem thickness, 0.5 to 2 |
| `leaves` | `1` | Leaf density, 0 to 2 |
| `blooms` | `1` | How many vines end in a flower, 0 to 1.5 |
| `bloomSize` | `1` | Flower size, 0.5 to 1.8 |
| `buds` | `true` | Closed buds on some shorter stems |
| `thorns` | `true` | Thorns on the main stems |
| `haze` | `false` | Soft glow behind each flower |
| `speed` | `1` | Growth speed, 0.4 to 2.5 |
| `seed` | `7` | Any number; each one grows a different pattern |
| `retract` | `true` | Pull back in when the pointer leaves (before any click) |
| `shape` | `"pill"` | `"pill"`, `"rounded"` or `"square"` |
| `icon` | `true` | Download arrow before the label |
| `font` | `""` | CSS `font-family` for the label; empty inherits from the page |

### Flower types

Each bloom picks one type from `flowers`, weighted by `weight`.

```js
flowers: [
  { petal: "#7d1726", tip: "#e9b8ad", centre: "#0a0103", shape: "ruffled", speckles: "", stamens: "", weight: 3 },
  { petal: "#968491", tip: "#f6f1ee", centre: "#140a10", shape: "soft",    speckles: "", stamens: "", weight: 1 },
]
```

| Key | What it does |
|---|---|
| `petal` | Main petal colour |
| `tip` | Colour the petals fade to at their edges |
| `centre` | Colour at the heart of the flower |
| `shape` | `"ruffled"` (three layers), `"soft"` (two layers), `"wide"` (orchid-like), `"slender"` (lily-like) |
| `speckles` | A colour to add speckles in the centre, or `""` for none |
| `stamens` | A colour to add curling stamens, or `""` for none |
| `weight` | How often this type appears relative to the others |

## API

`VineCTA.mount(element, options)` returns:

| Method | What it does |
|---|---|
| `update(options)` | Change any options live |
| `show()` | Jump straight to fully grown |
| `replay()` | Grow again from nothing |
| `reset()` | Back to the resting button |
| `destroy()` | Remove everything the engine added |

Add `data-demo` to the element to stop it following its link (useful in previews).

`VineCTA.source` holds the engine's own source text, which is how the playground builds a self-contained snippet.
