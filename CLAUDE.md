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
- Design: clean, light and minimal (Apple/Linear-style marketing pages) with a warm orange accent. The whole site is light: no dark panels.
- Colours come only from the CSS variables at the top of `main.css`: `--bg` #FFFFFF, `--surface` #F6F5F3, `--ink` #1A1714, `--muted` #5F5A54, `--line` #E7E3DD, `--accent` #EA580C, `--accent-ink` #C2410C, `--accent-soft` #FFF1E8. Transparent rgba versions of palette colours (e.g. `--line-strong`) and `color-mix()` of palette colours (button hover) are allowed. theme-color is #FFFFFF.
- Contrast: body text must reach 4.5:1 and large text (24px+) 3:1. `--accent` (3.22–3.56:1) is for decoration and large text only. Buttons, links and small orange text use `--accent-ink` (4.69:1 or better on every background). Secondary text uses `--muted`.
- Font: Plus Jakarta Sans only, self-hosted as one variable woff2 (`assets/fonts/plus-jakarta-sans.woff2`, weights 400–800), subset to the characters the site uses plus basic Latin, punctuation and ₹. If you add text with a new character, re-subset it from the Google Fonts source with pyftsubset, or the character falls back to a system font. `font-display: swap`; every page preloads it with `as="font"`, `type="font/woff2"` and `crossorigin` (without `crossorigin` it downloads twice). No Google Fonts links.
- Type: headings weight 700, letter-spacing -0.03em; body 400 at 17px, line-height 1.65. The home H1 is the largest title at every width; inner-page H1s (`.hero.sub h1`) and the privacy/404 H1 (`.plain h1`) are smaller; H2s smaller again. Below 600px the home H1 is `clamp(2rem, calc(11.4vw - .3rem), 2.5rem)` so each of its three lines stays on one line from 360px. Inner-page H1s below 600px flow inline and balance at `clamp(1.75rem, calc(9.75vw - .25rem), 2.125rem)`, so `Website&nbsp;development` fits at 360px.
- Phone headings: no single word alone on a line in any H1 from 360 to 390px, and no overflow or sideways scroll.
- Layout: sections alternate `--bg` and `--surface` (`.sec` and `.sec.alt`; `.sec.join` continues the previous section as one band; inner pages start with an `.alt` section after the white hero); section spacing `--sec` (64px on phones, about 120px on desktop). Cards (services, why, pricing, projects, industries, process steps) are white with a 1px `--line` border and 16px radius, no heavy shadows. The featured pricing card is `--accent-soft` with an `--accent` border. Contact panel and footer use `--surface`.
- Motion (nothing else): each section's content fades up once (opacity + 16px, 500ms) on entering the viewport (not the hero); one slow marquee of the service names under the home hero; cards lift 4px with a darker border on hover; buttons darken on hover; FAQ answers expand smoothly. All of it is off under prefers-reduced-motion.
- Focus: `:focus-visible` outline is 2px `--accent-ink` everywhere, including form fields.
- `/assets/*` is cached as immutable (`netlify.toml`). Every page loads `main.css?v=N` and `main.js?v=N` (currently `v=15`). Whenever either file changes, bump its `?v=` number on every page, including `404.html`.
- When an image in assets/img changes after launch, add or bump a ?v= on every link to it.
- The header, footer and contact panel are repeated on every page. Any change to them must be applied to every HTML file (including `404.html`, which uses absolute paths; `contact/` has the footer but no contact panel and no floating WhatsApp button). The floating button appears only after the first screen of scrolling (`main.js`).
- Keep these numbers the same everywhere: 4 client projects, 9 keywords at position one (7 Blackbox Learning, 2 Serene Derma), 30 days of free fixes, prices ₹6,000 / ₹12,000 / ₹30,000 / ₹8,000 a month.
- Do not mention Floating City. Do not add testimonials.
- Keep the JSON-LD schema, canonical tags, sitemap.xml and llms.txt in sync with any page or content change. Visible FAQ text must match the FAQPage schema on the same page; title/description must match og: tags and the WebPage/Service schema.
- The short ProfessionalService block in the JSON-LD on inner pages is intentional. It references the full block on the home and services pages by `@id` (`https://jibinjohnson.in/#business`). Don't flag or expand it.
- Respect prefers-reduced-motion. Do not add libraries without asking. The site uses none.
- Don't run unnecessary tests.
- After every change, tell me which files you edited.
- Commit after each task I confirm is working, with a short message describing it. Don't commit before I confirm.
