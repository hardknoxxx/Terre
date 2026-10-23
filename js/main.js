/* Terre Rouge Iguazú: page behaviour. Everything here enhances content that is already in the HTML. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const OPEN = 7, CLOSE = 23;

  /* ---------- the hour in Puerto Iguazú (UTC-3, no daylight saving) ---------- */
  const iguazuHour = () => {
    const parts = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const h = +parts.find((p) => p.type === 'hour').value;
    const m = +parts.find((p) => p.type === 'minute').value;
    return h + m / 60;
  };
  const fmt = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  // 0 by day, 1 at night: the lamps come on between 18 and 20 h, like the eave of the façade.
  const nightOf = (h) => (h < 6 ? 1 : h < 18 ? 0 : h < 20 ? (h - 18) / 2 : 1);
  const emitHour = (h) => window.dispatchEvent(new CustomEvent('tr:hour', { detail: { hour: h, night: nightOf(h) } }));

  const status = $('[data-status]');
  const statusText = $('[data-status-text]');
  const updateStatus = () => {
    const h = iguazuHour();
    const open = h >= OPEN && h < CLOSE;
    status.classList.toggle('is-open', open);
    if (open) {
      const left = CLOSE - h;
      statusText.textContent = left <= 1
        ? `Abierto ahora · cierra en ${Math.max(1, Math.round(left * 60))} minutos`
        : `Abierto ahora en Iguazú · hasta las 23:00`;
    } else {
      statusText.textContent = `Cerrado ahora · abrimos a las 7:00`;
    }
    window.TR_HOUR = h;
    return h;
  };
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- hero title: words rise one after another ---------- */
  const title = $('.hero__title');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', title.textContent.trim());
    title.innerHTML = words.map((w, n) => `<span class="w" aria-hidden="true"><span style="--n:${n}">${w}</span></span>`).join(' ');
  }

  /* ---------- hour by hour ---------- */
  const hora = $('[data-hora]');
  if (hora) {
    const moments = JSON.parse($('#moments').textContent);
    const range = $('[data-hora-range]');
    const clock = $('[data-hora-clock]');
    const momentEl = $('[data-hora-moment]');
    const desc = $('[data-hora-desc]');
    const picks = $('[data-hora-picks]');
    const note = $('[data-hora-note]');
    const nowBtn = $('[data-hora-now]');
    const lamps = $$('[data-lamprow] span');
    let current = -1;

    const momentFor = (h) => moments.findIndex((m) => h >= m.from && h < m.to);
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    const render = (h, fromUser) => {
      const night = nightOf(h);
      hora.style.setProperty('--night', night.toFixed(3));
      hora.classList.toggle('is-night', night > 0.5);
      const lit = Math.round(night * lamps.length + (h < 9 ? 2 : 0));
      lamps.forEach((l, i) => l.classList.toggle('is-lit', i < lit));
      clock.textContent = fmt(h);
      const i = Math.max(0, momentFor(h));
      const m = moments[i];
      range.setAttribute('aria-valuetext', `${fmt(h)}, ${m.name}`);
      if (i !== current) {
        current = i;
        momentEl.textContent = m.name;
        desc.textContent = m.desc;
        picks.innerHTML = m.items.map((p, n) => `<li class="pick" style="--n:${n}"><span class="pick__pic">${p.img ? `<img src="${p.img}" width="160" height="160" alt="" loading="lazy">` : ''}</span><span class="pick__name">${esc(p.name)}</span><span class="pick__price">${esc(p.price)}</span></li>`).join('');
        if (!reduce.matches) { picks.classList.remove('is-swapping'); void picks.offsetWidth; picks.classList.add('is-swapping'); }
      }
      if (fromUser) emitHour(h);
    };

    const setToNow = () => {
      const h = iguazuHour();
      const open = h >= OPEN && h < CLOSE;
      const v = open ? Math.round(h * 2) / 2 : OPEN;
      range.value = Math.min(CLOSE, Math.max(OPEN, v));
      note.textContent = open
        ? `En Iguazú son las ${fmt(h)}. Mové la hora y mirá qué se sirve en la esquina.`
        : `Ahora la esquina está cerrada: abre a las 7:00. Mové la hora y mirá qué se sirve durante el día.`;
      nowBtn.hidden = true;
      render(+range.value, false);
    };
    range.addEventListener('input', () => {
      nowBtn.hidden = false;
      note.textContent = `Así es la esquina a las ${fmt(+range.value)}.`;
      render(+range.value, true);
    });
    nowBtn.addEventListener('click', () => { setToNow(); emitHour(iguazuHour()); });
    setToNow();
  }

  /* ---------- the menu: tabs, search, preview ---------- */
  const carta = $('[data-carta]');
  if (carta) {
    root.classList.add('js-carta');
    const cats = $$('.cat', carta);
    const tabs = $$('[data-tab]');
    const items = $$('.item', carta);
    const search = $('[data-search]');
    const empty = $('[data-empty]');
    const tabsBar = $('[data-tabs]');
    const cartaTop = () => $('#carta').getBoundingClientRect().top + scrollY;

    const show = (id, scroll) => {
      cats.forEach((c) => (c.hidden = c.dataset.cat !== id));
      tabs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.tab === id)));
      const active = tabs.find((t) => t.dataset.tab === id);
      active && tabsBar.scrollTo({ left: active.offsetLeft - 16, behavior: reduce.matches ? 'auto' : 'smooth' });
      const cat = cats.find((c) => c.dataset.cat === id);
      revealNow(cat);
      const firstPic = cat && $('.item[data-img]', cat);
      firstPic && setPreview(firstPic);
      if (scroll) {
        const y = tabsBar.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(tabsBar).top);
        if (scrollY > y + 4) scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
      }
    };
    tabs.forEach((t) => t.addEventListener('click', (e) => {
      e.preventDefault();
      if (search.value) { search.value = ''; filter(''); }
      show(t.dataset.tab, true);
    }));
    $$('[data-open-cat]').forEach((a) => a.addEventListener('click', () => show(a.dataset.openCat, false)));

    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const filter = (q) => {
      q = norm(q);
      if (!q) {
        items.forEach((it) => (it.hidden = false));
        $$('.sub', carta).forEach((s) => (s.hidden = false));
        empty.hidden = true;
        const cur = tabs.find((t) => t.getAttribute('aria-current') === 'true') || tabs[0];
        show(cur.dataset.tab, false);
        return;
      }
      let total = 0;
      cats.forEach((c) => {
        let n = 0;
        $$('.sub', c).forEach((s) => {
          let k = 0;
          $$('.item', s).forEach((it) => { const hit = it.dataset.q.includes(q); it.hidden = !hit; if (hit) k++; });
          s.hidden = k === 0; n += k;
        });
        c.hidden = n === 0; total += n;
        if (n) revealNow(c);
      });
      tabs.forEach((t) => t.setAttribute('aria-current', 'false'));
      empty.hidden = total > 0;
    };
    let tId;
    search.addEventListener('input', () => { clearTimeout(tId); tId = setTimeout(() => filter(search.value), 120); });

    // index with preview: the frame follows the row the pointer or focus is on
    const preview = $('[data-preview]');
    const pImg = $('[data-preview-img]');
    const pName = $('[data-preview-name]');
    const pPrice = $('[data-preview-price]');
    let pTimer;
    function setPreview(it) {
      if (!preview || !it.dataset.img || pImg.getAttribute('src') === it.dataset.img) return;
      clearTimeout(pTimer);
      preview.classList.add('is-swap');
      pTimer = setTimeout(() => {
        pImg.src = it.dataset.img;
        pName.textContent = it.dataset.name;
        pPrice.textContent = it.dataset.price;
        const done = () => preview.classList.remove('is-swap');
        pImg.complete ? done() : pImg.addEventListener('load', done, { once: true });
      }, 120);
    }
    items.forEach((it) => {
      it.addEventListener('pointerenter', () => setPreview(it));
      it.addEventListener('focus', () => setPreview(it));
    });
    show(tabs[0].dataset.tab, false);
  }

  /* ---------- the bar: one frame, its contents change ---------- */
  const slides = $('[data-slides]');
  if (slides) {
    const imgs = $$('.slides__img', slides);
    const cap = $('[data-slides-cap]');
    let i = 0, timer = null, visible = false;
    const go = (n) => {
      imgs[i].classList.remove('is-on');
      i = (n + imgs.length) % imgs.length;
      imgs[i].loading = 'eager';
      imgs[i].classList.add('is-on');
      cap.textContent = imgs[i].dataset.cap;
    };
    const play = () => { stop(); if (!reduce.matches && visible && !document.hidden) timer = setInterval(() => go(i + 1), 3000); };
    const stop = () => { clearInterval(timer); timer = null; };
    $('[data-slides-next]').addEventListener('click', () => { go(i + 1); play(); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : stop(); }, { threshold: 0.3 }).observe(slides);
    document.addEventListener('visibilitychange', play);
  }

  /* ---------- reservation: the coupon writes a WhatsApp message ---------- */
  const form = $('[data-reserva]');
  if (form) {
    const fecha = form.fecha;
    const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    fecha.min = today;
    const err = $('[data-reserva-error]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = form.nombre.value.trim();
      if (!nombre || !fecha.value) { err.hidden = false; (!nombre ? form.nombre : fecha).focus(); return; }
      err.hidden = true;
      const [y, mo, d] = fecha.value.split('-');
      const dia = new Date(+y, +mo - 1, +d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      const msg = `¡Hola Terre Rouge! Soy ${nombre}. Quisiera reservar una mesa para ${form.personas.value} ${form.personas.value === '1' ? 'persona' : 'personas'} el ${dia} a las ${form.hora.value} h. ¿Tienen disponibilidad?`;
      window.open(`https://wa.me/5493757637686?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });
    // the notches sit where the perforation is
    const coupon = form;
    const placeNotches = () => {
      if (innerWidth < 900) coupon.style.setProperty('--coupon-split', $('.coupon__right', coupon).offsetTop + 'px');
      else coupon.style.removeProperty('--coupon-split');
    };
    placeNotches();
    addEventListener('resize', placeNotches, { passive: true });
  }

  /* ---------- entrances: heading, then text, then picture ---------- */
  const revealEls = $$('[data-reveal], [data-reveal-pic]');
  const groups = new Map();
  revealEls.forEach((el) => {
    const sec = el.closest('section, footer') || document.body;
    if (!groups.has(sec)) groups.set(sec, []);
    const g = groups.get(sec);
    el.style.setProperty('--d', `${Math.min(g.length, 6) * 80}ms`);
    g.push(el);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  // pictures start opening just before they reach the screen, so none is caught half-drawn
  const ioPic = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); ioPic.unobserve(e.target); } });
  }, { rootMargin: '0px 0px 25% 0px', threshold: 0 });
  revealEls.forEach((el) => (el.hasAttribute('data-reveal-pic') ? ioPic : io).observe(el));
  function revealNow(scope) { scope && $$('[data-reveal], [data-reveal-pic]', scope).forEach((el) => el.classList.add('is-in')); }
  // a safety net: nothing stays hidden if the observer never fires
  setTimeout(() => revealEls.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); }), 2500);

  const mark = $('.mark');
  if (mark) {
    $$('.mark__row > span', mark).forEach((s, j) => s.style.setProperty('--j', j));
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { mark.classList.add('is-in'); o.disconnect(); } }, { threshold: 0.01 }).observe(mark);
  }

  /* ---------- the map shows once it has loaded; the drawn plan stays underneath otherwise ---------- */
  const map = $('.visita__map iframe');
  map && map.addEventListener('load', () => map.classList.add('is-loaded'));

  /* ---------- the rating rolls up once ---------- */
  const count = $('[data-count]');
  if (count && !reduce.matches) {
    const target = parseFloat(count.dataset.count);
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1400);
        const v = target * (1 - Math.pow(1 - p, 4));
        count.textContent = v.toFixed(1).replace('.', ',');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 }).observe(count);
  }

  /* ---------- scroll: the folders peel away, the bar takes the colour beneath, the dock appears ---------- */
  const bar = $('[data-bar]');
  const dock = $('[data-dock]');
  const hero = $('.hero');
  const folders = $$('.folder:not(.folder--front)');
  const frontPic = $('.front__pic img');
  const inkSections = $$('[data-ink]');
  const palette = {
    light: ['var(--slate)', 'var(--stone)'],
    dark: ['var(--stone)', 'var(--ink)'],
  };
  const inkFor = (sec) => {
    if (sec.classList.contains('barra')) return ['var(--selva)', 'var(--stone)'];
    if (sec.classList.contains('hora')) return sec.classList.contains('is-night') ? palette.light : palette.dark;
    if (sec.classList.contains('visita')) return ['var(--stone-2)', 'var(--ink)'];
    return palette[sec.dataset.ink] || palette.light;
  };
  const onScroll = () => {
    const y = scrollY;
    const hh = hero.offsetHeight;
    if (!reduce.matches && y < hh) {
      folders.forEach((f) => f.style.setProperty('--peel', `${-y * (0.12 + f.style.getPropertyValue('--i') * 0.07)}px`));
      frontPic && frontPic.style.setProperty('--kb', (1.08 - Math.min(y / hh, 1) * 0.08).toFixed(3));
    }
    const probe = bar.offsetHeight / 2;
    const sec = inkSections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    if (sec) { const [bg, ink] = inkFor(sec); bar.style.setProperty('--bar-bg', bg); bar.style.setProperty('--bar-ink', ink); }
    dock && dock.classList.toggle('is-on', y > hh * 0.6);
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  onScroll();
})();
