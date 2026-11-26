import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const file='file://'+path.resolve('recruit-forge.html');
const browser=await chromium.launch({args:['--no-sandbox']});
const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
const page=await ctx.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const ok=(name,cond)=>{if(!cond)throw Error('FAIL '+name);console.log('PASS',name)};
await page.goto(file); await page.evaluate(()=>{localStorage.setItem('rforge.onboard','1');finishOnboard();saveLocal()});
ok('self-test',await page.evaluate(()=>RForge.selfTest().every(x=>x.ok)));
await page.evaluate(()=>projectDialog());
ok('project modal inert',await page.evaluate(()=>document.querySelector('#app').inert && document.querySelector('#modal-backdrop').classList.contains('open')));
await page.fill('#rf-project-name','Тестовый проект'); await page.click('#rf-project-apply'); await page.waitForTimeout(650);
ok('rename persisted',await page.evaluate(()=>JSON.parse(localStorage.getItem('rforge.autosave')).model.name==='Тестовый проект'));
await page.reload(); await page.waitForTimeout(400);
ok('reload project',await page.evaluate(()=>state.model.name==='Тестовый проект'));
await page.evaluate(()=>setModule('char'));
ok('document budget',await page.locator('.rf-doc-summary').count()===1);
await page.fill('#rf-doc-search','Лазган');
ok('document search',await page.evaluate(()=>[...document.querySelectorAll('.ds-row')].filter(x=>!x.classList.contains('hidden')).length===1));
await page.fill('#rf-doc-search','нет-такого-объекта');
ok('empty search',await page.locator('.rf-doc-empty-search').isVisible());
await page.fill('#rf-doc-search','');
await page.click('#rf-doc-collapse'); ok('collapse all',await page.evaluate(()=>[...document.querySelectorAll('.ds-sec')].every(x=>x.classList.contains('collapsed'))));
await page.click('#rf-doc-expand'); ok('expand all',await page.evaluate(()=>[...document.querySelectorAll('.ds-sec')].every(x=>!x.classList.contains('collapsed'))));
const before=await page.evaluate(()=>histIdx); await page.keyboard.press('Control+z'); ok('undo expand',await page.evaluate(()=>histIdx)===before-1);
await page.evaluate(()=>{state.ui.charDoc=true;renderChar()});
const dl=page.waitForEvent('download'); await page.evaluate(()=>exportHTML()); const html=await dl; const hp=await html.path(); const hs=fs.readFileSync(hp,'utf8'); const hb=hs.slice(hs.indexOf('<body>'));ok('html document export',hb.includes('ds-sheet')&&!hb.includes('sheet-canvas')&&!hb.includes('data-act='));
const pdl=page.waitForEvent('download',{timeout:20000}); const blob=await page.evaluate(()=>exportPNG().then(b=>b.size)); const png=await pdl; ok('png document export',blob>1000 && (await png.path()).length>0);
await page.evaluate(()=>{window.print=()=>{window.__printed=document.querySelector('#print-root')?.innerHTML||''};printSheet()}); ok('print document',await page.evaluate(()=>window.__printed.includes('ds-sheet')&&!window.__printed.includes('sheet-canvas')));
await page.evaluate(()=>{backup('Тестовая копия');state.model.name='Изменено';snapshot('test');});
await page.evaluate(()=>backupDialog()); await page.locator('[data-restore="0"]').click(); await page.waitForTimeout(650);
ok('backup restore',await page.evaluate(()=>state.model.name==='Тестовый проект'));
// Storage failure must not report success or clear dirty.
await page.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')};state.ui.dirty=true;saveLocal()});
ok('storage failure honest',await page.evaluate(()=>state.ui.dirty && document.querySelector('#save-state').dataset.state==='error'));
await page.evaluate(()=>{Storage.prototype.setItem=window.__setItem;saveLocal()});
ok('storage recovery',await page.evaluate(()=>!state.ui.dirty && document.querySelector('#save-state').dataset.state==='saved'));
// Corrupt autosave is preserved and a valid backup is loaded.
await page.evaluate(()=>backup('Перед повреждением'));
const brokenPage=await ctx.newPage();
await brokenPage.addInitScript(()=>localStorage.setItem('rforge.autosave','{broken'));
await brokenPage.goto(file); await brokenPage.waitForTimeout(500);
ok('corrupt recovery',await brokenPage.evaluate(()=>state.model.name==='Тестовый проект'&&localStorage.getItem('rforge.recovery')==='{broken'));
await brokenPage.close();
for(const width of [1440,1024,768,390]){
 await page.setViewportSize({width,height:844});
 for(const mod of ['schema','base','layout','char']){
  await page.evaluate(m=>setModule(m),mod); await page.waitForTimeout(80);
  ok(`no page overflow ${width}/${mod}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.evaluate(()=>setModule('char'));
 if(width<900){await page.click('#btn-inspector'); const box=await page.locator('#rightpanel').boundingBox(); const head=await page.locator('#toolbar').boundingBox(); ok(`mobile inspector below toolbar ${width}`,box.y>=head.y+head.height-1); await page.click('#btn-inspector');}
 await page.screenshot({path:`/tmp/rf7-${width}.png`});
}
ok('no runtime errors',errors.length===0); console.log(errors);
await browser.close();
