# Imran Shaikh — portfolio

A static, Spider-Man-themed portfolio for Imran Shaikh, penetration tester and red
teamer. No build step, no framework, no bundler: every file is served as-is by
GitHub Pages.

The layout mirrors a superhero-designer folio: preloader with rotating quotes,
floating pill header, giant script-and-display hero, client marquee, tilted
discipline ribbons, case-study cards, rotated gallery rows, a pinned "My story"
timeline, tooling cards, services rows, a tools ring, "I'm Both", credentials
cards, a red stats CTA and a giant footer wordmark. The palette is spidey red
`#C90207` and spidey blue `#002979` on a black canvas, set in Outfit with Caveat
for the script accents and JetBrains Mono for labels.

## What is inside

```
portfolio/
├─ index.html          Preloader, hero + mask toggle, marquees, projects, pinned
│                      timeline, services, tools, credentials, CTA, KAREN panel
├─ privacy.html        Privacy page
├─ terms.html          Terms page
├─ 404.html            Branded not-found page (GitHub Pages serves this automatically)
├─ css/style.css       Design tokens, all sections, responsive, reduced motion, print
├─ js/main.js          Preloader, cursor, header, menu, split text, scrub text,
│                      marquee fills, counters, pinned timeline, mask toggle,
│                      GitHub stars, KAREN/JARVIS assistant, Three.js hero scene
└─ assets/
   ├─ avatar.jpg       Profile photo (base state of the hero portrait)
   ├─ spiderman.svg    Masked suit art revealed on hover / MASK ON toggle
   ├─ favicon.svg      Spider emblem favicon
   ├─ apple-touch-icon.png
   ├─ og.svg           Source for the social preview image
   └─ og.png           Rendered 1200×630 social preview
```

## Theme and interactions

- **Mask on / off**: hovering the hero portrait (or pressing the `MASK ON` button)
  swaps the photo for the spidey mask art. The toggle sets `aria-pressed` for
  keyboard and touch users, and the tag flips between `MASK OFF` and `MASK ON`.
- **KAREN**: a scripted local assistant. `Ctrl/Cmd + K` opens it, `Esc` closes it,
  and the persona button switches it to JARVIS. Answers come from a keyword
  knowledge base in `js/main.js`; nothing is sent to a server.
- **Pinned timeline**: the "Let's go back in time" section pins for a few viewport
  heights and scrubs year, employer, progress bar and entries as you scroll.
- **Marquees**: the client bar, ribbons, gallery rows and tools ring all loop via a
  shared `marquee` keyframe; JS duplicates each track once for a seamless wrap.
- **Hero 3D**: a Three.js ring scene (red and blue, spider palette) sits behind the
  portrait. It loads from esm.sh with a jsDelivr failover; if both fail, the canvas
  is removed and the CSS background carries the hero.
- **Motion**: reveals, counters and the scrub-text effect run on
  `IntersectionObserver` and `requestAnimationFrame`. `prefers-reduced-motion`
  disables all of it, including the preloader and the 3D scene.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Type | Outfit + Caveat + JetBrains Mono | Loaded from Google Fonts |
| Motion | CSS + `IntersectionObserver` + `requestAnimationFrame` | Counters, reveals and the pinned timeline, no animation dependency |
| 3D | Three.js 0.169 via esm.sh, jsDelivr failover | Hero rings only; the site does not depend on it |
| Data | GitHub REST API | Star counts on project cards, no token, no cache storage |
| Everything else | Vanilla HTML, CSS, JS | Zero dependencies, zero build |

## Local preview

Any static server works. From the repository root:

```powershell
# Node
npx serve portfolio

# or Python
python -m http.server 4173 --directory portfolio
```

Then open `http://localhost:4173/`. Opening `index.html` directly with `file://` will
block the GitHub API request, so use a server for the live counters.

## Deploy to GitHub Pages

The site lives at the root of `Imran407704/Imran407704.github.io`, which publishes the
`main` branch at `https://imran407704.github.io/`.

```powershell
git clone https://github.com/Imran407704/Imran407704.github.io.git
Copy-Item -Path portfolio\* -Destination Imran407704.github.io\ -Recurse -Force
cd Imran407704.github.io
git add .
git commit -m "Rebuild portfolio: Spider-Man theme, Gowtham-style sections"
git push origin main
```

Notes:

- `404.html` must stay at the repository root for GitHub Pages to use it.
- Absolute paths inside `404.html` (`/css/style.css`, `/assets/favicon.svg`) assume the
  site is served from the domain root, which is the case for a user Pages site.
- If the site moves to a project path such as `/portfolio/`, change the `canonical`,
  `og:url`, `og:image` and `twitter:image` URLs in `index.html` and switch the `404.html`
  asset paths to relative ones.

## Editing content

- **Projects**: each card in `#projects`. `data-stars` is the fallback; live numbers come
  from the API.
- **Timeline**: the `.xt` entries in `#experience`; `data-year`, `data-date` and
  `data-co` feed the pinned side panel.
- **Copy**: hero, intro and about text are plain HTML.
- **Assistant**: the `knowledge` array in `js/main.js`. Each entry has `keys` to match and
  an HTML `answer`. Add an entry, no other wiring needed.
- **Suit image**: replace `assets/spiderman.svg` (viewBox 1000×1250), or swap the
  `hp-suit` `src` in `index.html` and keep its `width`/`height` attributes.
- **Social preview**: edit `assets/og.svg`, then re-render `assets/og.png` at 1200×630
  (for example with `@resvg/resvg-js`).

## Accessibility and performance

- Skip link, visible focus rings, labelled icon-only controls.
- KAREN is a non-modal dialog: focus moves to the input on open, returns to the trigger
  on close, and `Esc` always works.
- Hover-only information is duplicated by a real button, so keyboard and touch users can
  toggle the mask.
- All content renders without JavaScript: reveal states are gated behind an `html.js-on`
  class that only JS adds, and the `<noscript>` notice explains what is missing.
- `prefers-reduced-motion` removes the preloader, the 3D scene, marquees, the pinned
  timeline scrub and every reveal.
- No cookies, no analytics, no trackers; one `sessionStorage` flag stops the intro
  replaying on every navigation.

## Security note

Never commit a GitHub personal access token to this repository. The GitHub counters are
read from the public API with no authentication, so no token is needed.
