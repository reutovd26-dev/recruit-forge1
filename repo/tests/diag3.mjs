import { chromium } from 'playwright';
import path from 'path';

const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message).split('\n').slice(0, 4).join(' | ')));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
await page.goto(file);
await page.waitForTimeout(1000);
try { await page.click('#ob-skip', { timeout: 1500 }); } catch {}

// open every modal-opening button and click everything inside the modal
const openers = [
  ['schema', 'Проверить'], ['schema', 'Дизайн'], ['schema', 'Результат'], ['schema', 'Слои'], ['schema', 'Граф'], ['schema', 'Выровнять'], ['schema', 'Поиск'],
  ['base', 'Корзина'], ['base', 'Импорт'], ['base', 'Экспорт объектов'], ['base', 'Клавиши грида'], ['base', 'Массовая правка'], ['base', 'Изменить выделенные'], ['base', 'Диапазон'],
  ['layout', 'Холст'], ['layout', 'Слои'], ['layout', 'Граф'], ['layout', 'Поиск'], ['layout', 'Формат'],
  ['char', 'Экспорт'], ['char', 'Данные'], ['char', 'Формат'], ['char', 'Наполнить'],
];
for (const [mod, label] of openers) {
  await page.evaluate(m => setModule(m), mod);
  await page.waitForTimeout(300);
  const opened = await page.evaluate(txt => {
    const els = [...document.querySelectorAll('button')].filter(e => (e.offsetWidth || e.offsetHeight) && (e.textContent || '').includes(txt));
    if (!els.length) return false; els[0].click(); return true;
  }, label);
  if (!opened) { console.log(`[${mod}] opener "${label}" NOT FOUND`); continue; }
  await page.waitForTimeout(250);
  const modalOpen = await page.evaluate(() => document.querySelector('#modal-backdrop')?.classList.contains('open'));
  if (!modalOpen) { console.log(`[${mod}] "${label}" — no modal (maybe drawer/toggle)`); continue; }
  // click each button inside modal (skip destructive)
  const n = await page.evaluate(() => document.querySelectorAll('#modal button').length);
  for (let i = 0; i < n; i++) {
    const before = errors.length;
    const info = await page.evaluate(i => {
      const b = document.querySelectorAll('#modal button')[i];
      if (!b) return null;
      const txt = (b.textContent || '').trim().slice(0, 30);
      if (/Удалить|Очистить|Сброс|корзин/i.test(txt)) return { skipped: txt };
      b.click(); return { txt };
    }, i);
    await page.waitForTimeout(120);
    if (info && errors.length > before) console.log(`### [${mod}/${label}] modal btn "${info.txt}":`, errors.slice(before).map(e => e.slice(0, 300)));
    // if modal closed by action, stop
    const still = await page.evaluate(() => document.querySelector('#modal-backdrop')?.classList.contains('open'));
    if (!still) break;
  }
  await page.evaluate(() => { try { closeModal(); } catch {} document.querySelector('#modal-backdrop')?.classList.remove('open'); });
}
console.log('TOTAL ERRORS:', errors.length);
errors.slice(0, 30).forEach(e => console.log('  ' + e.slice(0, 350)));
await browser.close();
