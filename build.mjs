// Builds index.html from src/template.html and data/menu.json.
// Run: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(readFileSync(join(root, 'data/menu.json'), 'utf8'));
let html = readFileSync(join(root, 'src/template.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sentence = (s) => {
  const lower = s.toLowerCase().replace(/terre rouge/g, 'Terre Rouge').replace(/\bterre\b/g, 'Terre');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};
const cleanName = (s) => (s === s.toUpperCase() ? sentence(s) : s);
const byId = Object.fromEntries(menu.map((x) => [x.id, x]));

// The café comes first: it is what the corner is known for.
const CATS = [
  { key: 'CAFETERÍA TERRE ROUGE', id: 'cafeteria', label: 'Cafetería' },
  { key: 'POSTRES Y DESAYUNOS', id: 'dulce', label: 'Desayunos y postres' },
  { key: 'PLATOS PRINCIPALES', id: 'platos', label: 'Platos principales' },
  { key: 'ENSALADAS Y VEGETARIANOS', id: 'ensaladas', label: 'Ensaladas y veggie' },
  { key: 'SANDWICHES Y PICAR', id: 'picar', label: 'Sándwiches y para picar' },
  { key: 'BEBIDAS', id: 'bebidas', label: 'Bebidas' },
  { key: 'VINOS', id: 'vinos', label: 'Vinos' },
];

const item = (x) => {
  const name = cleanName(x.name);
  const pic = x.img
    ? `<span class="item__pic"><img src="img/menu/${x.img}.webp" width="160" height="160" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="item__pic item__pic--none"></span>`;
  const desc = x.desc ? `<span class="item__desc">${esc(x.desc)}</span>` : '';
  const search = `${name} ${x.desc} ${x.sub}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return `<li class="item" tabindex="0" data-q="${esc(search)}" data-name="${esc(name)}" data-price="${esc(x.price)}"${x.img ? ` data-img="img/menu/${x.img}-lg.webp"` : ''}>${pic}<span class="item__text"><span class="item__line"><span class="item__name">${esc(name)}</span><span class="item__price">${esc(x.price)}</span></span>${desc}</span></li>`;
};

let menuHtml = '';
let tabs = '';
for (const [i, c] of CATS.entries()) {
  const items = menu.filter((x) => x.cat === c.key);
  const subs = [...new Set(items.map((x) => x.sub))];
  tabs += `        <a href="#c-${c.id}" data-tab="${c.id}"${i === 0 ? ' aria-current="true"' : ''}>${c.label}</a>\n`;
  menuHtml += `          <section class="cat" id="c-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">\n`;
  menuHtml += `            <header class="cat__head"><h3 id="h-${c.id}">${c.label}</h3><span class="cat__count">${items.length} opciones</span></header>\n`;
  for (const s of subs) {
    menuHtml += `            <div class="sub"><h4 class="sub__title">${esc(sentence(s))}</h4>\n            <ul class="items">\n`;
    menuHtml += items.filter((x) => x.sub === s).map((x) => '              ' + item(x)).join('\n') + '\n';
    menuHtml += `            </ul></div>\n`;
  }
  menuHtml += `          </section>\n`;
}

// Hour by hour: four moments of the corner's day, each with four dishes from the real menu.
const MOMENTS = [
  { from: 7, to: 12, name: 'Desayuno', desc: 'Pan casero, medialunas y el primer café. Lo regional es el mbeyú relleno con chipitas.',
    ids: ['terre-rouge', 'croissant-relleno', 'regional', 'capuchino'] },
  { from: 12, to: 16, name: 'Almuerzo', desc: 'Pescado de río, risotto y ensaladas para el mediodía caliente de Iguazú.',
    ids: ['pacu-con-crema-citrica', 'risotto-de-hongos', 'caesar', 'jugos-naturales'] },
  { from: 16, to: 20, name: 'Merienda', desc: 'Tortas de la vitrina, chipitas recién salidas y cafés fríos o calientes.',
    ids: ['red-velvet', 'porcion-de-chipitas', 'cafe-vienes', 'media-luna-con-jamon-y-queso'] },
  { from: 20, to: 23.5, name: 'Cena y copas', desc: 'Carnes a la chapa, vinos argentinos y cócteles bajo las lámparas encendidas.',
    ids: ['ojo-de-bife-con-reduccion-de-malbec', 'churrasquito-a-la-chapa', 'aperol-spitz', 'luca-malbec'] },
];
const pickData = (id) => {
  const x = byId[id];
  if (!x) throw new Error('Missing menu item: ' + id);
  return { name: cleanName(x.name), price: x.price, img: x.img ? `img/menu/${x.img}.webp` : null };
};
const moments = MOMENTS.map((m) => ({ from: m.from, to: m.to, name: m.name, desc: m.desc, items: m.ids.map(pickData) }));
const pickHtml = (p) => `              <li class="pick"><span class="pick__pic">${p.img ? `<img src="${p.img}" width="160" height="160" alt="" loading="lazy">` : ''}</span><span class="pick__name">${esc(p.name)}</span><span class="pick__price">${esc(p.price)}</span></li>`;

// The bar: in-house photographs of the coffee and cold drinks.
const BARRA = ['capuchino', 'cafe-vienes', 'chocolate-lover', 'frappe-selva-negra-fit', 'ice-cream-pink', 'cafe-mocaccino', 'peach-shake'];
const barra = BARRA.map((id, i) => {
  const x = byId[id];
  return `          <img class="slides__img${i === 0 ? ' is-on' : ''}" src="img/menu/${x.img}-lg.webp" width="720" height="900" alt="${esc(cleanName(x.name))}" data-cap="${esc(cleanName(x.name))} · ${esc(x.price)}" loading="${i === 0 ? 'eager' : 'lazy'}">`;
}).join('\n');
const first = byId[BARRA[0]];

let hours = '';
for (let h = 7; h <= 22; h++) for (const m of ['00', '30']) {
  const v = `${h}:${m}`;
  hours += `              <option value="${v}"${v === '21:00' ? ' selected' : ''}>${v} h</option>\n`;
}

html = html
  .replaceAll('{{MOMENT_DEFAULT_NAME}}', moments[0].name)
  .replace('{{MOMENT_DEFAULT_DESC}}', esc(moments[0].desc))
  .replace('{{MOMENT_DEFAULT_ITEMS}}', moments[0].items.map(pickHtml).join('\n'))
  .replace('{{MOMENTS_JSON}}', JSON.stringify(moments).replace(/</g, '\\u003c'))
  .replace('{{COUNT}}', String(menu.length))
  .replace('{{TABS}}', tabs.trimEnd())
  .replace('{{MENU}}', menuHtml.trimEnd())
  .replace('{{BARRA}}', barra)
  .replace('{{BARRA_FIRST}}', `${esc(cleanName(first.name))} · ${esc(first.price)}`)
  .replace('{{HOURS}}', hours.trimEnd());

if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('Unfilled placeholder: ' + html.match(/\{\{[A-Z_]+\}\}/)[0]);
writeFileSync(join(root, 'index.html'), html);
console.log(`index.html written: ${menu.length} items, ${CATS.length} categories`);
