# Imran Shaikh — portfolio

A static, dark-theme portfolio with a liquid-glass surface system and an interactive
Three.js hero. No build step, no framework, no bundler: every file is served as-is by
GitHub Pages.

## What is inside

```
portfolio/
├─ index.html          Main page: hero, manifesto, work, arsenal, about, broadcast, contact
├─ privacy.html        Privacy page
├─ terms.html          Terms page
├─ 404.html            Branded not-found page (GitHub Pages serves this automatically)
├─ css/style.css       Design tokens, glass system, layout, responsive rules, reduced motion
├─ js/main.js          Lenis smooth scroll, command palette, mobile menu, reveals, tilt, terminal, live GitHub stats
├─ js/three-scene.js   Three.js hero crystal, orbital rings, dust field, pointer parallax and drag
└─ assets/
   ├─ avatar.jpg       Profile photo
   ├─ favicon.svg      Favicon
   ├─ og.svg           Source for the social preview image
   └─ og.png           Rendered 1200×630 social preview
```

## Stack

| Layer | Choice | Why |
|---|---|---|
| 3D | Three.js r187 via `esm.sh` | Faceted fresnel shader crystal, rings, dust particles |
| Smooth scroll | Lenis 1.3.27 | Pointer and wheel smoothing, honours `prefers-reduced-motion` |
| Motion | anime.js 4.5.0 | Stat counters; everything else is CSS transitions and IntersectionObserver |
| Type | Geist + Geist Mono | Loaded from Google Fonts |
| Data | GitHub REST API | Repo, star and follower counts, cached in `sessionStorage` for the visit |

Libraries load as ES modules from a CDN, so there is no `node_modules` and no build.
If a CDN request fails, the page degrades: no 3D, no counters, native scrolling.

## Local preview

Any static server works. From the repository root:

```powershell
# Node
npx serve portfolio

# or Python
python -m http.server 4173 --directory portfolio
```

Then open `http://localhost:4173/`. Opening `index.html` directly with `file://` will
break the ES module imports and the GitHub API call, so use a server.

## Deploy to GitHub Pages

The site is designed to live at the root of `Imran407704/Imran407704.github.io`.

```powershell
# 1. Copy the built files into a clone of the Pages repository
git clone https://github.com/Imran407704/Imran407704.github.io.git
Copy-Item -Path portfolio\* -Destination Imran407704.github.io\ -Recurse -Force

# 2. Commit and push
cd Imran407704.github.io
git add .
git commit -m "Rebuild portfolio: dark glass system and 3D hero"
git push origin main
```

GitHub Pages serves `main` from the repository root, so the site is live at
`https://imran407704.github.io/` within a minute or two.

Notes:

- `404.html` must stay at the repository root for GitHub Pages to use it.
- Absolute paths inside `404.html` (`/css/style.css`, `/assets/favicon.svg`) assume
  the site is served from the domain root, which is the case for a user Pages site.
- If the site ever moves to a project path such as `/portfolio/`, change the
  `canonical`, `og:url`, `og:image` and `twitter:image` URLs in `index.html` and
  switch the `404.html` asset paths to relative ones.

## Editing content

- **Projects**: each card in the `#work` section of `index.html`. The `data-stars`
  attribute on the star count is only a fallback; live numbers come from the API.
- **Toolkit**: the six cards in `#arsenal`.
- **Copy**: hero headline, manifesto tagline and the about text are plain HTML.
- **Links**: GitHub, LinkedIn, X and YouTube URLs appear in the header, contact grid,
  mobile menu and command palette. Search for `imran407704` to find all of them.
- **Social preview**: edit `assets/og.svg`, then re-render `assets/og.png` at
  1200×630 so the image stays in sync.

## Accessibility and performance

- Skip link, visible focus rings, labelled icon-only controls, 44px touch targets.
- Full keyboard support in the command palette (`Ctrl/Cmd + K`, `/`, arrows, `Enter`, `Esc`).
- `prefers-reduced-motion` disables Lenis, the 3D animation loop, reveals, tilt and the cursor ring.
- The hero canvas pauses when it scrolls out of view or the tab is hidden.
- Lighthouse on the local build: Accessibility 100, Best Practices 100, SEO 100.
- No cookies, no analytics, no trackers.

## Security note

Never commit a GitHub personal access token to this repository. The GitHub counters
are read from the public API with no authentication, so no token is needed.
