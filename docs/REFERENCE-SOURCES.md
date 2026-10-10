# Reference sources

Where Round 0's per-section reference board comes from (CLAUDE.md Round 0 step 1). Checked live on **2026-10-09**: status codes with curl, then a real Chrome window for the sites behind bot checks. Terms are paraphrased from each site's own Terms page or robots.txt; re-check a site whenever its terms may have changed. The machine list is `scripts/refs-sources.json`. Keep it in step with this page.

## The flow

1. **Section list:** `npm run refs -- <day> "<category>" --sections` suggests the sections for the business (presets in `refs-sources.json`). The user says OK → `npm run refs -- <day> --approve`.
2. **Search sheet:** `npm run refs:search -- <day>` builds `day<N>/refs/search.html` and opens it in the user's normal browser. Each section gets 5 searches: 2 in the same niche and 3 for any business. Each search uses a different style word, and the words rotate by day. Every search links to Pinterest, Dribbble (plus an animated-shots search) and Behance, and the sheet shows the file names to save as. **The sheet only makes links: nothing reads from those sites.**
3. **Inbox (by hand):** the user browses, saves screenshots (`Cmd+Shift+4`) and short clips (`Cmd+Shift+5`) into `day<N>/refs/inbox/`, named by section (`hero-1.png`, `product-2.mov`), then says **"inbox done"**.
4. **Board:** `npm run refs -- <day> "<category>"`.
   - It sorts the inbox into sections by file name. For files with other names, Claude looks at the image and writes `inbox.json`.
   - The user's items are marked **"mine"** and come first.
   - Each section is then filled up to 3 options from the allowed live sites below: 1 same business + 2 any business, creative/award work before big-brand shops.
   - Each section also gets 1 live clip of hover or motion.
   - Claude writes one "what to take from it" line + tag per option, then `--board`.
5. **Layout options (usual case):** when the inbox covers only some sections, Claude builds 2–3 full-page layout mockups in `day<N>/refs/layouts/`. Any reference can inspire any section, and the sections nobody saved are our own design. The user picks one, and it becomes the DESIGN.md direction.
6. **Picks (when every section is covered):** the user picks 1 per section, saved with `npm run refs -- <day> --pick "hero=B,product=A,…"`. **DESIGN.md** is written from the picks (CLAUDE.md Round 0 step 9).

**Automated column** (the board's live-site fill)
- **yes**: the collector may open it. No clause against it was found, and robots.txt allows the path we use. We stay at human speed: ≤ 30 page loads per run, 2.5–6 s pauses, screenshots and short clips only.
- **no**: browse by hand only. The collector refuses these hosts.

## Live-site galleries the collector uses (to fill sections)

| Source | URL | Login | Best for | Automated | Rule we follow |
|---|---|---|---|---|---|
| Awwwards | awwwards.com | no (optional account for collections) | live motion, WebGL, award-level e-commerce | **yes** | No automated-access clause in the terms. robots.txt disallows `/websites/?` searches, so we only use category pages (`/websites/e-commerce/`, `/fashion/`, `/hotel-restaurant/` …) |
| CSS Design Awards | cssdesignawards.com | no | award sites by industry, UI scores | **yes** | No clause in the terms. robots.txt only blocks DotBot. We use `/website-gallery?industry=` |
| CSS Nectar | cssnectar.com | no | general gallery with real search | **yes** | No clause in the terms. robots.txt allows all |
| One Page Love | onepagelove.com | no | one-page sites, product launches | **yes** | No clause in the legal page. robots.txt disallows `/?s=`, so we only use `/tag/` and `/genre/` pages. It also sells an API |
| Httpster | httpster.net | no | edgy, type-led sites | **yes** | No terms page and no robots.txt. We use `/type/<category>/` |
| Recent (was Godly) | recent.design (godly.website redirects) | no | motion: every entry has a video preview | **yes** | No terms page. robots.txt `Allow: /`. It has no category search, so it gives the newest motion-led sites |

## Browse by hand only (the collector never opens these)

| Source | URL | Login | Best for | Why not automated |
|---|---|---|---|---|
| Dribbble | dribbble.com | **yes** (logged-out search is limited) | UI shots, product-page concepts | The terms ban scraping and automated access faster than a person |
| Pinterest | pinterest.com | **yes** (login wall after a few scrolls) | moodboards | The terms ban access by automated means. robots.txt `Disallow: /` |
| Mobbin | mobbin.com | **yes** (paid) | real app/web screens and flows, incl. `/explore/web/screens/product-detail` | The terms ban copying by scraper or bot |
| Savee | savee.com | **yes** (search needs a login) | visual moodboards | The terms ban scraping or crawling without written permission |
| Page Flows | pageflows.com | **yes** (paid, has a trial) | recorded user flows incl. checkout | Paid. robots.txt disallows `/search` |
| Behance | behance.net | no | case studies, full web mockups | Adobe General Terms ban data scraping |
| Land-book | land-book.com | partial (Pro filters) | landing-page layouts | The terms ban bots, crawlers and scrapers |
| CodePen | codepen.io | no | micro-interactions, hover effects | The terms ban crawling and screen scraping |
| Made in Webflow | webflow.com/made-in-webflow | no | Webflow builds and interactions | The Acceptable Use Policy bans robots and page-scraping |
| Minimal Gallery | minimal.gallery | no | minimal layouts, typography | The legal page bans scraping. Personal viewing is allowed |
| Cosmos | cosmos.so | no | moodboards, motion clips | The terms allow only "generally available" browsers (grey for scripts) |
| Lapa Ninja | lapa.ninja | no | landing pages by category | Terms not verified (a bot check blocked them) |
| SiteInspire | siteinspire.com | no | calm, editorial, typographic sites | Terms not verified (a bot check blocked them) |
| Codrops | tympanus.net/codrops | no | motion and WebGL demos with source | Terms not verified. robots.txt allows search but says `ai-train=no` |
| The FWA | thefwa.com | no | experimental motion, WebGL | Terms not verified (the page needs JavaScript) |
| Muzli | muz.li | no | curated roundups | No clause, but it's articles, not entries. Read by hand |
| Footer.design · Navbar.gallery · Dark Mode Design | footer.design · navbar.gallery · darkmodedesign.com | no | footers · navs and menus · dark UIs | No terms. Section-specific, so useful by hand when planning a nav or footer |
| Collect UI · Refero | collectui.com · refero.design | no · partial (paid) | UI shots · web UI patterns | Not needed by the collector |
| Shopify Theme Store demos | themes.shopify.com/themes | no | live product pages: swatches, zoom, sticky add-to-cart | Terms not checked. Open a theme demo by hand |
| Baymard design examples | baymard.com/ecommerce-design-examples | partial (paywall) | product page, gallery overlay, reviews benchmarks | Partly paywalled. Read by hand |

**Pinterest, Dribbble, Behance:** their terms ban automated access (Pinterest Terms §2a, Dribbble Terms §7.1–7.2, Adobe General Terms §6.6 and §6.18). Reaching them through the search sheet and browsing by hand is the normal use their terms allow.

**Need a login:** Dribbble, Pinterest, Mobbin, Savee and Page Flows. Awwwards is optional. `npm run refs:login` opens the saved-login reference browser with a tab for each, so you can browse by hand with your accounts. The collector uses the same profile only for the allowed live sites, where saved consent choices and bot-check passes help.

**Dead or not useful:** Commerce Cream did not respond. Godly now redirects to Recent.

## Real brand sites per category (live websites, collected with a product page)

`npm run refs` uses these for the same-business slots when the galleries give too few, plus their product pages for the Product detail section. **Skincare** was verified live on 2026-10-09: glossier, rhodeskin, tatcha, necessaire, typology, augustinusbader, byoma, drunkelephant and summerfridays returned 200, and aesop showed a bot check that passes in Chrome. The other lists are well-known premium sites; the run reports any that fail. Add more with `--url`.

| Category | Sites |
|---|---|
| Skincare / beauty | Glossier, Rhode, Tatcha, Nécessaire, Typology, Augustinus Bader, Aesop, Byoma |
| Jewellery | Mejuri, Monica Vinader, Messika, Sophie Buhai, Tiffany & Co., Cartier |
| Fragrance | Le Labo, Byredo, Diptyque, Maison Francis Kurkdjian, Kilian Paris |
| Watches | NOMOS Glashütte, Grand Seiko, Tudor, Baltic, Omega |
| Fashion / apparel | COS, Jacquemus, Toteme, Aimé Leon Dore, Sézane, Arket |
| Footwear | On, Allbirds, Veja, Salomon, Common Projects |
| Furniture / interiors | HAY, Muuto, &Tradition, ferm LIVING, Article, Vitra |
| Coffee / food & drink | Blue Bottle, La Colombe, Graza, Fly By Jing, Ghia, Oatly |
| Tech gadgets | Nothing, Teenage Engineering, Bang & Olufsen, Sonos, Analogue |
| Automotive | Polestar, Rivian, Porsche, Lucid |
| Hotels / hospitality | Aman, Six Senses, Rosewood, Ace Hotel, Belmond |
| Fitness | WHOOP, Tonal, Alo Yoga, Oura, Equinox |

## How we use references (rules)

- **Inspiration only.** The search sheet and board (`day<N>/refs/`) are private and git-ignored, and are never published. Screenshots never go into a site, a reel or a cover.
- **Mix, never copy:** every DESIGN.md section names the user's pick for it and what we take from it, ideas are mixed across sections, and no single site's layout is copied. Nothing may look like a real brand's site, and we never use real brand logos or copy their text.
- **Browse like a person:** ≤ 30 page loads per run, pauses between pages, robots.txt respected, sources with `automated: false` never opened, no bulk downloads.
- **Logins are yours:** the profile is `~/.triozen-ref-browser`, outside every project. It is never committed, copied or printed. Claude never asks for, types or stores a password or cookie.
- **Licences:** any code library added to the kit is MIT, ISC or Apache only. Read any third-party skill before using it.
