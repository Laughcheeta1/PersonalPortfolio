import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {CSS3DRenderer}=await import('/node_modules/three/examples/jsm/renderers/CSS3DRenderer.js');
    const {PanelSystem}=await import('/src/panels.ts');const {Input}=await import('/src/input.ts');const {landmarks}=await import('/src/world/registry.ts');
    document.body.replaceChildren();const surface=document.createElement('div');surface.id='test-surface';surface.style.cssText='position:fixed;inset:0;background:#cadfce';document.body.append(surface);
    const stick=document.createElement('div');stick.append(document.createElement('span'));const input=new Input(surface,stick,()=>{});
    const renderer=new CSS3DRenderer();renderer.setSize(innerWidth,innerHeight);renderer.domElement.style.cssText='position:fixed;inset:0;pointer-events:none';document.body.append(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,400),panels=new PanelSystem(scene),l=landmarks[0];
    camera.position.set(l.position[0],11,l.position[1]+18);camera.lookAt(l.position[0],7,l.position[1]);camera.updateMatrixWorld();
    const player=new THREE.Vector3(l.position[0],0,l.position[1]+6);
    panels.update(player,camera,1);renderer.render(scene,camera);
    window.__panelInput=input;window.__back=()=>{camera.position.z=l.position[1]-18;camera.lookAt(l.position[0],7,l.position[1]);camera.updateMatrixWorld();panels.update(player,camera,1);renderer.render(scene,camera);};
  });
  const panel=page.locator('.world-panel:visible');assert.equal(await panel.count(),1);
  const iframe=panel.locator('iframe');assert.equal(await iframe.count(),1);
  const panelFrame=page.frameLocator('.world-panel:visible iframe');
  await panelFrame.getByRole('heading',{name:'Big ideas, built to travel.',exact:false}).waitFor();
  assert.equal(await panelFrame.getByRole('heading',{name:'Big ideas, built to travel.',exact:false}).count(),1);
  assert.equal(await panel.evaluate(el=>getComputedStyle(el).userSelect),'text');
  const rect=await panel.boundingBox(),before=await page.evaluate(()=>window.__panelInput.yaw);
  await page.mouse.move(rect.x+40,rect.y+70);await page.mouse.down();await page.mouse.move(rect.x+100,rect.y+90,{steps:3});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.__panelInput.yaw),before);
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.wheel(0,350);await page.waitForTimeout(200);
  assert.ok(await panelFrame.locator('body').evaluate(el=>el.scrollTop+document.documentElement.scrollTop)>0);
  await page.mouse.move(20,400);await page.mouse.down();await page.mouse.move(140,400,{steps:3});await page.mouse.up();assert.notEqual(await page.evaluate(()=>window.__panelInput.yaw),before);
  await page.evaluate(()=>window.__back());assert.equal(await page.locator('.world-panel:visible').count(),1);await page.frameLocator('.world-panel:visible iframe').getByRole('heading',{name:'You found the other side.',exact:true}).waitFor();
  console.log('PASS: backend HTML iframe, internal scroll, pointer isolation, outside camera drag, opposite secret surface.');
  await page.screenshot({path:'/tmp/portfolio-back-panel.png'});
  const chatResult=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js'),{ChatUI}=await import('/src/chat/ChatUI.ts'),{landmarks}=await import('/src/world/registry.ts');
    localStorage.clear();const chat=new ChatUI(new THREE.Scene(),()=>true);chat.speech.setMuted(true);
    await chat.send(`Take me to ${landmarks[0].id}`);await chat.send(`Take me to ${landmarks[1].id}`);
    const history=JSON.parse(localStorage.getItem('portfolio.conversation.v1'));
    const beforeFinish=chat.speech.snapshot.state,first=chat.speech.snapshot.fullText;
    const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,400);camera.position.set(0,10,18);camera.lookAt(0,3,0);
    chat.update(new THREE.Vector3(30,0,0),new THREE.Vector3(),camera,.05);
    const collapsed=chat.object.element.classList.contains('is-far');
    let queuedStarted=false;for(let i=0;i<1000;i++){chat.update(new THREE.Vector3(30,0,0),new THREE.Vector3(),camera,.05);if(chat.speech.snapshot.fullText!==first&&chat.speech.snapshot.state!=='idle'){queuedStarted=true;break;}}
    chat.speech.dispose();return {roles:history.map(m=>m.role),beforeFinish,collapsed,queuedStarted};
  });
  assert.deepEqual(chatResult.roles,['user','assistant','user','assistant']);assert.equal(chatResult.beforeFinish,'received');assert.equal(chatResult.collapsed,true);assert.equal(chatResult.queuedStarted,true);
  console.log('PASS: complete received history persists independently of visual speech; distant chat collapses; queued reply starts in order.');
}finally{await browser.close();}
