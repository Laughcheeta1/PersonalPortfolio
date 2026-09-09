import './style.css';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DSprite } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { config } from './config';
import { landmarks, type LandmarkId } from './world/registry';
import { createLandmark } from './world/models';
import { createEnvironment } from './world/environment';
import { Atmosphere } from './world/atmosphere';
import { Player, Companion } from './world/actors';
import { Input } from './input';
import { PanelSystem } from './panels';
import { ChatUI } from './chat/ChatUI';
import { AmbientAudio } from './chat/AmbientAudio';
import { damping } from './world/physics';
import { distance } from './world/navigation';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<main id="world" aria-label="Interactive island portfolio"></main>
<header class="masthead"><a href="#" class="brand" aria-label="A little world home"><span class="brand-mark">✳</span><span>a little world<span class="brand-caption">A PERSONAL PORTFOLIO</span></span></a><div class="top-right"><span class="island-time"><i></i> A GOOD DAY TO EXPLORE</span><button id="sound" class="round-button" aria-label="Unmute audio" title="Unmute audio">♪<span class="mute-slash">/</span></button><button id="help" class="round-button" aria-label="Show controls">?</button></div></header>
<aside class="welcome"><span class="eyebrow"><span class="tiny-star">✦</span> WELCOME TO MY CORNER OF THE WORLD</span><h1>Big ideas.<br>A little island.</h1><p>Follow your curiosity. Every path<br>has a story to tell.</p><button id="explore" class="explore-button">Let’s wander <span>↗</span></button><div class="welcome-foot">7 places to discover <span>·</span> Make yourself at home</div></aside>
<aside class="location-chip"><span class="location-icon">⌁</span><div><small>YOU ARE EXPLORING</small><strong id="location">The greenway</strong></div></aside>
<div class="guide-hint"><span>✦</span><p>A friend for the journey<small>Walk up to your guide to say hello.</small></p></div>
<aside class="map-card"><button id="map-toggle" aria-expanded="false"><span>⌘ &nbsp; ISLAND MAP</span><span id="discovered">0 / 7</span></button><svg id="minimap" viewBox="-112 -43 181 86" aria-label="Island map"><ellipse cx="-23" cy="0" rx="83" ry="35" fill="#b9cda4"/><path d="M-87 2 L-65 1 L-43 -1 L-14 -1 L7 1 L29 2" fill="none" stroke="#fff0ce" stroke-width="3"/>${landmarks.map((l,i)=>`<g><circle cx="${l.position[0]}" cy="${l.position[1]}" r="3" fill="${l.color}" stroke="#fff9e9" stroke-width="1"/><text x="${l.position[0]}" y="${l.position[1]+1.1}" text-anchor="middle">${i+1}</text></g>`).join('')}<circle id="map-player" r="2.4" fill="#244b42" stroke="white" stroke-width="1"/></svg><div class="map-legend"><span><i></i> You are here</span><span>Take the scenic route ↗</span></div></aside>
<nav class="destination-list" aria-label="Guide destinations" hidden><header><span>WHERE TO?</span><button id="map-close" aria-label="Close destinations">×</button></header><p>Your guide will lead the way.</p>${landmarks.map((l,i)=>`<button data-destination="${l.id}"><span class="destination-number" style="background:${l.color}">${i+1}</span><span><strong>${l.title}</strong><small>${l.subtitle}</small></span><span>↗</span></button>`).join('')}</nav>
<footer class="controls"><span><kbd>W</kbd><span class="keys-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span>Move</span><i></i><span class="mouse-icon">↔</span><span>Drag to look</span><i></i><kbd>shift</kbd><span>Take a little run</span></footer>
<div id="joystick" aria-label="Drag to move" role="application"><span></span></div><span class="touch-hint">Drag the world to look around</span>
<dialog id="help-dialog"><button class="dialog-close" aria-label="Close controls">×</button><span class="eyebrow">A FIELD GUIDE</span><h2>A world at your pace.</h2><p>Walk with <strong>WASD</strong> or the arrow keys. Hold <strong>Shift</strong> to run. Drag the world to look around. On touchscreens, use the thumbstick to move.</p><p>Approach a landmark to open its notebook. Walk behind it to discover the other side. You can type, select text, and scroll inside each notebook.</p><p>Your companion waits nearby. Walk up to chat, or choose a place on the island map for a guided walk.</p><button class="explore-button dialog-done">Got it. Let’s explore ↗</button></dialog><div id="notice" role="status"></div>`;

const world=document.querySelector<HTMLElement>('#world')!;
let renderer:THREE.WebGLRenderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});} catch {
  world.innerHTML='<div class="webgl-error"><h2>This little world needs WebGL.</h2><p>Try a browser with hardware acceleration enabled. You can still browse the island’s destinations from the map.</p></div>';throw new Error('WebGL is not available');
}
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?config.performance.mobileDpr:config.performance.maxDpr));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(config.atmosphere.sky);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;world.append(renderer.domElement);
const cssRenderer=new CSS3DRenderer();cssRenderer.setSize(innerWidth,innerHeight);cssRenderer.domElement.className='spatial-dom';world.append(cssRenderer.domElement);
const scene=new THREE.Scene(),domScene=new THREE.Scene();
const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment();scene.environment=pmrem.fromScene(studio).texture;scene.environmentIntensity=config.atmosphere.environmentIntensity;renderer.toneMappingExposure=config.atmosphere.exposure;studio.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(config.camera.fov,innerWidth/innerHeight,config.camera.near,config.camera.far);
const atmosphere=new Atmosphere(scene),environment=createEnvironment();scene.add(environment.group);
const obstacles=[...environment.obstacles,...landmarks.map(l=>({x:l.position[0],z:l.position[1],radius:l.collisionRadius}))];
const player=new Player(false,obstacles),companion=new Companion(true,obstacles);player.model.position.set(...[config.player.spawn[0],0,config.player.spawn[1]] as [number,number,number]);companion.model.position.set(3,0,5);scene.add(player.model,companion.model);
const labels: {object:CSS3DSprite;position:THREE.Vector3;id:LandmarkId}[]=[];
for(const [i,landmark] of landmarks.entries()){
  const model=createLandmark(landmark.model);model.position.set(landmark.position[0],0,landmark.position[1]);model.rotation.y=landmark.rotation;model.scale.setScalar(landmark.scale);scene.add(model);
  const element=document.createElement('div');element.className='landmark-label';element.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><div><small>${landmark.subtitle}</small><strong>${landmark.title}</strong></div>`;
  const label=new CSS3DSprite(element);element.style.pointerEvents='none';label.position.set(landmark.position[0],config.ui.labelHeight,landmark.position[1]+(landmark.position[1]<0?4:-4));label.scale.setScalar(config.ui.labelScale);domScene.add(label);labels.push({object:label,position:model.position,id:landmark.id});
}
const panels=new PanelSystem(domScene),chat=new ChatUI(domScene,id=>companion.guide(id));let muted=true;chat.speech.setMuted(muted);
const ambientAudio=new AmbientAudio();
const input=new Input(renderer.domElement,document.querySelector('#joystick')!,()=>{chat.speech.unlockAudio();ambientAudio.unlock();});input.yaw=.18;
const target=new THREE.Vector3(),desiredCamera=new THREE.Vector3();
function cameraUpdate(dt:number,immediate=false){
  target.copy(player.model.position).y+=config.camera.height;
  desiredCamera.set(Math.sin(input.yaw)*Math.cos(input.pitch)*config.camera.distance,Math.sin(input.pitch)*config.camera.distance,Math.cos(input.yaw)*Math.cos(input.pitch)*config.camera.distance).add(target);
  camera.position.lerp(desiredCamera,immediate?1:damping(config.camera.smoothing,dt));camera.lookAt(target);
}
cameraUpdate(0,true);
let started=false;const notice=document.querySelector<HTMLElement>('#notice')!;let noticeTimeout:ReturnType<typeof setTimeout>;
const announce=(message:string)=>{notice.textContent=message;notice.classList.add('shown');clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>notice.classList.remove('shown'),4500);};
function start(){started=true;document.body.classList.add('exploring');chat.speech.unlockAudio();input.clear();renderer.domElement.focus();}
document.querySelector('#explore')!.addEventListener('click',start);
const dialog=document.querySelector<HTMLDialogElement>('#help-dialog')!;document.querySelector('#help')!.addEventListener('click',()=>{input.clear();dialog.showModal();});for(const el of dialog.querySelectorAll('button'))el.addEventListener('click',()=>dialog.close());
document.querySelector('#sound')!.addEventListener('click',()=>{muted=!muted;chat.speech.unlockAudio();chat.speech.setMuted(muted);ambientAudio.unlock();ambientAudio.setMuted(muted);const button=document.querySelector('#sound')!;button.setAttribute('aria-label',muted?'Unmute audio':'Mute audio');button.classList.toggle('unmuted',!muted);});
const list=document.querySelector<HTMLElement>('.destination-list')!,toggle=document.querySelector('#map-toggle')!;
function toggleMap(open:boolean){list.hidden=!open;toggle.setAttribute('aria-expanded',String(open));}
toggle.addEventListener('click',()=>toggleMap(list.hidden));document.querySelector('#map-close')!.addEventListener('click',()=>toggleMap(false));
for(const button of list.querySelectorAll<HTMLButtonElement>('[data-destination]'))button.addEventListener('click',()=>{start();const id=button.dataset.destination as LandmarkId;const l=landmarks.find(l=>l.id===id)!;void chat.send(`Take me to ${l.id}`);toggleMap(false);announce(`Follow your guide to ${l.title}.`);});
renderer.domElement.setAttribute('tabindex','0');renderer.domElement.setAttribute('aria-label','3D island. Use WASD to walk and drag to rotate the camera.');
window.addEventListener('keydown',event=>{if(event.code==='Escape')toggleMap(false);if(!started&&['KeyW','KeyA','KeyS','KeyD'].includes(event.code)&&!input.editing)start();});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);cssRenderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();announce('The graphics connection was interrupted. Reload to return to the island.');});
const discovered=new Set<LandmarkId>();let previous=performance.now(),time=0;
function frame(now:number){
  const dt=Math.min((now-previous)/1000,config.performance.maxDelta);previous=now;time+=dt;
  if(!dialog.open){if(started)player.update(input,dt,time);companion.update(player.model.position,dt,time,chat.speech.snapshot.state!=='idle');}
  const mouth=companion.model.getObjectByName('speakingMouth');if(mouth){mouth.visible=chat.speech.snapshot.state==='displaying'&&!config.animation.reducedMotion;mouth.scale.y=.045*(.4+Math.abs(Math.sin(time*config.animation.speechFrequency))*.6);}
  cameraUpdate(dt);const biome=atmosphere.update(player.model.position,dt);environment.update(time,player.model.position);panels.update(player.model.position,camera,dt);chat.update(player.model.position,companion.model.position,camera,dt);
  ambientAudio.update(player.model.position);
  if(panels.active)discovered.add(panels.active.id);
  document.querySelector('#discovered')!.textContent=`${discovered.size} / ${landmarks.length}`;document.querySelector('#location')!.textContent=biome.weight>.35?biome.landmark.title:'The greenway';
  const dot=document.querySelector('#map-player')!;dot.setAttribute('cx',String(player.model.position.x));dot.setAttribute('cy',String(player.model.position.z));
  for(const label of labels){label.object.element.style.visibility=distance(player.model.position,label.position)<config.performance.lodDistance&&panels.active?.id!==label.id?'visible':'hidden';}
  renderer.render(scene,camera);cssRenderer.render(domScene,camera);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only telemetry makes real-device performance and controls verifiable.
Object.defineProperty(window,'portfolioDebug',{get:()=>({player:{x:player.model.position.x,z:player.model.position.z},companion:{x:companion.model.position.x,z:companion.model.position.z,state:companion.state,destination:companion.destination},camera:{yaw:input.yaw,pitch:input.pitch},panel:panels.active?.id??null,speech:chat.speech.snapshot,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})});
