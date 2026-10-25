# cta experiments

An ongoing experiment in adding a little whimsy to call-to-action buttons, by [Gauri Tsering Sharma](https://gauritseringsharma.vercel.app/).

## Why

The call to action is one of the most important moments on a website. It's where someone decides to download, sign up, buy or get in touch. And it's almost always the plainest thing on the page: a rectangle with some words in it.

These experiments ask what happens if that moment gets a bit of delight instead. Vines that grow over a resume button on a portfolio full of flowers. A disco ball that catches the light on a page that's meant to feel like a party. Each one is built to match the vibe of the site it lives on, so the button feels like part of the story rather than something bolted on.

They're experiments, so some will be subtle and some will be a lot. Every one is built to be taken apart and reused.

## How it works

Each button lives in its own folder with a **playground**. Open the playground, tune the colours and behaviour in the settings panel (built with [DialKit](https://github.com/joshpuckett/dialkit)), then either:

- **copy code**: one self-contained snippet (HTML + JavaScript, no dependencies) with your settings baked in, or
- **copy for AI**: the same snippet wrapped in instructions, so you can paste it into an AI assistant and ask it to add the button to your site.

## The buttons

| | What it does | Playground |
|---|---|---|
| **vine** | Vines slip out from behind the button, wrap over its edges and open into flowers. Click presses the button while the growth stays. | [`ctas/vine`](ctas/vine/) |
| **disco button** | A mirror ball drops in above the button. The page dims and its light spots sweep across, showing what's underneath. Click keeps it spinning until the file has downloaded. | [`ctas/disco-button`](ctas/disco-button/) |

## Running it

There is no build step. Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server
```

To publish it as a site, turn on **GitHub Pages** for the repository (Settings → Pages → deploy from the `main` branch, root folder). The gallery is `index.html` and each playground is `ctas/<name>/index.html`.

## Using a button without the playground

Every button follows the same pattern. For the vine:

```html
<a class="vine-cta" href="/resume.pdf" download>
  <span class="vine-cta__label">Download resume</span>
</a>

<script src="vine-cta.js"></script>
<script>
  VineCTA.mount(document.querySelector(".vine-cta"), VineCTA.presets.oxblood);
</script>
```

For the disco button:

```html
<a class="disco-button" href="/resume.pdf" download>
  <span class="disco-button__label">Download resume</span>
</a>

<script src="disco-button.js"></script>
<script>
  DiscoButton.mount(document.querySelector(".disco-button"));
</script>
```

Each folder's README lists every option. The buttons themselves have no dependencies; DialKit is only used by the playground pages.

## Adding a new button

See [`ctas/_template/README.md`](ctas/_template/README.md). In short: make a folder under `ctas/`, give it an engine file that exposes `mount()`, `defaults`, `presets` and `source`, a playground `index.html`, and a README, then add a card for it to the gallery in `index.html` and a row to the table above.

## Folder layout

```
index.html              gallery of every button
assets/
  site.css              shared look for the gallery and playgrounds
  bench.css             shared playground layout (stage, panel, copy box)
  bench.js              light/dark switch, DialKit panel, copy helpers
  vendor/dialkit/       DialKit's plain-JS build (MIT), used by the playgrounds
ctas/
  vine/
    vine-cta.js         the button itself (this is what people use)
    index.html          playground page
    playground.js       DialKit settings and the copy buttons
    README.md           options and usage
  disco-button/
    disco-button.js     the button itself
    index.html          playground page
    playground.js       DialKit settings and the copy buttons
    README.md           options and usage
  _template/
    README.md           checklist for adding the next button
```

## License

MIT. Use the buttons anywhere; a credit is appreciated but not required.

The playground settings panels use [DialKit](https://github.com/joshpuckett/dialkit) by Josh Puckett (MIT), included in `assets/vendor/dialkit/` with its licence.
