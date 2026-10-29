(function () {
  // Sortable tables: click a header to sort by that column.
  function cellValue(td) {
    var raw = (td.getAttribute('data-sort') || td.textContent || '').trim();
    var n = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
    return { raw: raw.toLowerCase(), num: /[0-9]/.test(raw) && !isNaN(n) ? n : null };
  }
  document.querySelectorAll('table.sortable').forEach(function (table) {
    var heads = table.querySelectorAll('thead th');
    heads.forEach(function (th, col) {
      th.tabIndex = 0;
      function sort() {
        var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        heads.forEach(function (h) { h.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', dir);
        var body = table.tBodies[0];
        var rows = Array.prototype.slice.call(body.rows);
        rows.sort(function (a, b) {
          var x = cellValue(a.cells[col]), y = cellValue(b.cells[col]);
          var c = (x.num !== null && y.num !== null) ? x.num - y.num : x.raw.localeCompare(y.raw);
          return dir === 'ascending' ? c : -c;
        });
        rows.forEach(function (r) { body.appendChild(r); });
      }
      th.addEventListener('click', sort);
      th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); } });
    });
  });

  // Notes and rating, kept in this browser only.
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  document.querySelectorAll('.notes').forEach(function (box) {
    var key = box.getAttribute('data-key');
    var ta = box.querySelector('textarea');
    var saved = box.querySelector('.saved');
    var timer;
    ta.value = get(key + ':notes') || '';
    ta.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        saved.textContent = set(key + ':notes', ta.value) ? 'Saved in this browser.' : 'This browser is not saving notes right now.';
      }, 400);
    });
    var buttons = box.querySelectorAll('.rating button');
    function show(v) { buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.value === v ? 'true' : 'false'); }); }
    show(get(key + ':rating'));
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { set(key + ':rating', b.value); show(b.value); saved.textContent = 'Rating saved in this browser.'; });
    });
  });

  // Single-file book: show one page at a time, chosen by the link's #name.
  // "#unit3" opens Unit 3 at the top; "#unit3/s3-2" opens it at section 3.2.
  var pages = document.querySelectorAll('section.page');
  function jump(id) {
    var el = id && document.getElementById(id);
    if (el) el.scrollIntoView(); else window.scrollTo(0, 0);
  }
  if (pages.length) {
    document.body.classList.add('paged');
    var shown = null;
    function route() {
      var parts = (location.hash || '#contents').slice(1).split('/');
      var match = null;
      pages.forEach(function (p) { if (p.id === parts[0]) match = p; });
      if (!match) match = pages[0];
      pages.forEach(function (p) { p.classList.toggle('active', p === match); });
      if (match !== shown || parts[1]) jump(parts[1]);
      shown = match;
      fit(); spy();
    }
    window.addEventListener('hashchange', route);
  }

  // Units menu button (narrow screens): opens the same list the wide screen shows on the left.
  function setOpen(open) {
    document.body.classList.toggle('nav-open', open);
    document.querySelectorAll('.navtoggle').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    var head = document.querySelector('section.page.active .runhead') || document.querySelector('.runhead');
    if (head) document.documentElement.style.setProperty('--rh', head.getBoundingClientRect().bottom + 'px');
  }
  document.querySelectorAll('.navtoggle').forEach(function (b) {
    b.addEventListener('click', function () { setOpen(!document.body.classList.contains('nav-open')); });
  });
  document.querySelectorAll('.rail a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });

  // Highlight the section being read in the left list.
  function spy() {
    var scope = document.querySelector('section.page.active') || document;
    var links = scope.querySelectorAll('.r-secs a');
    var cur = null;
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('data-target'));
      if (el && el.getBoundingClientRect().top < 160) cur = a;
    });
    if (links.length && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = links[links.length - 1];
    links.forEach(function (a) {
      a.classList.toggle('here', a === cur);
      if (a === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); }
  }, { passive: true });

  // Mark charts and tables that are wider than the screen, so a "swipe" hint shows.
  function fit() {
    document.querySelectorAll('.drawing, .tablewrap').forEach(function (box) {
      box.classList.toggle('scrolls', box.scrollWidth > box.clientWidth + 2);
    });
  }
  window.addEventListener('resize', fit);

  if (pages.length) route(); else { fit(); spy(); }
})();
