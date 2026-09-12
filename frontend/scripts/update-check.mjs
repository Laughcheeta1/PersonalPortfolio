import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  if(!process.env.CHECK_MOBILE_ONLY){
  const context=await browser.newContext({viewport:{width:900,height:650},locale:'es-CO'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.locator('#music').click();await page.waitForFunction(()=>window.portfolioDebug.music);assert.equal(await page.locator('#music').getAttribute('aria-label'),'Pausar música de fondo');
  await page.locator('#music').click();await page.waitForFunction(()=>!window.portfolioDebug.music);assert.equal(await page.locator('#music').getAttribute('aria-label'),'Activar música de fondo');
  await page.locator('#music').click();await page.waitForFunction(()=>window.portfolioDebug.music);
  assert.equal(await page.locator('html').getAttribute('lang'),'es');
  await page.locator('#language').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.locator('#language').press('ArrowDown');await page.keyboard.press('End');assert.equal(await page.getByRole('menuitemradio',{name:'Español',exact:true}).evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#language-options').isVisible(),false);
  assert.equal(await page.locator('.location-chip, .island-time, #sound').count(),0);
  assert.equal(await page.getByText('Take the scenic route ↗',{exact:true}).count(),0);
  await page.locator('#minimap g').first().hover();assert.equal(await page.locator('#map-tooltip').textContent(),'Projects');
  await page.locator('#minimap g').nth(1).focus();assert.equal(await page.locator('#map-tooltip').textContent(),'Work experience');
  await page.locator('#explore').click();await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.portfolioDebug.player.y>0,{},{timeout:30000});
  await page.waitForFunction(()=>window.portfolioDebug.player.grounded,{},{timeout:30000});
  assert.equal(await page.evaluate(()=>window.portfolioDebug.player.y),0);
  // Regression: holding W must survive a pointer-driven canvas focus and drag.
  await page.keyboard.down('KeyW');
  const before=await page.evaluate(()=>window.portfolioDebug);
  await page.mouse.move(430,300);await page.mouse.down();await page.mouse.move(490,305,{steps:5});await page.mouse.up();
  await page.waitForFunction(({x,z})=>Math.hypot(window.portfolioDebug.player.x-x,window.portfolioDebug.player.z-z)>1.5,before.player,{timeout:30000});
  const after=await page.evaluate(()=>window.portfolioDebug);assert.notEqual(after.camera.yaw,before.camera.yaw);await page.keyboard.up('KeyW');
  await page.waitForFunction(()=>window.portfolioDebug.music);
  assert.equal(await page.evaluate(()=>window.portfolioDebug.music),true);assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#music').getAttribute('aria-label'),'Pause background music');
  await page.locator('#music').click();await page.waitForFunction(()=>!window.portfolioDebug.music);assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#music .mute-slash').isVisible(),true);assert.equal(await page.locator('#music').getAttribute('aria-label'),'Play background music');
  await page.locator('#music').click();await page.waitForFunction(()=>window.portfolioDebug.music);assert.equal(await page.locator('#music .mute-slash').isVisible(),false);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.locator('.landmark-label:visible').count()<7,true);
  assert.deepEqual(errors,[]);console.log('PASS desktop: browser locale, persistent selector, hover/focus tooltip, jump/landing, move while drag, music-only toggle, nearby titles.');
  await context.close();
  }
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'en-US'});
  const mobile=await mobileContext.newPage();
  // Let software-rendered frames settle before sending touch events in headless CI.
  await mobile.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{window.__lastFrame=callback;return window.__pauseFrames?0:raf(callback);};window.__resumeFrames=()=>{window.__pauseFrames=false;raf(window.__lastFrame);};});
  await mobile.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  assert.equal(await mobile.locator('#orientation-tip').isVisible(),true);
  await mobile.locator('#orientation-tip button').click();assert.equal(await mobile.locator('#orientation-tip').isVisible(),false);
  assert.equal(await mobile.locator('#jump').isVisible(),true);assert.equal(await mobile.locator('#run').isVisible(),true);
  await mobile.evaluate(()=>{window.__pauseFrames=true;});await mobile.waitForTimeout(1000);
  await mobile.locator('#jump').tap();await mobile.evaluate(()=>window.__resumeFrames());await mobile.waitForFunction(()=>window.portfolioDebug.player.y>0,{},{timeout:30000});
  await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(300);
  assert.equal(await mobile.locator('#orientation-tip').isVisible(),false);
  assert.equal(await mobile.evaluate(()=>document.body.scrollWidth<=innerWidth),true);
  await mobile.evaluate(()=>{window.__pauseFrames=true;});await mobile.waitForTimeout(1000);await mobile.screenshot({path:'/tmp/portfolio-update-landscape.png',timeout:60000});
  console.log('PASS mobile: portrait recommendation/dismissal, touch jump, run control, landscape sizing.');await mobileContext.close();
}finally{await browser.close();}
