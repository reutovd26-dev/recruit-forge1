import { chromium } from 'playwright';
import path from 'path';

const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
await page.goto(file);
await page.waitForTimeout(1000);
try { await page.click('#ob-skip', { timeout: 1500 }); } catch {}

const cleanup = () => page.evaluate(() => {
  try { if (typeof closeModal === 'function') closeModal(); } catch {}
  document.querySelector('#modal-backdrop')?.classList.remove('open', 'show');
  document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open'));
  const ctx = document.querySelector('#ctx'); if (ctx) ctx.style.display = 'none';
});

for (const mod of ['schema', 'base', 'layout', 'char']) {
  await page.evaluate(m => setModule(m), mod);
  await page.waitForTimeout(400);
  const descs = await page.evaluate(() => [...document.querySelectorAll('button')]
    .map(e => ({ id: e.id, txt: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) }))
    .filter(b => (b.id || b.txt)));
  const seen = new Set();
  for (const b of descs) {
    const key = b.id || b.txt;
    if (seen.has(key)) continue; seen.add(key);
    if (/Удалить|корзину|Сброс|Очистить|Delete|Remove|Trash|Clear|Reset| RU |EN/i.test(key)) continue;
    const before = errors.length;
    const clicked = await page.evaluate(({ id, txt }) => {
      const els = [...document.querySelectorAll('button')].filter(e => e.offsetWidth || e.offsetHeight);
      const el = id ? els.find(e => e.id === id) : els.find(e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) === txt);
      if (!el) return false;
      el.click(); return true;
    }, b);
    if (!clicked) continue;
    await page.waitForTimeout(150);
    if (errors.length > before) {
      console.log(`\n### [${mod}] id="${b.id}" txt="${b.txt}"`);
      errors.slice(before).forEach(e => console.log('   ' + e.slice(0, 400)));
    }
    await cleanup();
    await page.waitForTimeout(60);
  }
}
console.log('\nTOTAL ERRORS:', errors.length);
await browser.close();
