import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:800}});
async function prepare(page){await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>{window.__lastFrame=callback;return window.__pauseFrames?0:raf(callback);};window.__resumeFrames=()=>{window.__pauseFrames=false;if(window.__lastFrame)raf(window.__lastFrame);};});}
async function capture(page,path){await page.evaluate(()=>{window.__pauseFrames=true;});await page.waitForTimeout(1000);await page.screenshot({path,timeout:60000});await page.evaluate(()=>window.__resumeFrames());}
await prepare(page);
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
await page.waitForTimeout(1500);
await capture(page,'/tmp/portfolio-desktop.png');
console.log(JSON.stringify({errors,debug:await page.evaluate(()=>window.portfolioDebug)}));
await page.getByRole('button',{name:'Let’s wander'}).click();
await page.keyboard.down('KeyW');await page.waitForFunction(()=>window.portfolioDebug.player.z<4,{},{timeout:60000});await page.keyboard.up('KeyW');await page.waitForTimeout(500);
console.log('movement',JSON.stringify(await page.evaluate(()=>window.portfolioDebug)));
await capture(page,'/tmp/portfolio-playing.png');
assert.equal(errors.length,0);
await page.getByRole('button',{name:/ISLAND MAP/}).click();
await page.locator('[data-destination]').filter({hasText:'Connecting the dots'}).click();
await page.waitForFunction(()=>window.portfolioDebug.companion.state==='GUIDED_TRAVEL'||window.portfolioDebug.companion.state==='AT_DESTINATION');
console.log('guide',JSON.stringify(await page.evaluate(()=>window.portfolioDebug)));
await capture(page,'/tmp/portfolio-guide.png');
await page.close();
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
await prepare(mobile);
await mobile.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});await mobile.waitForTimeout(1000);await capture(mobile,'/tmp/portfolio-mobile.png');
assert.equal(await mobile.locator('#joystick').isVisible(),true);
console.log('mobile',JSON.stringify(await mobile.evaluate(()=>({width:innerWidth,scroll:document.body.scrollWidth,debug:window.portfolioDebug}))));
await browser.close();
