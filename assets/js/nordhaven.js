/* Nordhaven site script: no framework, no tracking, nothing leaves the browser. */
(function () {
  'use strict';
  var BASE = (window.NH && window.NH.base) || '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var cache = {};
  function getJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(BASE + path).then(function (r) {
        if (!r.ok) throw new Error(path + ' ' + r.status);
        return r.json();
      });
    }
    return cache[path];
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    var p = iso.split('-');
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  /* ---- night / parchment ---- */
  $$('[data-nh-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      var root = document.documentElement;
      var next = root.getAttribute('data-mode') === 'parchment' ? 'night' : 'parchment';
      if (next === 'parchment') root.setAttribute('data-mode', 'parchment');
      else root.removeAttribute('data-mode');
      try { localStorage.setItem('nh.mode', next); } catch (e) {}
    });
  });

  /* ---- mobile menu ---- */
  $$('[data-nh-burger]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = $('#nh-menu');
      var open = m.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---- rune lines: a paragraph of only runes and spaces ---- */
  $$('.prose > p').forEach(function (p) {
    var t = p.textContent.trim();
    if (t && /^[\u16A0-\u16FF\s]+$/.test(t)) p.classList.add('rune-line');
  });

  /* ---- chapter sidebar ---- */
  var toc = $('[data-toc]');
  if (toc) {
    var article = $('.prose');
    var heads = $$('h2, h3', article).filter(function (h) { return !h.closest('.pager, .post-tags, .series-note'); });
    var h2s = heads.filter(function (h) { return h.tagName === 'H2'; });
    if (h2s.length >= 3) {
      var list = $('[data-toc-list]', toc);
      var useH3 = h2s.length < 8;
      heads.forEach(function (h, i) {
        if (h.tagName === 'H3' && !useH3) return;
        if (!h.id) h.id = 'sec-' + i;
        var li = document.createElement('li');
        li.className = h.tagName === 'H3' ? 'lvl3' : 'lvl2';
        li.innerHTML = '<a href="#' + h.id + '">' + esc(h.textContent.replace(/\s+/g, ' ').trim()) + '</a>';
        list.appendChild(li);
      });
      toc.hidden = false;
      if ('IntersectionObserver' in window) {
        var links = {};
        $$('a', list).forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting && links[e.target.id]) {
              $$('a.active', list).forEach(function (a) { a.classList.remove('active'); });
              links[e.target.id].classList.add('active');
            }
          });
        }, { rootMargin: '-80px 0px -70% 0px' });
        heads.forEach(function (h) { io.observe(h); });
      }
    } else {
      var lay = $('[data-toc-layout]');
      if (lay) lay.classList.add('single');
      toc.remove();
    }
  }

  /* ---- search overlay ---- */
  var ov = $('#nh-search');
  var input = $('#nh-search-input');
  var out = $('#nh-search-results');
  var hl = 0;
  function score(p, terms) {
    var s = 0;
    var T = p.t.toLowerCase(), G = p.g.join(' ').toLowerCase(), C = p.c.join(' ').toLowerCase();
    var S = (p.s || '').toLowerCase(), X = (p.x || '').toLowerCase();
    for (var i = 0; i < terms.length; i++) {
      var w = terms[i], hit = 0;
      if (T.indexOf(w) > -1) hit += 10;
      if (G.indexOf(w) > -1) hit += 6;
      if (C.indexOf(w) > -1) hit += 4;
      if (S.indexOf(w) > -1) hit += 3;
      if (X.indexOf(w) > -1) hit += 1;
      if (!hit) return 0;
      s += hit;
    }
    return s;
  }
  function search(q, posts) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return posts.map(function (p) { return { p: p, s: score(p, terms) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || (a.p.d < b.p.d ? 1 : -1); })
      .map(function (r) { return r.p; });
  }
  function renderOverlay() {
    getJSON('/assets/js/search.json').then(function (posts) {
      var q = input.value.trim();
      if (!q) { out.innerHTML = '<div class="empty">Type a word: Algiz, frost, cluster, Frigg, garlic...</div>'; return; }
      var res = search(q, posts).slice(0, 12);
      hl = 0;
      out.innerHTML = res.length ? res.map(function (p, i) {
        return '<a href="' + p.u + '"' + (i === 0 ? ' class="hl"' : '') + '><span class="sm">' + esc(fmtDate(p.d)) + ' | ' + esc(p.c.join(', ')) + '</span><span class="st">' + esc(p.t) + '</span></a>';
      }).join('') : '<div class="empty">Nothing on the ridge matches that. Try fewer words.</div>';
    });
  }
  function openSearch() {
    if (!ov) return;
    ov.hidden = false;
    input.value = '';
    renderOverlay();
    setTimeout(function () { input.focus(); }, 10);
  }
  function closeSearch() { if (ov) ov.hidden = true; }
  $$('[data-nh-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
  if (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSearch(); });
    input.addEventListener('input', renderOverlay);
    input.addEventListener('keydown', function (e) {
      var items = $$('a', out);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        items[hl].classList.remove('hl');
        hl = (hl + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        items[hl].classList.add('hl');
        items[hl].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && items[hl]) {
        window.location.href = items[hl].getAttribute('href');
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === 'Escape') closeSearch();
    else if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
      e.preventDefault();
      openSearch();
    }
  });

  /* ---- sky and season ---- */
  var SYNODIC = 29.530588853;
  var NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14);
  function moonAge(d) {
    var a = ((d.getTime() - NEW_MOON_REF) / 86400000) % SYNODIC;
    return a < 0 ? a + SYNODIC : a;
  }
  function moonName(age) {
    var f = age / SYNODIC;
    if (f < 0.034 || f > 0.966) return 'New moon';
    if (f < 0.216) return 'Waxing crescent';
    if (f < 0.284) return 'First quarter';
    if (f < 0.466) return 'Waxing gibbous';
    if (f < 0.534) return 'Full moon';
    if (f < 0.716) return 'Waning gibbous';
    if (f < 0.784) return 'Last quarter';
    return 'Waning crescent';
  }
  function moonSVG(age) {
    var f = age / SYNODIC;
    var illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
    var r = 24, cx = 27, cy = 27;
    var waxing = f < 0.5;
    var k = Math.cos(2 * Math.PI * f); // 1 new, -1 full
    var rx = Math.abs(k) * r;
    var lit = 'var(--text-main)', dark = 'var(--bg-deep)';
    // lit limb on the right while waxing (northern hemisphere)
    var sweepOuter = waxing ? 1 : 0;
    var sweepInner = (k > 0) === waxing ? 0 : 1;
    var d = 'M' + cx + ',' + (cy - r) + ' A' + r + ',' + r + ' 0 0,' + sweepOuter + ' ' + cx + ',' + (cy + r) +
      ' A' + rx + ',' + r + ' 0 0,' + sweepInner + ' ' + cx + ',' + (cy - r) + ' Z';
    return { svg: '<svg class="moon-disc" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="24" fill="' + dark + '" stroke="var(--border)" stroke-width="1.5"/><path d="' + d + '" fill="' + lit + '"/></svg>', illum: illum };
  }
  function dayOfYear(d) {
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
  }
  function nextSabbat(sabbats, now) {
    var best = null;
    sabbats.forEach(function (s) {
      var y = now.getFullYear();
      var t = new Date(y, s.month - 1, s.day);
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (t < today) t = new Date(y + 1, s.month - 1, s.day);
      var days = Math.round((t - today) / 86400000);
      if (!best || days < best.days) best = { s: s, days: days };
    });
    return best;
  }
  function currentSeason(sabbats, now) {
    var md = (now.getMonth() + 1) * 100 + now.getDate();
    var sorted = sabbats.slice().sort(function (a, b) { return a.md - b.md; });
    var cur = sorted[sorted.length - 1];
    sorted.forEach(function (s) { if (s.md <= md) cur = s; });
    return cur;
  }
  function seasonOf(sabbats, iso) {
    var p = iso.split('-');
    return currentSeason(sabbats, new Date(+p[0], +p[1] - 1, +p[2]));
  }
  function runeOfDay(runes, now) {
    var n = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return runes[((n * 7) % 24 + 24) % 24];
  }

  var measure = $('[data-measure]');
  if (measure) {
    getJSON('/assets/js/lore.json').then(function (lore) {
      var now = new Date();
      var age = moonAge(now);
      var m = moonSVG(age);
      var ns = nextSabbat(lore.sabbats, now);
      var r = runeOfDay(lore.runes, now);
      var cur = currentSeason(lore.sabbats, now);
      var len = $('[data-m-moon]');
      len.innerHTML = '<div class="label">The moon</div>' + m.svg + '<div class="big" style="font-size:1.35rem">' + moonName(age) + '</div><div class="sub">about ' + Math.round(m.illum * 100) + '% lit, ' + Math.round(age) + ' days old</div>';
      $('[data-m-turn]').innerHTML = '<div class="label">Next turning</div><div class="big">' + esc(ns.s.name) + '</div><div class="sub">' + (ns.days === 0 ? 'today' : 'in ' + ns.days + ' day' + (ns.days === 1 ? '' : 's')) + '</div>';
      $('[data-m-rune]').innerHTML = '<div class="label">Rune of the day</div><div class="big rune">' + r.glyph + '</div><div class="sub"><strong>' + esc(r.name) + '</strong>, ' + esc(r.gloss) + '</div>';
      $('[data-m-season]').innerHTML = '<div class="label">The season</div><div class="big" style="font-size:1.35rem">After ' + esc(cur.name) + '</div><div class="sub">' + esc(cur.blurb) + '</div>';
    }).catch(function () { measure.querySelector('.measure-note').textContent = 'The measure could not be read just now.'; });
  }

  /* ---- Wheel of the Year ---- */
  var wheel = $('[data-wheel]');
  if (wheel) {
    Promise.all([getJSON('/assets/js/lore.json'), getJSON('/assets/js/search.json')]).then(function (res) {
      var lore = res[0], posts = res[1];
      var wheelPosts = posts.filter(function (p) { return p.g.indexOf('Wheel of the Year') > -1; });
      var by = {};
      lore.sabbats.forEach(function (s) { by[s.slug] = []; });
      wheelPosts.forEach(function (p) {
        var named = null;
        lore.sabbats.forEach(function (s) { if (p.g.indexOf(s.name) > -1) named = s; });
        var s = named || seasonOf(lore.sabbats, p.d);
        by[s.slug].push(p);
      });
      var panel = $('[data-wheel-panel]');
      function show(slug) {
        var s = lore.sabbats.filter(function (x) { return x.slug === slug; })[0];
        $$('.turning .node', wheel).forEach(function (n) { n.classList.toggle('sel', n.parentNode.getAttribute('data-slug') === slug); });
        var list = by[slug].slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
        panel.innerHTML = '<div class="kicker">' + (by[slug].length ? by[slug].length + ' dispatch' + (by[slug].length === 1 ? '' : 'es') + ' in this season' : 'No dispatches yet') + '</div>' +
          '<h3>' + esc(s.name) + '<span class="glyph">' + s.glyph + '</span></h3><p>' + esc(s.blurb) + ' <em>Around ' + s.day + ' ' + MONTHS[s.month - 1] + '.</em></p>' +
          (list.length ? '<ul>' + list.map(function (p) { return '<li><small>' + esc(fmtDate(p.d)) + '</small><a href="' + p.u + '">' + esc(p.t) + '</a></li>'; }).join('') + '</ul>' :
            '<p>This turning has not come round on the ridge since the chronicle began. Its dispatches will gather here when it does.</p>');
        try { history.replaceState(null, '', '#' + slug); } catch (e) {}
      }
      $$('.turning', wheel).forEach(function (g) {
        var slug = g.getAttribute('data-slug');
        if (by[slug] && by[slug].length) g.querySelector('.node').classList.add('has');
        g.addEventListener('click', function () { show(slug); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(slug); } });
      });
      // the hand of today
      var now = new Date();
      var yule = new Date(now.getFullYear(), 11, 21);
      if (now < yule) yule = new Date(now.getFullYear() - 1, 11, 21);
      var frac = ((now - yule) / 86400000) / 365.2422;
      var a = frac * 2 * Math.PI;
      var hand = $('[data-now-hand]', wheel), dot = $('[data-now-dot]', wheel);
      var x = 200 + 118 * Math.sin(a), y = 200 - 118 * Math.cos(a);
      hand.setAttribute('x2', x.toFixed(1)); hand.setAttribute('y2', y.toFixed(1));
      dot.setAttribute('cx', (200 + 150 * Math.sin(a)).toFixed(1)); dot.setAttribute('cy', (200 - 150 * Math.cos(a)).toFixed(1));
      var cur = currentSeason(lore.sabbats, now);
      var want = (location.hash || '').slice(1);
      show(by[want] ? want : cur.slug);
    });
  }

  /* ---- Runes ---- */
  var runeRoot = $('[data-runes]');
  if (runeRoot) {
    getJSON('/assets/js/search.json').then(function (posts) {
      $$('.rune-tile', runeRoot).forEach(function (tile) {
        var name = tile.getAttribute('data-rune');
        var hits = posts.filter(function (p) { return p.g.indexOf(name) > -1; });
        tile.querySelector('.count').textContent = hits.length ? hits.length + ' dispatch' + (hits.length === 1 ? '' : 'es') : 'not yet written';
        if (!hits.length) tile.classList.add('empty');
        tile.addEventListener('click', function () {
          var aett = tile.closest('.aett');
          var box = $('.rune-detail', aett);
          var wasSel = tile.classList.contains('sel');
          $$('.rune-tile.sel', runeRoot).forEach(function (t) { t.classList.remove('sel'); t.setAttribute('aria-expanded', 'false'); });
          $$('.rune-detail', runeRoot).forEach(function (b) { b.hidden = true; });
          if (wasSel) { try { history.replaceState(null, '', location.pathname); } catch (e) {} return; }
          tile.classList.add('sel');
          tile.setAttribute('aria-expanded', 'true');
          box.innerHTML = '<div class="rd-head"><div class="rd-glyph">' + tile.getAttribute('data-glyph') + '</div><div><h3>' + esc(name) + '</h3><p>' + esc(tile.getAttribute('data-meaning')) + '</p></div></div>' +
            (hits.length ? '<ul>' + hits.map(function (p) { return '<li><a href="' + p.u + '">' + esc(p.t) + '</a> <small class="muted">' + esc(fmtDate(p.d)) + '</small></li>'; }).join('') + '</ul>' :
              '<p style="margin-top:12px"><em>No dispatch has worked with this stave yet.</em></p>');
          box.hidden = false;
          try { history.replaceState(null, '', '#' + name.toLowerCase()); } catch (e) {}
        });
      });
      var want = (location.hash || '').slice(1).toLowerCase();
      if (want) {
        var t = $$('.rune-tile', runeRoot).filter(function (x) { return x.getAttribute('data-rune').toLowerCase() === want; })[0];
        if (t) { t.click(); t.scrollIntoView({ block: 'center' }); }
      }
    });
  }

  /* ---- Chronicle (archive) ---- */
  var arch = $('[data-archive]');
  if (arch) {
    getJSON('/assets/js/search.json').then(function (posts) {
      var params = new URLSearchParams(location.search);
      var state = { q: params.get('q') || '', cat: params.get('cat') || '', tag: params.get('tag') || '' };
      var qIn = $('[data-arch-q]', arch), list = $('[data-arch-list]', arch), count = $('[data-arch-count]', arch);
      var catBox = $('[data-arch-cats]', arch), tagBox = $('[data-arch-tags]', arch);
      qIn.value = state.q;
      var cats = {};
      posts.forEach(function (p) { p.c.forEach(function (c) { cats[c] = (cats[c] || 0) + 1; }); });
      var showAllTags = false;
      function chips(box, obj, key, limit) {
        var keys = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a] || (a < b ? -1 : 1); });
        var hidden = 0;
        if (limit && !showAllTags && keys.length > limit) {
          var keep = keys.slice(0, limit);
          if (state[key] && keep.indexOf(state[key]) < 0) keep.push(state[key]);
          hidden = keys.length - keep.length;
          keys = keep;
        }
        box.innerHTML = keys.map(function (k) {
          return '<button type="button" class="chip' + (state[key] === k ? ' on' : '') + '" data-k="' + esc(k) + '">' + esc(k) + '<span class="n">' + obj[k] + '</span></button>';
        }).join('') + (limit && (hidden || showAllTags) && Object.keys(obj).length > limit ? '<button type="button" class="chip" data-more>' + (showAllTags ? 'fewer' : '+ ' + hidden + ' more') + '</button>' : '');
        $$('button[data-k]', box).forEach(function (b) {
          b.addEventListener('click', function () {
            var k = b.getAttribute('data-k');
            state[key] = state[key] === k ? '' : k;
            render();
          });
        });
        var more = $('button[data-more]', box);
        if (more) more.addEventListener('click', function () { showAllTags = !showAllTags; render(); });
      }
      function mark(text, terms) {
        var s = esc(text);
        terms.forEach(function (w) {
          if (w.length < 2) return;
          s = s.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
        });
        return s;
      }
      function render() {
        var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
        var res = terms.length ? search(state.q, posts) : posts.slice();
        if (state.cat) res = res.filter(function (p) { return p.c.indexOf(state.cat) > -1; });
        if (state.tag) res = res.filter(function (p) { return p.g.indexOf(state.tag) > -1; });
        // categories count over the search/tag result; tags count over the search/category result
        var forCats = terms.length ? search(state.q, posts) : posts.slice();
        if (state.tag) forCats = forCats.filter(function (p) { return p.g.indexOf(state.tag) > -1; });
        var forTags = terms.length ? search(state.q, posts) : posts.slice();
        if (state.cat) forTags = forTags.filter(function (p) { return p.c.indexOf(state.cat) > -1; });
        var cc = {}, tc = {};
        forCats.forEach(function (p) { p.c.forEach(function (c) { cc[c] = (cc[c] || 0) + 1; }); });
        forTags.forEach(function (p) { p.g.forEach(function (t) { if (cats[t] === undefined) tc[t] = (tc[t] || 0) + 1; }); });
        if (state.cat && !cc[state.cat]) cc[state.cat] = 0;
        if (state.tag && !tc[state.tag]) tc[state.tag] = 0;
        chips(catBox, cc, 'cat');
        chips(tagBox, tc, 'tag', 14);
        var label = res.length + ' of ' + posts.length + ' dispatches';
        if (state.cat) label += ' in ' + state.cat;
        if (state.tag) label += ' woven with ' + state.tag;
        if (terms.length) label += ' matching "' + state.q + '"';
        count.textContent = label;
        var html = '', month = '';
        res.forEach(function (p) {
          var mk = p.d.slice(0, 7);
          if (!terms.length && mk !== month) {
            if (month) html += '</div>';
            month = mk;
            var parts = mk.split('-');
            html += '<div class="month-group"><h3>' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+parts[1] - 1] + ' ' + parts[0] + '</h3>';
          }
          html += '<div class="post-row"><div class="d">' + esc(fmtDate(p.d)) + '</div><div><div class="m">' + esc(p.c.join(' / ')) + '</div><a class="t" href="' + p.u + '">' + mark(p.t, terms) + '</a>' + (p.s ? '<p>' + mark(p.s, terms) + '</p>' : '') + '</div></div>';
        });
        if (!terms.length && month) html += '</div>';
        list.innerHTML = html || '<p class="muted">Nothing matches. Clear a filter or try another word.</p>';
        var qs = new URLSearchParams();
        if (state.q) qs.set('q', state.q);
        if (state.cat) qs.set('cat', state.cat);
        if (state.tag) qs.set('tag', state.tag);
        try { history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '')); } catch (e) {}
      }
      qIn.addEventListener('input', function () { state.q = qIn.value.trim(); render(); });
      $('[data-arch-clear]', arch).addEventListener('click', function () { state = { q: '', cat: '', tag: '' }; qIn.value = ''; render(); });
      render();
    });
  }

  /* ---- Press: edition picker ---- */
  $$('[data-book]').forEach(function (book) {
    var sel = $('select', book), btn = $('[data-dl]', book), note = $('div.ed-note', book), meta = $('span[data-meta]', book);
    if (!sel) return;
    function upd() {
      var o = sel.options[sel.selectedIndex];
      btn.setAttribute('href', o.value);
      note.textContent = o.getAttribute('data-note') || '';
      meta.textContent = o.getAttribute('data-meta') || '';
    }
    sel.addEventListener('change', upd);
    upd();
  });
})();
