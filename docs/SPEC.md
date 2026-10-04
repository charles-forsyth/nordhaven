# Nordhaven: Site Specification

Status: describes the site as built on 2026-10-04 (the lodge theme, PR #47, and the private term list, PR #48)
Repo: `charles-forsyth/nordhaven` (public), branch `main`
Live: https://charles-forsyth.github.io/nordhaven/
Engine: Jekyll 3.10 through the `github-pages` gem (232), built by GitHub Pages from `main` / root
Last updated: 2026-10-04

This document is public, like the repo. It follows the same privacy rule as the site
(section 3): no real names, places, vendors, employers, addresses, IPs or project IDs.
The steward is "the steward", the place is "the lodge" or "the ridge".

---

## 1. Purpose

Nordhaven is the public chronicle of the Great Nordhaven Lodge: a high-ridge homestead
written about through a Norse earth-faith lens, with real measurement alongside the
reverence. It holds four kinds of writing:

- **Dispatches** (blog posts in `_posts/`): blessings, rune readings, seasonal pieces,
  homestead and garden notes, systems-engineering parables, science stories.
- **The Steward's Field Manual** (`_manual/`): evergreen how-it-is-done chapters.
  Dispatches tell what happened; the manual tells how it is done.
- **Nordhaven Press** (`press.md`, `_data/books.yml`, `assets/books/`): free PDF books,
  some in several editions written by different models.
- **Interactive lore pages**: the Wheel of the Year, the Rune Index and the Chronicle
  (search and filters).

What it must feel like: a hall at night. Warm, quiet, readable for long pieces,
and built with the same bones as the steward's professional site (dark bands, monospace
kickers, card grids, a chapter sidebar), so both sites feel made by the same hands
without sharing a palette or a name.

## 2. Goals and non-goals

Goals:

- Posts stay plain Markdown. Nothing in a post depends on the theme beyond standard
  Markdown and a handful of optional classes (section 9.4).
- Everything interactive runs in the reader's browser from static JSON built at
  publish time. No server, no database, no tracking, no third-party scripts beyond
  fonts and icons.
- Every old URL keeps working. The permalink scheme never changes.
- A privacy gate runs on every pull request so a name cannot reach the live site.
- One person can add a post, a chapter or a book in a few minutes by following
  section 10.

Non-goals:

- Comments, analytics, newsletters, accounts.
- A JavaScript framework or a build step beyond Jekyll itself.
- Server-side search. The JSON index is enough for hundreds of posts (section 13).

## 3. Privacy rule (the most important rule on this site)

Since 2026-09-23 Nordhaven is fully de-identified. Posts, pages, data files, PDFs,
image metadata and this spec must not contain:

- real personal or family names (people or animals), or the steward's own name;
- the employer or institution, colleagues, students;
- the town, county, road, hill name, coordinates or other precise location;
- vendor or shop names, product serial numbers, vehicle plates;
- cloud project IDs, IP addresses, hostnames, ticket numbers, email addresses;
- links to the steward's named professional writing (that would tie the two sites
  together).

Translate specifics into roles and metaphors instead of just deleting them: "the
steward", "the lady of the house", "the ridge cat", "the old truck", "the traveling
house" (the camper), "the cluster of rented machines", "the old helper" (a retired
assistant), "the shop" (any vendor).

How it is enforced:

1. `tools/nh_verify.py` scans every built file for the protected terms and every
   internal link for a target. It prints `VERIFY: CLEAN` or the problems, and exits
   non-zero on any.
2. The protected-term list is itself private. It is a regex alternation read from the
   `NH_PRIV` environment variable (a GitHub Actions secret in CI) or from
   `~/.config/nordhaven/priv.txt` locally (mode 600, directory 700). An allow-list of
   harmless contexts (for example a flower whose name contains a protected word) comes
   from `NH_PRIV_OK` or `~/.config/nordhaven/priv_ok.txt`. Never commit either list.
   If neither is set the script refuses to run (exit 2) rather than pass silently.
3. The `Check` workflow (section 8.3) runs the build and the scan on every PR and push.
4. `.gitignore` blocks common private working files (briefings, work folders,
   `*.env`, keys) as a backstop.
5. `nh_verify.py --pdf` also scans the text of every Press PDF (needs `pdftotext`).

To add a protected term: edit `~/.config/nordhaven/priv.txt` (append `|newterm`), then
update the secret with
`gh secret set NH_PRIV --repo charles-forsyth/nordhaven < ~/.config/nordhaven/priv.txt`.
Do the same for `priv_ok.txt` and `NH_PRIV_OK`.

## 4. Architecture

```
_posts/*.md  _manual/*.md  _data/*.yml  pages (*.html, *.md)
        |            |            |              |
        +------------+-----+------+--------------+
                           |
                 Jekyll 3.10 (github-pages gem)
                 kramdown GFM + rouge, Liquid layouts
                 plugins: jekyll-feed, jekyll-seo-tag, jekyll-sitemap
                           |
        +------------------+-------------------------------+
        |                  |                               |
  static HTML pages   assets/js/search.json         feed.xml, sitemap.xml
  (posts, manual,     assets/js/lore.json           robots.txt
   pages)             (built by Liquid at publish)
        |                  |
        +---- assets/js/nordhaven.js (one plain script, no framework) ----+
              sidebar, search overlay, night/parchment, measure,
              wheel, runes, chronicle filters, press edition picker
```

- Hosting: GitHub Pages, "deploy from a branch" (`main`, `/`), base URL `/nordhaven`
  under `https://charles-forsyth.github.io`. Pages runs its own Jekyll build on every
  push to `main`; the `Check` workflow is a gate, not the deployer.
- `_config.yml` key settings: `baseurl: /nordhaven`, `timezone: Etc/UTC`,
  `permalink: /:year/:month/:day/:title.html`, kramdown `input: GFM`,
  `syntax_highlighter: rouge`, the `manual` collection with `output: true`, layout
  defaults (posts -> `post`, manual -> `manual`, everything else -> `page`), and
  `exclude` (README, Gemfile, vendor, `tools`, `docs`).
- There is no remote theme. Everything visual lives in this repo.

### 4.1 File map

| Path | What it is |
| --- | --- |
| `_config.yml` | Site settings, collections, layout defaults, excludes |
| `Gemfile` | `github-pages` + `webrick` (local builds only; `Gemfile.lock` is ignored) |
| `_layouts/default.html` | HTML shell: head, fonts, icons, CSS, mode bootstrap, header, footer, search overlay, script |
| `_layouts/page.html` | Generic page: optional hero, optional sidebar, or `raw` passthrough |
| `_layouts/post.html` | Dispatch: hero with kicker, sidebar, prose, tags, pager (series-aware) |
| `_layouts/manual.html` | Manual chapter: hero, chapter strip, sidebar, prose, chapter pager |
| `_includes/header.html` | Top bar: brand, nav, search, mode toggle, mobile menu |
| `_includes/footer.html` | Footer: rune row, nav, motto, post count |
| `_includes/post-card.html` | Card used on the home page for latest posts |
| `_includes/search.html` | The search overlay markup |
| `_data/categories.yml` | Category -> icon and blurb (11 categories) |
| `_data/runes.yml` | The 24 Elder Futhark staves in three aettir: name, glyph, gloss, meaning |
| `_data/sabbats.yml` | The eight turnings: name, slug, month, day, md, glyph, blurb |
| `_data/books.yml` | Nordhaven Press catalog: title, subtitle, series, rune, cover colours, editions |
| `_manual/0N-*.md` | Field Manual chapters (5 as of 2026-10-04) |
| `_posts/YYYY-MM-DD-slug.md` | Dispatches (59 as of 2026-10-04) |
| `index.html` | Home page (bands, section 6.1) |
| `archive.html` | The Chronicle: search, category and tag filters, month groups |
| `wheel-of-the-year.html` | The Wheel (inline SVG, section 6.4) |
| `runes.html` | The Rune Index |
| `press.md` | Nordhaven Press library |
| `manual.html` | Field Manual landing page |
| `about.md` | About the lodge |
| `404.html` | Lost on the Ridge |
| `assets/css/nordhaven.css` | The whole theme (about 470 lines) |
| `assets/js/nordhaven.js` | The whole behaviour layer (about 430 lines) |
| `assets/js/search.json` | Liquid template -> post index (section 7.2) |
| `assets/js/lore.json` | Liquid template -> runes + sabbats for the JS |
| `assets/html/search_results.html` | Redirect from the old theme's search URL to the Chronicle |
| `assets/books/*.pdf` | Press PDFs (about 37 MB total) |
| `assets/books/<slug>/` | Per-post dossiers, media and data (for example `universe-in-a-box/media/`) |
| `tools/nh_verify.py` | Privacy + link check (section 3) |
| `.github/workflows/check.yml` | CI gate (section 8.3) |
| `docs/SPEC.md` | This document (excluded from the build) |

## 5. Visual design

### 5.1 Palette ("the hall at night")

CSS custom properties on `:root` in `nordhaven.css`. Change colours only here.

| Token | Night | Parchment | Used for |
| --- | --- | --- | --- |
| `--bg-deep` | `#0c121b` | `#efe7d3` | Page background, dark bands |
| `--bg-surface` | `#121b27` | `#f6f0e1` | Light bands, top bar |
| `--bg-surface-alt` | `#182435` | `#ebe1c9` | Cards, sidebar, panels |
| `--border` | `#26364b` | `#cfc1a0` | Hairlines, card borders |
| `--text-main` | `#e8e0cc` | `#2a2318` | Body text (birch bark) |
| `--text-muted` | `#a3a99f` | `#5d5444` | Secondary text, meta lines |
| `--ember` | `#d0913e` | `#9a5a14` | Headings h2, kickers, accents, primary buttons |
| `--aurora` | `#67bb93` | `#2f7a57` | Links, the "today" hand, blockquote rule |
| `--frost` | `#9cc3d5` | `#3d6f86` | h4, cool accents |
| `--on-ember` | `#1a1208` | `#fbf5e6` | Text on ember buttons |

Parchment mode is `html[data-mode='parchment']`. A tiny inline script in the
`<head>` of `default.html` applies it before first paint from
`localStorage['nh.mode']`, so there is no flash. The toggle is the half-circle button
in the top bar. `meta theme-color` is `#0c121b`.

Contrast rule: body text on its background stays at WCAG AA or better in both modes.
If a new colour is added, check it in both modes.

### 5.2 Type

| Token | Family (Google Fonts) | Role |
| --- | --- | --- |
| `--font-display` | Cormorant Garamond 500/600/700 | h1-h3, card titles, pager titles, the brand |
| `--font-body` | Source Serif 4 (opsz 8-60, 400/600, italic 400) | Prose |
| `--font-ui` | system-ui stack | Sidebar links, tables, small UI |
| `--font-tech` | JetBrains Mono 400/600 | Kickers, labels, chips, meta lines, code |
| `--font-rune` | Noto Sans Runic | Every rune glyph (needed: most systems lack runic glyphs) |

Fonts load from `fonts.googleapis.com` with `display=swap` and preconnects. Icons are
Font Awesome 6.5.2 from cdnjs (`fa-solid ...` class names). Fallbacks are set in each
token so the site still reads if the font CDN is down.

### 5.3 Shapes and motifs

- Radius `--radius: 6px`. Cards and panels: `--bg-surface-alt`, 1 px border, a 3 px
  ember top rule on emphasis panels.
- Bands alternate `band-dark` / `band-light` down a page, like the professional site's
  `section-dark` / `section-light`.
- Kickers: uppercase mono, letter-spaced, ember, with `|` separators
  (`SPIRITUAL / RUNIC LORE | 3 OCTOBER 2026 | 12 MIN READ`).
- `<hr>` in prose renders as a fading line with an Ing rune (U+16DF) in the middle.
- A paragraph made only of runes and spaces becomes a centred `rune-line` (large,
  ember, wide letter-spacing). The JS adds the class.
- Plain-text code fences become carved stone panels (the "measure boxes" in posts):
  gradient slate, ember top rule, inset shadow. Code with a language keeps rouge
  colours muted to the palette.
- The hero has a faint rune row above the kicker on the home page.

### 5.4 Layout and breakpoints

- `.container` max width about 1100 px; `.narrow` for reading-width text blocks.
- Article layout `.doc-layout`: a 250 px sticky sidebar plus `minmax(0, 1fr)` prose;
  `.doc-layout.single` drops the sidebar and caps width at 860 px.
- Breakpoints: 1000 px (sidebar stacks above the text, grids to 2 columns, wheel
  stacks), 860 px (nav collapses to the burger menu), 640 px (single-column cards,
  4-column rune grid, smaller code). Print hides chrome and prints black on white.
- Phone check width is 400 px. Nothing may scroll the page sideways; wide code and
  tables scroll inside their own box.

## 6. Pages

### 6.1 Home (`index.html`, permalink `/`)

Front matter `hero: false` and `raw: true` (it draws its own hero and bands).
Bands, top to bottom:

1. Hero: rune row, kicker, `Nordhaven`, the tagline, a lead line and four buttons
   (Chronicle, Wheel, Runes, Free Books).
2. **Tonight's Measure** (`data-measure`): moon phase disc and percent lit, next
   turning and days to it, rune of the day, current season. Computed in the browser
   (section 7.3). The four cells hold `...` until the JS fills them.
3. **Latest from the Hearth**: the 6 newest posts as cards (`post-card.html`), and a
   button to the Chronicle with the live post count.
4. **The Harvest Moon Week** (`id="harvest-moon-week"`): the series list, filtered by
   `series: "Harvest Moon Week"` and sorted by `series_part`. This band is written for
   that one series; a new featured series means editing this band (section 10.6).
5. **Ways into the Lodge**: three feature cards (Wheel, Runes, Chronicle) and a chip per
   category with its post count (categories with zero posts are hidden).
6. **Nordhaven Press**: the first 4 books from `books.yml` as cards.
7. **The Steward's Field Manual**: chapter strip from the `manual` collection.
8. **The Ridge and the Wire**: the about paragraph, About button, RSS button.

### 6.2 Dispatch (`_layouts/post.html`)

- Title split: `title: "Main: Subtitle"` renders `Main` as h1 and `Subtitle` as h2
  (split on the first `": "`).
- Kicker: icon of the first category, every category (each links to
  `/archive/?cat=...`), the date (`%-d %B %Y`), minutes to read (words / 230, rounded
  up).
- `description` renders as the hero lead.
- Sidebar "In this dispatch": built by JS from the post's h2 headings (and h3s when
  there are fewer than 8 h2s). It only appears when a post has 3 or more h2s;
  otherwise the layout switches to single column. The current section highlights as
  you scroll. Below the list: word count, series position if any, back to top.
- After the prose: tag chips ("Woven through this dispatch"), each linking to
  `/archive/?tag=...`.
- Pager: in a series, previous/next within the series by `series_part`; otherwise
  older/newer by date.

### 6.3 The Chronicle (`archive.html`, `/archive/`)

- Without JS it is a full month-grouped list of every post (Liquid `group_by_exp`), so
  the page is never empty.
- With JS (`data-archive`): a search box, category chips, tag chips (top 14 by count
  among the current results, plus a `+ N more` toggle), a live result line ("12 of 59
  dispatches in Agronomy matching ..."), and month groups (flat list while searching,
  with matches highlighted by `<mark>`).
- State lives in the URL: `?q=`, `?cat=`, `?tag=`. Any filtered view can be shared or
  linked; post kickers and tag chips use this.

### 6.4 The Wheel (`wheel-of-the-year.html`, `/wheel-of-the-year/`)

- An inline SVG (viewBox `-40 0 480 400`, centre 200,200, ring radius 150, inner ring
  62). Yule at the top, the year running clockwise. The dark half (Winter Finding round
  through Yule to Ostara) is shaded.
- Node positions are computed from `sabbats.yml` dates and written into the SVG by
  hand (section 10.8 has the snippet). If a date in `sabbats.yml` changes, recompute
  the SVG too.
- The JS draws the green "today" hand and dot, marks turnings that have posts, and fills
  the side panel for the selected turning: its glyph, blurb, approximate date and every
  dispatch in its season. `#slug` in the URL selects a turning.
- Season assignment: a post belongs to the Wheel when it has the tag
  `Wheel of the Year`. If it also has a turning's name as a tag (for example
  `Winter Nights`), it goes to that turning; otherwise to the season it was written in
  (the last turning on or before its date).

### 6.5 The Rune Index (`runes.html`, `/runes/`)

- Three aettir of eight tiles from `_data/runes.yml`: glyph, name, gloss, and a post
  count. Tiles with no posts are dimmed and read "not yet written".
- A post counts for a rune when one of its tags is exactly the rune's name
  (`Othala`, `Laguz`, `Isa`...). Spelling must match `runes.yml`.
- Clicking a tile opens a detail panel under its aett with the meaning and the list of
  dispatches. `#othala` in the URL opens that rune on load. A `<noscript>` block lists
  the same data without JS.

### 6.6 Nordhaven Press (`press.md`, `/press/`)

- One card per book from `_data/books.yml`. The cover is drawn in CSS from `c1`/`c2`
  (gradient) and `rune`, with the title and chapter count. No cover images.
- Books with several editions get an Edition dropdown; changing it updates the
  download link, the edition note and the "N pages, M MB" line. Single-edition books
  carry a hidden one-option select so the same JS fills their note and size.
- Below the grid: "About the editions" and "Dossiers and data" (links to posts that
  carry their own files).

### 6.7 The Steward's Field Manual (`manual.html` + `_manual/`)

- Landing page: one card per chapter (icon, title, description, minutes to read),
  sorted by `order`.
- Chapter pages (`_layouts/manual.html`): hero with "The Steward's Field Manual |
  Chapter N", a strip of all chapters (current one in ember), the sidebar ("In this
  chapter"), "Last tended" date from `updated`, and previous/next chapter links.
- Chapters as of 2026-10-04: 1 Reading the Runes, 2 Keeping the Wheel, 3 Feeding the
  Living Soil, 4 Readying for Winter, 5 Keeping the Machines Honest.

### 6.8 Other pages

- `about.md` (`/about/`): page layout with sidebar-free prose; front matter `heading`
  overrides the h1, `kicker` is raw HTML.
- `404.html`: Back to the lodge, The Chronicle, and a Search button.
- `assets/html/search_results.html`: forwards the old theme's `?query=` search URL to
  `/archive/?q=`.
- `feed.xml` (jekyll-feed), `sitemap.xml` (jekyll-sitemap), SEO tags (jekyll-seo-tag).

### 6.9 Shared chrome

- Top bar (`header.html`): brand (Ing rune + Nordhaven), nav (Chronicle, Wheel, Runes,
  Press, Manual, About), search button, night/parchment button, burger (under 860 px).
  The current page is marked with `aria-current="page"`, matched on URL or the page's
  `nav:` front matter.
- Footer (`footer.html`): rune row, the same links plus RSS, the motto, "Nordhaven
  Press. Tales told from the Great Nordhaven Lodge. N dispatches."
- Search overlay (`search.html`): opened by the search button, `/` or Ctrl/Cmd+K.
  Arrow keys move, Enter opens, Esc closes.
- Skip link "Skip to the text" for keyboard users.

## 7. Behaviour layer (`assets/js/nordhaven.js`)

One IIFE, `'use strict'`, no dependencies. `window.NH.base` (set in `default.html`)
is the base URL for fetches. JSON files are fetched once and cached in memory. Every
feature checks for its root element and does nothing on pages without it.

### 7.1 Modules, in file order

| Module | Root | What it does |
| --- | --- | --- |
| Mode toggle | `[data-nh-mode]` | Flips `data-mode="parchment"` on `<html>`, saves `nh.mode` |
| Mobile menu | `[data-nh-burger]` | Toggles `#nh-menu.open`, sets `aria-expanded` |
| Rune lines | `.prose > p` | Adds `rune-line` to rune-only paragraphs |
| Sidebar | `[data-toc]` | Builds the chapter list, scroll-spy with IntersectionObserver |
| Search overlay | `#nh-search` | Scored search over `search.json`, keyboard control |
| Measure | `[data-measure]` | Moon, next turning, rune of the day, season |
| Wheel | `[data-wheel]` | Season buckets, today hand, side panel, `#slug` |
| Runes | `[data-runes]` | Counts, detail panel, `#rune` |
| Chronicle | `[data-archive]` | Filters, chips, month groups, URL state |
| Press | `[data-book]` | Edition picker updates link, note and size |

### 7.2 The search index (`assets/js/search.json`)

Built by Liquid at publish time. One object per post:
`t` title, `u` URL (with base), `d` date `YYYY-MM-DD`, `c` categories, `g` tags,
`s` description, `x` the first 900 words of the text with HTML stripped.
Size on 2026-10-04: about 272 KB for 59 posts (about 4.6 KB per post).

Scoring (overlay and Chronicle share it): every search word must match somewhere or
the post is dropped. Per word: title +10, tags +6, categories +4, description +3,
text +1. Ties sort newest first.

### 7.3 The measure (all client-side, local time)

- Moon age: days since the reference new moon 2000-01-06 18:14 UTC, modulo the
  synodic month 29.530588853 days. Percent lit is `(1 - cos(2 pi f)) / 2`. Phase names
  by fraction of the cycle (new, waxing crescent, first quarter, waxing gibbous, full,
  waning gibbous, last quarter, waning crescent). The disc is an SVG path, lit on the
  right while waxing (northern hemisphere). Accurate to within a few hours, which the
  page says.
- Next turning: the nearest date in `sabbats.yml` on or after today (wrapping to next
  year).
- Season: the last turning whose `md` (month*100 + day) is on or before today.
- Rune of the day: `runes[(dayNumber * 7) mod 24]`, where `dayNumber` is days since
  1970-01-01 UTC. The same for every reader on the same date.

## 8. Build, verify, ship

### 8.1 Local build

The scripts live with the Hermes skill `static-site-maintenance`
(`~/.hermes/skills/software-development/static-site-maintenance/scripts/`).

- `nh_build.sh`: production build with the github-pages gem into `/tmp/nhsite`. It
  needs `/tmp/nhbuild` (wiped on reboot); the one-time setup line is in the script
  header:
  `mkdir -p /tmp/nhbuild && cd /tmp/nhbuild && printf 'source "https://rubygems.org"\ngem "github-pages", group: :jekyll_plugins\ngem "webrick"\n' > Gemfile && BUNDLE_PATH=/tmp/nhbuild/vendor bundle install`
  It prints `build exit 0; pages: N`. 74 HTML pages on 2026-10-04.
- `nh_verify.py` (same file as `tools/nh_verify.py` in the repo): privacy + links,
  `--pdf` for book text. Must print `VERIFY: CLEAN`.
- Preview: serve the build under the base path, because every URL starts with
  `/nordhaven`:
  `mkdir -p /tmp/nhprev && ln -sfn /tmp/nhsite /tmp/nhprev/nordhaven && cd /tmp/nhprev && python3 -m http.server 8790`
  then open `http://localhost:8790/nordhaven/`.
- Versions in the gem set: Jekyll 3.10.0, kramdown 2.4.0, rouge 3.30.0, jekyll-feed
  0.17.0, jekyll-seo-tag 2.8.0, jekyll-sitemap 1.4.0. Liquid features newer than
  Jekyll 3.10 (for example `where_exp` with complex expressions, `sort_natural` on
  nested keys) may not exist; test locally.

### 8.2 Git flow

Feature branch -> PR -> `Check` passes -> merge -> delete branch -> Pages builds `main`.
Never push straight to `main`. `nh_ship.sh <branch> "<title>" "<body>"` does the PR
part: it pushes, opens the PR, waits for `Check` (`gh pr checks --watch`; it stops if
the check fails), merges with `--delete-branch`,
cleans up locally and waits until the Pages build reports the merge commit as built.
Commit on the branch first; check `git log main..<branch>` is not empty.

After it ships: fetch the live URL with a cache-buster (`?cb=$(date +%s)`), and take a
desktop and a phone screenshot of anything that changed visually.

### 8.3 CI (`.github/workflows/check.yml`)

Runs on PRs to `main` and pushes to `main`, Ubuntu, Ruby 3.3 with bundler cache:

1. `bundle exec jekyll build -d /tmp/nhsite` with `JEKYLL_ENV=production`.
2. `python3 tools/nh_verify.py` with `NH_SITE=/tmp/nhsite` and the `NH_PRIV` /
   `NH_PRIV_OK` secrets.
3. Plain ASCII in newly added posts: any character outside ASCII and the Runic block
   (U+16A0-U+16FF) fails the run with a file annotation.

`main` has no branch protection, so a red check does not block a manual merge. Treat a
red check as a stop.

## 9. Content conventions

### 9.1 Voice

- First person plural or the steward in third person; warm, plain, unhurried.
  Reverent without being florid. Honest about failures ("what went wrong" belongs in
  the story).
- Plain ASCII: no em or en dashes, no smart quotes, no emojis. Runes are the one
  exception. Old Norse words in their ASCII spellings (Laugardagr, innangard).
- Technical work is told as a parable or a craft story, never as a changelog. The
  machines are "the forge", "the smiths in the dark", "the well", "the fence".

### 9.2 Post front matter

```yaml
---
layout: post
title: "Main Title: The Subtitle"
date: 2026-10-03 23:50:00 +0000
categories: [Spiritual, Runic Lore]
tags: [Othala, Laguz, Heimdall, Autumn]
description: "One or two sentences. Shows as the hero lead, in cards, search and SEO."
series: "Harvest Moon Week"   # optional
series_part: 3                # optional, 0 = prologue
---
```

Rules:

- Always double-quote `title` and `description` (colons break YAML otherwise).
- File name `YYYY-MM-DD-slug.md` with zero-padded month and day.
- **Never date a post later than now in UTC.** Jekyll silently skips future posts; the
  assets publish, the post 404s. Take `date -u` first; the site timezone is UTC.
- Categories must be keys in `_data/categories.yml` (exact spelling) or the kicker and
  card fall back to a generic scroll icon and the chip will be missing on the home page.
  The first category sets the icon.
- Tags drive the Rune Index (a rune's exact name), the Wheel (`Wheel of the Year`,
  optionally a turning's name) and the Chronicle chips. Reuse existing tags where you
  can; check the Chronicle's tag chips first.
- `description` is required in practice: every existing post has one.

### 9.3 The shape of a dispatch (blessings and reflections)

The pattern the evening pieces use (see `2026-10-03-washing-day.md`):

1. An italic one-line framing sentence.
2. `## The Hall at ...` opening scene: time, weather, sky, what the day was.
3. A measure box: a plain code fence (no language) with an ASCII panel of sunrise,
   sunset, daylight, moon, air, work, and the day's runes. It renders as a stone panel.
   Approximate values only ("about 07:07"); no coordinates.
4. `---` then `## Chapter N: Title` sections, each pairing one thing that happened with
   one old story, god or rune.
5. Hails (`**Hail to ...**`), "May ..." lines, a closing blockquote, `**Wes hal.**`
6. A final line of two to four runes on its own (becomes the rune line).

Three or more h2 headings give the post a sidebar automatically.

### 9.4 Optional rich elements

- Figures: `<figure class="nh-sim-figure">` (video or image, caption),
  `nh-sim-hero` (dark framed lead), `nh-sim-strip` (thumbnail row), `nh-sim-pair` (two
  up), `nh-sim-facts` (grid of stat boxes: `<div><b>88 cores</b><span>...</span></div>`),
  `nh-sim-small`, `nh-sim-big`. Example: `2026-10-02-the-universe-in-a-box.md`.
- Media and data for a post go in `assets/books/<post-slug>/` (the folder name is
  historical) and are referenced as `{{ site.baseurl }}/assets/books/<slug>/...`.
- Tables, blockquotes, footnotes and fenced code with a language all work in kramdown
  GFM.
- Do not use Liquid inside Markdown pipe tables; write an HTML table instead.

### 9.5 Manual chapter front matter

```yaml
---
title: "Feeding the Living Soil"
short: "Living soil"          # label in the chapter strip
subtitle: "Fabric pots, three living teas and the rules that keep them alive"
permalink: /manual/living-soil/
order: 3
icon: "fa-solid fa-seedling"
description: "Shown as the hero lead and on the landing card."
updated: 2026-10-04           # "Last tended"
---
```

`permalink` is required: the collection default `/manual/:name/` would keep the
`03-` file prefix in the URL.

## 10. How to

### 10.1 Publish a dispatch

1. `git checkout main && git pull && git checkout -b post/<slug>-YYYY-MM-DD`
2. Write `_posts/YYYY-MM-DD-<slug>.md` (sections 9.1-9.3). Date before `date -u`.
3. `nh_build.sh`; confirm `/tmp/nhsite/YYYY/MM/DD/<slug>.html` exists.
4. `nh_verify.py` -> `VERIFY: CLEAN`. Grep the post for non-ASCII:
   `grep -nP '[^\x00-\x7F\x{16A0}-\x{16FF}]' _posts/<file>`
5. Preview locally (8.1) if it uses figures or anything new.
6. Commit, then `nh_ship.sh post/<slug>-YYYY-MM-DD "Post: <Title>, YYYY-MM-DD" "<one line>"`.
7. Check the live URL with a cache-buster.

### 10.2 Add a Field Manual chapter

1. Create `_manual/0N-<slug>.md` with the front matter in 9.5 and the next `order`.
2. Write it as practice, not story: what, why, the rules, a checklist. De-identify.
3. Build and verify; the landing page, strip, pager and home band pick it up.

### 10.3 Add a Press book or edition

1. Put the PDF in `assets/books/` with a descriptive file name
   (`Title_Words_Model_Version.pdf`). Read its text first:
   `nh_verify.py --pdf` after a build, or `pdftotext file.pdf - | grep -iE '<terms>'`.
2. Get the numbers: `pdfinfo file.pdf | grep Pages` and the size in MB
   (`du -m`, one decimal is fine).
3. Add or extend an entry in `_data/books.yml`:

```yaml
- slug: web-of-wyrd            # anchor id on /press/
  title: "The Web of Wyrd and Entropy"
  subtitle: "..."
  series: "Metaphysics and Physics"
  rune: "ᛈ"                    # one glyph for the cover
  c1: "#24304f"                # cover gradient top
  c2: "#0d1222"                # cover gradient bottom
  chapters: 12
  premise: "One paragraph."
  editions:
    - {label: "Gemini 3.7 Flash", file: "Web_of_Wyrd_Flash_37.pdf", pages: 118, mb: 1.3, note: "What this edition is like."}
```

4. Order in the file is the order on the page; the first 4 also show on the home page.
5. Large PDFs make the repo heavy (the repo is about 41 MB with history). Keep
   editions that are genuinely different.

### 10.4 Add a category

Add a line to `_data/categories.yml`:
`Name: {icon: "fa-solid fa-...", blurb: "One short line"}`. Check the icon exists in
Font Awesome 6.5 free. Keep the list short; 11 categories on 2026-10-04 with counts
Spiritual 33, Philosophy 33, Systems Architecture 27, Homesteading 16, Runic Lore 10,
Hearthcraft 10, Sky and Weather 8, Resilience 5, Agronomy 5, Press 3, Astronomy 1.

### 10.5 Tie a post to a rune or a turning

Add the rune's exact name as a tag (`Fehu`, `Hagalaz`...). For the Wheel add
`Wheel of the Year`, and the turning's name if the post is about that turning. On
2026-10-04 six runes had no posts: Fehu, Hagalaz, Perthro, Berkano, Ehwaz, Mannaz.

### 10.6 Start a new series

Give each post `series: "Name"` and `series_part: 0..n`. The post pager pages through
the series automatically. To feature it on the home page, copy the Harvest Moon Week
band in `index.html` (the `hmw` assign and the `<section id="harvest-moon-week">`),
change the series name, id and text.

### 10.7 Add a page

Create `name.md` or `name.html` with `title`, `permalink: /name/`, optional `kicker`
(raw HTML, usually an icon plus a few words), `description`, and `nav: Name` if it
should light up a nav item. Use `toc: true` for a sidebar, or `raw: true` to write your
own bands. Add it to the nav list in `_includes/header.html` and the footer if it
belongs there.

### 10.8 Change a turning's date or add one

Edit `_data/sabbats.yml` (`month`, `day`, and `md` = month*100 + day). Then recompute
the SVG positions in `wheel-of-the-year.html`:

```python
import math, yaml
from datetime import date
S = yaml.safe_load(open('_data/sabbats.yml'))
for s in S:
    d = date(2025 if s['month'] == 12 else 2026, s['month'], s['day'])
    a = (d - date(2025, 12, 21)).days / 365.2422 * 2 * math.pi
    node = (200 + 150 * math.sin(a), 200 - 150 * math.cos(a))
    spoke_in = (200 + 62 * math.sin(a), 200 - 62 * math.cos(a))
    label = (200 + 172 * math.sin(a), 200 - 172 * math.cos(a))
    print(s['name'], [round(v, 1) for v in node + spoke_in + label])
```

Labels sit about 22 px outside the node; set `text-anchor` to `start` on the right
side, `end` on the left, `middle` at top and bottom. Update the dark-half path to run
from Winter Finding's node to Ostara's node.

### 10.9 Change colours or fonts

Colours: only the tokens in `:root` and `html[data-mode='parchment']` (5.1). Fonts:
the Google Fonts URL in `default.html` plus the `--font-*` tokens. Check both modes,
desktop and 400 px phone, a post with a measure box, the Wheel and the Press page.

### 10.10 Rename or move anything with a URL

Do not. If it is unavoidable, leave a redirect page at the old permalink (see
`assets/html/search_results.html` for the pattern) and check the old sitemap:
every `<loc>` in the live `sitemap.xml` before the change must still resolve in the
new build.

## 11. Accessibility

- Skip link, landmark elements, `aria-current` on nav, `aria-expanded` on the burger
  and rune tiles, `aria-live` on the Wheel panel, rune detail and Chronicle count.
- Wheel turnings are focusable (`tabindex="0"`, `role="button"`) and open with Enter or
  Space.
- Decorative runes carry `aria-hidden="true"`.
- The Chronicle and the Rune Index have no-JS fallbacks; the Wheel panel and the
  measure need JS (the page says so if it fails).

## 12. History

- 2025-03-02: repo created with a remote light theme.
- 2026-09-08 to 09-25: most dispatches written; Nordhaven Press opened.
- 2026-09-23: de-identification of pages, posts and PDFs; categories consolidated;
  plain-ASCII prose; first Wheel and Rune pages.
- 2026-10-04: the lodge theme (PR #47) replaced the remote theme: own layouts and CSS,
  home bands, chapter-sidebar posts, interactive Wheel, Runes and Chronicle, the Press
  library, the Field Manual, and the CI privacy gate. All 81 previously published URLs
  kept. PR #48 moved the protected-term list out of the repo into secrets.

## 13. Known limits and open items

- **The term list was public for one day.** PR #47 committed `tools/nh_verify.py` with
  the protected-term list inline; PR #48 moved it to secrets. The list still exists in
  the git history of the public repo (commit `e20a683`) and in the PR #47 diff on
  GitHub. Removing it fully would need a history rewrite and a force push (and GitHub
  support to purge cached PR views). Decision pending with the steward.
- `search.json` grows about 4.6 KB per post. At around 300 posts (about 1.4 MB) switch
  the `x` field to fewer words or split the index.
- The Wheel SVG is hand-positioned; a date change in `sabbats.yml` needs 10.8.
- The home page's series band is written for Harvest Moon Week only.
- The Field Manual chapters were written from the lodge's real practice; the steward
  should read them once for accuracy.
- Several posts and the home hero say the ridge is "about 1,600 feet up". The privacy
  rule bans precise elevation; a rounded figure has been treated as acceptable. The
  steward's call.
- `nh_ship.sh` relies on the `Check` workflow, but `main` is not protected; a manual
  merge can skip the gate.
