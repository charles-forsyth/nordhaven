# Nordhaven: The Lodge Chronicle

[![GitHub Pages Deployment](https://img.shields.io/badge/GitHub%20Pages-Live-2ea043?style=flat&logo=github)](https://charles-forsyth.github.io/nordhaven/)
[![Publishing Imprint](https://img.shields.io/badge/Imprint-Nordhaven%20Press-blue?style=flat)](https://charles-forsyth.github.io/nordhaven/press/)

> *"Tales and truths from the Great Nordhaven Lodge, high on a northern Appalachian ridge."*

Source for **Nordhaven** (`https://charles-forsyth.github.io/nordhaven/`), the public chronicle, field journal, and publishing platform of the Great Nordhaven Lodge.

---

## What the site covers

* **Closed-loop animal systems:** a small pastured laying flock, predator-warded housing, deep-litter bedding, nitrogen recycling.
* **Empirical agronomy:** fabric pot cultivation and a three-tea organic protocol (compost root drenches, mycorrhizal inoculation, foliar feeding).
* **Ridge telemetry:** a wireless sensor mesh tracking inversions, microclimates, soil moisture, and weather.
* **The fleet and workshop:** keeping old iron running.
* **Earth-based rhythms:** the seasonal wheel, the runes, and the *Landvaettir*, approached through both reverence and measurement.

---

## Nordhaven Press

The site also hosts **[Nordhaven Press](https://charles-forsyth.github.io/nordhaven/press/)**, the lodge's free open-access imprint. PDFs live in `assets/books/`; the catalog is `press.md`.

---

## Privacy rule for this repo

Nordhaven is published under the lodge's name, not a personal one. Posts, pages, and PDFs must not contain real personal or family names, the employer or institution, the exact location (town, county, road, hill name, precise elevation or coordinates), vendor names, cloud project IDs, IPs, or ticket numbers. Translate specifics into roles and metaphors instead of just deleting them. Private working material (briefings, cluster configs) must never be placed in this directory; `.gitignore` blocks the common patterns as a backstop.

---

## Adding a post

1. `git checkout -b post/<slug>`
2. Create `_posts/YYYY-MM-DD-<slug>.md` with frontmatter: `layout: post`, a double-quoted `title`, `date`, `description` (one sentence, used for link previews), `categories` (from the list below), and `tags`.
3. Keep the body plain ASCII (no em dashes, smart quotes, or emoji). Runes are fine.
4. Open a PR, merge with `--delete-branch`, and delete the local branch.

**Categories** (keep to these so the archive stays tidy): Spiritual, Runic Lore, Astronomy, Hearthcraft, Homesteading, Agronomy, Systems Architecture, Philosophy, Resilience, Press.

---

## Technical architecture

* **Engine:** Jekyll on GitHub Pages (builds from `main`), with Nordhaven's own theme. There is no remote theme any more.
* **Layouts:** `_layouts/default.html` (shell, fonts, search overlay, script), `post.html` (hero, chapter sidebar, tags, series or chronicle pager), `page.html` (hero plus prose, or `raw: true` for full-width bands), `manual.html` (Field Manual chapters).
* **Style:** `assets/css/nordhaven.css`. Night palette by default, a parchment reading mode per browser (`localStorage nh.mode`). Fonts: Cormorant Garamond, Source Serif 4, JetBrains Mono, Noto Sans Runic.
* **Script:** `assets/js/nordhaven.js`, no framework and nothing sent anywhere. It drives the chapter sidebar, the search overlay (`/` or Ctrl+K), Tonight's Measure, the Wheel, the Rune Index, the Chronicle filters and the Press edition picker. It reads two files built by Jekyll: `assets/js/search.json` (every post) and `assets/js/lore.json` (runes and turnings).
* **Data:** `_data/categories.yml` (icons), `_data/runes.yml` (the 24 staves), `_data/sabbats.yml` (the eight turnings), `_data/books.yml` (the Press catalog and editions).
* **Field Manual:** the `_manual/` collection, one file per chapter with `order`, `icon`, `short` and an explicit `permalink`.
* **Pages:** home (`index.html`), Chronicle (`archive.html`), Wheel, Runes, Press, Manual, About, 404.
* **Plugins:** `jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`.
* **CI:** `.github/workflows/check.yml` builds the site with the GitHub Pages gem set and runs `tools/nh_verify.py` (protected names, internal links). A pull request that leaks a name or breaks a link fails.

## How posts drive the site

* `categories:` pick the card icon and the Chronicle filter (keep to the list above).
* `tags:` feed the Rune Index (tag the stave's exact name, e.g. `Isa`), the Wheel (`Wheel of the Year`, plus a turning's name such as `Winter Finding` to pin it to that turning) and the "woven with" filter.
* `series:` and `series_part:` give the post a series pager instead of the date pager.
* A paragraph of only runes (the closing rune line) is centred and enlarged automatically.
* Plain-text code blocks (the measure boxes) are drawn as stone panels.
