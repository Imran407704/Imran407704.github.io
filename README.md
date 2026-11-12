# Imran Shaikh — portfolio

A static, Ironman-themed portfolio for Imran Shaikh, penetration tester and red teamer.
No build step, no framework, no bundler: every file is served as-is by GitHub Pages.

The visual system is graphite and crimson with gold plating and an arc-reactor cyan
accent, built on a Vercel-Minimal structure: hairline borders, pill controls at 40px,
400-weight display type with negative tracking, and generous whitespace.

## What is inside

```
portfolio/
├─ index.html          Hero, mission, profile, experience, arsenal, projects, credentials, contact, JARVIS
├─ privacy.html        Privacy page
├─ terms.html          Terms page
├─ 404.html            Branded not-found page (GitHub Pages serves this automatically)
├─ css/style.css       Design tokens, HUD layer, layout, components, responsive, reduced motion
├─ js/main.js          Nav, reveals, counters, card deploy, live GitHub stats, JARVIS/FRIDAY assistant
└─ assets/
   ├─ avatar.jpg       Profile photo (base state of the hero portrait)
   ├─ ironman.svg      Suit revealed on hover / MARK LXXXV toggle
   ├─ favicon.svg      Arc reactor favicon
   ├─ apple-touch-icon.png
   ├─ og.svg           Source for the social preview image
   └─ og.png           Rendered 1200×630 social preview
```

## Theme and interactions

- **Portrait deploy**: hovering the hero portrait (or focusing the MARK LXXXV button)
  swaps the photo for the suit. The toggle sets `aria-pressed` for keyboard and touch
  users, and the readout switches from `HUMAN / ONLINE` to `MARK LXXXV / ONLINE`.
- **JARVIS**: a scripted local assistant. `Ctrl/Cmd + K` opens it, `Esc` closes it,
  the persona button switches between JARVIS and FRIDAY. Answers come from a keyword
  knowledge base in `js/main.js`; nothing is sent to a server.
- **Live telemetry**: repository, star and follower counts come from the public GitHub
  API and fall back to the static numbers in the HTML if the request fails.
- **Motion**: CSS transitions plus `IntersectionObserver`. The tagline lights up word
  by word as it enters the viewport. `prefers-reduced-motion` disables all of it.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Type | Geist + Geist Mono | Loaded from Google Fonts |
| Motion | CSS + `IntersectionObserver` + `requestAnimationFrame` | Counters and reveals, no animation dependency |
| Data | GitHub REST API | Repo, star and follower counts, no token, no cache storage |
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
git commit -m "Rebuild portfolio: STARK OS Ironman theme"
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
- **Arsenal**: the six panels inside `#arsenal`.
- **Copy**: hero headline, mission tagline and profile text are plain HTML.
- **Assistant**: the `knowledge` array in `js/main.js`. Each entry has `keys` to match and
  an HTML `answer`. Add an entry, no other wiring needed.
- **Suit image**: replace `assets/ironman.svg`, or drop in a photo at
  `assets/ironman.jpg` and change the `portrait-swap` `src` in `index.html` plus its
  `width`/`height` attributes.
- **Social preview**: edit `assets/og.svg`, then re-render `assets/og.png` at 1200×630.

## Accessibility and performance

- Skip link, visible focus rings, labelled icon-only controls, 40px control height.
- JARVIS is a non-modal dialog: focus moves to the input on open, returns to the trigger
  on close, and `Esc` always works.
- Hover-only information is duplicated by a real button, so keyboard and touch users can
  deploy the suit.
- `prefers-reduced-motion` removes reveals, typing effects, marquees and scan lines.
- No cookies, no analytics, no trackers, no local or session storage.

## Security note

Never commit a GitHub personal access token to this repository. The GitHub counters are
read from the public API with no authentication, so no token is needed.
