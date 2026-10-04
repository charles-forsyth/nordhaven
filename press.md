---
title: "Nordhaven Press"
permalink: /press/
nav: Press
kicker: '<i class="fa-solid fa-book"></i> The lodge library'
description: "Free, open-access books from the Great Nordhaven Lodge: Norse cosmology, thermodynamics, soil science and homestead engineering. Every edition is a free PDF."
raw: true
---
<section class="band band-dark">
  <div class="container">
    <div class="book-grid">
      {% for b in site.data.books %}
      <article class="book" id="{{ b.slug }}" data-book>
        <div class="cover" style="--c1: {{ b.c1 }}; --c2: {{ b.c2 }}" aria-hidden="true">
          <div class="cp">Nordhaven Press</div>
          <div class="ct">{{ b.title }}</div>
          <div class="cr">{{ b.rune }}</div>
          <div class="cp">{{ b.chapters }} chapters</div>
        </div>
        <div>
          <div class="meta">{{ b.series }} <span class="sep">|</span> {{ b.editions | size }} edition{% if b.editions.size > 1 %}s{% endif %}</div>
          <h3>{{ b.title }}</h3>
          <p class="sub">{{ b.subtitle }}</p>
          <p>{{ b.premise }}</p>
          {% if b.editions.size > 1 %}
          <label for="ed-{{ b.slug }}">Edition</label>
          <select id="ed-{{ b.slug }}">
            {% for e in b.editions %}<option value="{{ '/assets/books/' | append: e.file | relative_url }}" data-note="{{ e.note | escape }}" data-meta="{{ e.pages }} pages, {{ e.mb }} MB">{{ e.label }}</option>{% endfor %}
          </select>
          {% else %}{% assign e = b.editions[0] %}
          <select hidden aria-hidden="true"><option value="{{ '/assets/books/' | append: e.file | relative_url }}" data-note="{{ e.label }} edition." data-meta="{{ e.pages }} pages, {{ e.mb }} MB">{{ e.label }}</option></select>
          {% endif %}
          <div class="ed-note" data-note></div>
          <a class="btn btn-primary" data-dl href="{{ '/assets/books/' | append: b.editions[0].file | relative_url }}"><i class="fa-solid fa-download"></i> Free PDF</a>
          <span class="book-size" data-meta></span>
        </div>
      </article>
      {% endfor %}
    </div>
  </div>
</section>
<section class="band band-light">
  <div class="container narrow prose">
    <h2>About the editions</h2>
    <p>Most of these books were drafted with large language models under the lodge's direction and then read, corrected and de-identified by hand. Where a book exists in several editions, each was written by a different model, and they really do differ: some go deep on mathematics, some on practice, some on story. The note under each edition says what to expect. Pick the one that suits you, or read two side by side.</p>
    <p>Everything here is free to read, print and share. Treat the numbers in them as you would any reference: check what matters before you rely on it.</p>
    <h2>Dossiers and data</h2>
    <p>Some dispatches carry their own files: research dossiers, charts and the data behind them. Those live with their posts, for example <a href="{{ '/2026/09/29/the-listening-house.html' | relative_url }}">The Listening House</a> and <a href="{{ '/2026/10/02/the-universe-in-a-box.html' | relative_url }}">The Universe in a Box</a>.</p>
  </div>
</section>
