import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
await page.goto(file);
await page.waitForTimeout(1000);
const skip = await page.$('#ob-skip'); if (skip) { try { await skip.click({ timeout: 1500 }); } catch {} }

// 1. validation errors
const val = await page.evaluate(() => validate().map(e => ({ sev: e.sev, msg: e.msg, src: e.src })));
console.log('VALIDATION:', JSON.stringify(val, null, 1));

// 2. schema fields of key schemas
const fields = await page.evaluate(() => {
  const pick = ['Оружие', 'Характеристики', 'Оружие · Стрелковое', 'Оружие · Ближний бой', 'Персонаж · Герой'];
  return state.model.schemas.filter(s => pick.includes(s.name)).map(s => ({
    name: s.name,
    fields: s.fields.map(f => ({ name: f.name, type: f.type, def: f.default, formula: f.formula, removed: !!f.removed })),
  }));
});
console.log('FIELDS:', JSON.stringify(fields, null, 1));

// 3. click-through all visible buttons per module
for (const mod of ['schema', 'base', 'layout', 'char']) {
  await page.click(`.modtab[data-mod="${mod}"]`);
  await page.waitForTimeout(400);
  const btns = await page.$$eval('button', els => els.map((e, i) => ({ i, id: e.id, txt: (e.textContent || '').trim().slice(0, 30), vis: !!(e.offsetWidth || e.offsetHeight) })));
  for (const b of btns) {
    if (!b.vis) continue;
    if (/Удалить|корзину|Сброс|Очистить|remove|del/i.test(b.txt + b.id)) continue; // skip destructive
    const before = errors.length;
    try {
      await page.evaluate(i => document.querySelectorAll('button')[i].click(), b.i);
      await page.waitForTimeout(120);
      // close modal if opened
      await page.evaluate(() => { if (document.querySelector('#modal-backdrop')?.classList.contains('show')) closeModal(); });
    } catch (e) { errors.push('CLICK ' + mod + ' ' + (b.id || b.txt) + ': ' + e.message.slice(0, 120)); }
    if (errors.length > before) console.log(`ERR on [${mod}] button id=${b.id} txt="${b.txt}":`, errors.slice(before).map(e => e.slice(0, 200)));
  }
}
console.log('TOTAL ERRORS:', errors.length);
errors.slice(0, 60).forEach(e => console.log('  ' + e.slice(0, 250)));
await browser.close();
