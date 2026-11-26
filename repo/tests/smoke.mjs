import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const file = 'file://' + path.resolve(process.argv[2] || 'recruit-forge.html');
const outDir = process.argv[3] || 'shots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(file);
await page.waitForTimeout(1200);

// skip onboarding if present
const ob = await page.$('#onboard');
if (ob) {
  const visible = await ob.evaluate(el => getComputedStyle(el).display !== 'none' && el.classList.contains('show') || getComputedStyle(el).display !== 'none');
  const skip = await page.$('#ob-skip');
  if (skip && visible) { try { await skip.click({ timeout: 2000 }); } catch {} }
}
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/01-schema.png` });

for (const mod of ['base', 'layout', 'char']) {
  await page.click(`.modtab[data-mod="${mod}"]`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/02-${mod}.png` });
}

// dump some state info
const info = await page.evaluate(() => {
  const r = window.roster ? roster() : null;
  const l = r ? state.model.layouts.find(l => l.id === r.layout) : null;
  return {
    module: state.ui.module,
    schemas: state.model.schemas.map(s => ({ name: s.name, fields: s.fields.length, nodes: s.nodes.length })),
    objects: state.model.objects.length,
    layouts: state.model.layouts.map(l => ({ name: l.name, w: l.canvas.w, h: l.canvas.h, nodes: l.nodes.length })),
    rosters: state.model.rosters.map(r => ({ name: r.name, layout: r.layout })),
    activeRoster: r ? { name: r.name, layout: r.layout, assigns: Object.entries(r.assign).map(([k, v]) => [k, v.length]) } : null,
    activeLayout: l ? { name: l.name, w: l.canvas.w, h: l.canvas.h, nodes: l.nodes.map(n => ({ kind: n.kind, label: n.label, x: n.frame.x, y: n.frame.y, w: n.frame.w, h: n.frame.h, parent: n.parent || null })) } : null,
    charViewHTMLlen: document.querySelector('#char-view')?.innerHTML.length,
  };
});
fs.writeFileSync(`${outDir}/state.json`, JSON.stringify(info, null, 2));
console.log(JSON.stringify(info.activeLayout, null, 1).slice(0, 3000));
console.log('ERRORS(' + errors.length + '):');
errors.slice(0, 40).forEach(e => console.log('  ' + e.slice(0, 300)));
await browser.close();
