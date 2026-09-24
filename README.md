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

* **Engine:** Jekyll on GitHub Pages (builds from `main`)
* **Theme:** `zendesk/jekyll-theme-zendesk-garden@main` (remote theme), with a local `_layouts/default.html` override that adds SEO/Open Graph tags, the RSS link, and site navigation
* **Plugins:** `jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`, `jekyll-remote-theme`
* **Pages:** home, about, press, archive (by month and category), 404
