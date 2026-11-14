# jibinjohnson.in

Personal website of a web developer and SEO specialist in Trivandrum (Thiruvananthapuram), Kerala.

## Stack
- Plain HTML, CSS, JavaScript. No frameworks, no build step.
- Hosting: Netlify (`netlify.toml` publishes the repo root; contact form uses Netlify Forms).
- Styles: `assets/css/main.css`. Scripts: `assets/js/main.js`. Images: `assets/img/`.
- Each page is a folder with `index.html`. Pages use relative paths (`../assets/...`); `404.html` uses root-absolute paths (`/assets/...`).

## Pages
`/` (home), `about/`, `services/`, `projects/`, `contact/`, `privacy/`, `404.html`, and five service pages:
`website-development-kerala/`, `seo-services-kerala/`, `full-stack-developer-kerala/`, `python-django-developer-kerala/`, `ai-developer-kerala/`.

## Rules
- Never put the name "Jibin Johnson" in an H1 or H2. The logo is the word "Jibin".
- Exactly one H1 per page. Keep each page's primary keyword in its title, H1 and meta description.
- New colours must come from the palette. Transparent rgba versions of palette colours are allowed, and theme-color stays as a hex value.
- Fonts are Fraunces (headings) and DM Sans (text), self-hosted in `assets/fonts/` as one variable woff2 per style: `dm-sans.woff2`, `fraunces.woff2`, `fraunces-italic.woff2` (weight axis limited to 400–600, opsz kept). They are subset to the characters the site uses plus basic Latin, punctuation and ₹. If you add text with a new character (e.g. an accented letter or symbol), re-subset the fonts from the Google Fonts sources with pyftsubset, or the character falls back to a system font. Every page preloads `dm-sans.woff2` and `fraunces.woff2`. No Google Fonts links.
- Light text never sits on `--emerald` (#428564; contrast too low). Panels with text use `--emerald-deep`, with the text at full opacity. `--emerald` is for accents with no text on them.
- Focus: the default `:focus-visible` outline is `--emerald-deep`. Inside `.dark`, `.head`, `.sheet` and `.price.pick` it is `--ivory`. Contact form fields show focus as a 2px `--emerald-soft` bottom border plus a light background tint instead of an outline.
- `/assets/*` is cached as immutable (`netlify.toml`). Every page loads `main.css?v=N` and `main.js?v=N` (currently `v=10`). Whenever either file changes, bump its `?v=` number on every page, including `404.html`.
- Font preloads must keep `as="font"`, `type="font/woff2"` and `crossorigin`. Without `crossorigin` the browser downloads the font twice.
- The header, footer and contact panel are repeated on every page. Any change to them must be applied to every HTML file (including `404.html`, which uses absolute paths; `contact/` has the footer but no contact panel and no floating WhatsApp button). The floating button appears only after the first screen of scrolling (`main.js`).
- Heading scale: the home H1 is the largest title at every width; inner-page H1s (`.hero.sub h1`) are 90% of it; the contact-panel H2 is capped at ~85% of the inner-page H1. Below 600px, H1 sizes are fluid (home `clamp(2rem, calc(13vw - .65rem), 2.5rem)`, inner `clamp(1.75rem, calc(13vw - .975rem), 2.1875rem)`) so they fit 360–390px phones; inner-page H1 lines flow inline and balance, with letter-spacing -0.025em so "Website&nbsp;development" fits on one line at 390px (elsewhere H1 is -0.015em, H2 -0.012em). The home H1's three lines must stay unbroken at 390, 1024 and 1440.
- Keep these numbers the same everywhere: 4 client projects, 9 keywords at position one (7 Blackbox Learning, 2 Serene Derma), 30 days of free fixes, prices ₹6,000 / ₹12,000 / ₹30,000 / ₹8,000 a month.
- Do not mention Floating City. Do not add testimonials.
- Keep the JSON-LD schema, canonical tags, sitemap.xml and llms.txt in sync with any page or content change. Visible FAQ text must match the FAQPage schema on the same page; title/description must match og: tags and the WebPage/Service schema.
- The short ProfessionalService block in the JSON-LD on inner pages is intentional. It references the full block on the home and services pages by `@id` (`https://jibinjohnson.in/#business`). Don't flag or expand it.
- Respect prefers-reduced-motion. Do not add libraries without asking. Lenis is the only one: self-hosted at `assets/js/lenis.min.js`, pinned to 1.3.27.
- Don't run unnecessary tests.
- After every change, tell me which files you edited.
- Commit after each task I confirm is working, with a short message describing it. Don't commit before I confirm.
