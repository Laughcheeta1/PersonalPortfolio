import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from './config';
import { landmarks, type Landmark } from './world/registry';
import { distance } from './world/navigation';
import { PanelContent, type TutorialPanelGuideCopy } from './panel-content';
import { localize, onLanguageChange } from './i18n';
export type PanelState = 'inactive' | 'opening' | 'active' | 'closing';
export function choosePanel(player:{x:number;z:number},current:Landmark|null):Landmark|null {
  if(current&&distance(player,{x:current.position[0],z:current.position[1]})<=config.panels.deactivationRadius)return current;
  return landmarks.filter(l=>distance(player,{x:l.position[0],z:l.position[1]})<=l.proximityRadius).sort((a,b)=>distance(player,{x:a.position[0],z:a.position[1]})-distance(player,{x:b.position[0],z:b.position[1]}))[0]??null;
}
export function panelScaleForViewport(distanceToPanel:number,fov:number,viewportWidth:number,viewportHeight:number) {
  const availableWidth=Math.max(1,viewportWidth-2*config.ui.viewportPadding)*config.panels.viewportFraction;
  const availableHeight=Math.max(1,viewportHeight-2*config.ui.viewportPadding)*config.panels.viewportHeightFraction;
  const projectedPanelHeight=Math.min(availableHeight,availableWidth*config.panels.height/config.panels.width);
  const visibleWorldHeight=distanceToPanel*2*Math.tan(THREE.MathUtils.degToRad(fov/2));
  return projectedPanelHeight*visibleWorldHeight/(viewportHeight*config.panels.height);
}
export function isolatePanel(element:HTMLElement) {
  if(typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(pointer: coarse)').matches){
    element.style.touchAction='none';
    let gesture:{id:number;x:number;y:number;target:HTMLElement;scale:number;active:boolean}|null=null;
    const isScrollable=(candidate:HTMLElement)=>{
      const overflow=getComputedStyle(candidate).overflowY;
      return (overflow==='auto'||overflow==='scroll')&&candidate.scrollHeight>candidate.clientHeight+1;
    };
    const scrollTarget=(target:EventTarget|null)=>{
      let candidate=target instanceof HTMLElement?target:null;
      while(candidate&&element.contains(candidate)){
        if(isScrollable(candidate))return candidate;
        if(candidate===element)break;
        candidate=candidate.parentElement;
      }
      return isScrollable(element)?element:null;
    };
    const scrollScale=(target:HTMLElement)=>{
      const localHeight=target.offsetHeight;
      const renderedHeight=target.getBoundingClientRect().height;
      return localHeight>0&&renderedHeight>0?Math.max(.1,renderedHeight/localHeight):1;
    };
    element.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'||gesture)return;
      const target=scrollTarget(event.target);
      if(!target)return;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,target,scale:scrollScale(target),active:false};
    },{capture:true,passive:true});
    element.addEventListener('pointermove',event=>{
      if(!gesture||event.pointerId!==gesture.id)return;
      const deltaX=event.clientX-gesture.x,deltaY=event.clientY-gesture.y;
      if(!gesture.active&&Math.hypot(deltaX,deltaY)<6)return;
      gesture.active=true;
      if(!element.hasPointerCapture(event.pointerId))element.setPointerCapture(event.pointerId);
      gesture.target.scrollTop-=deltaY/gesture.scale;
      gesture.x=event.clientX;gesture.y=event.clientY;
      event.preventDefault();
    },{passive:false});
    const endGesture=(event:PointerEvent)=>{
      if(!gesture||event.pointerId!==gesture.id)return;
      if(gesture.active)event.preventDefault();
      if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);
      gesture=null;
    };
    for(const type of ['pointerup','pointercancel','lostpointercapture'] as const)element.addEventListener(type,endGesture,{passive:false});
  }
  for(const event of ['pointerdown','pointermove','pointerup','wheel','keydown','keyup'])element.addEventListener(event,e=>e.stopPropagation());
}
export type PanelContentRenderer = (tutorialGuide?: TutorialPanelGuideCopy) => void;
export function renderContent(element:HTMLElement, panelId:string, tutorialGuide?: TutorialPanelGuideCopy): PanelContentRenderer {
  element.dataset.panelType='react';
  delete element.dataset.i18nSkip;
  element.replaceChildren();
  element.classList.add('world-panel--react');
  const host=document.createElement('div');
  host.className='panel-react-root';
  host.dataset.i18nSkip='';
  element.append(host);
  const root=createRoot(host);
  const render=(guide?:TutorialPanelGuideCopy)=>root.render(createElement(PanelContent,{panelId,tutorialGuide:guide}));
  render(tutorialGuide);
  return render;
}
interface Surface {landmark:Landmark;group:THREE.Group;elements:HTMLElement[];state:PanelState;progress:number}
export class PanelSystem {
  private surfaces:Surface[]=[];
  active:Landmark|null=null;
  constructor(scene:THREE.Scene) {
    for(const landmark of landmarks){
      const group=new THREE.Group();scene.add(group);const elements:HTMLElement[]=[];
      for(const [index,id] of [landmark.frontPanel,landmark.backPanel].entries()){
        const el=document.createElement('article');el.className='world-panel';el.setAttribute('aria-label',`${landmark.title} ${index?'back':'front'}`);isolatePanel(el);el.textContent='Opening the notebook…';
        el.style.width=`${config.panels.width}px`;el.style.height=`${config.panels.height}px`;
        const object=new CSS3DObject(el);el.style.userSelect='text';object.rotation.y=landmark.rotation+index*Math.PI;object.position.z=index?-.02:.02;group.add(object);elements.push(el);
        renderContent(el,id);
      }
      this.surfaces.push({landmark,group,elements,state:'inactive',progress:0});
    }
    onLanguageChange(()=>{for(const surface of this.surfaces)for(const element of surface.elements)localize(element);});
  }
  update(player:THREE.Vector3,camera:THREE.PerspectiveCamera,dt:number) {
    this.active=choosePanel(player,this.active);
    for(const s of this.surfaces){
      const open=s.landmark===this.active;
      s.state=open?(s.progress>=1?'active':'opening'):(s.progress<=0?'inactive':'closing');
      s.progress=THREE.MathUtils.clamp(s.progress+(open?dt/config.panels.openDuration:-dt/config.panels.closeDuration),0,1);
      const p=config.animation.reducedMotion?Number(open):s.progress;
      const eased=open?1+2.70158*(p-1)**3+1.70158*(p-1)**2:p*p;
      s.group.position.set(s.landmark.position[0],config.panels.verticalOffset-config.panels.rise*(1-eased),s.landmark.position[1]);
      // Fill a two-thirds viewport box while retaining the panel's world orientation.
      const scale=panelScaleForViewport(camera.position.distanceTo(s.group.position),camera.fov,window.innerWidth,window.innerHeight);
      s.group.scale.setScalar(scale*Math.max(.001,eased));s.group.updateMatrixWorld(true);
      const toward=camera.position.clone().sub(s.group.position),normal=new THREE.Vector3(Math.sin(s.landmark.rotation),0,Math.cos(s.landmark.rotation));
      const front=toward.dot(normal)>0;
      s.elements.forEach((el,index)=>{const visible=el.dataset.panelType!=='none'&&p>0&&(index===0?front:!front);el.style.visibility=visible?'visible':'hidden';el.style.pointerEvents=visible&&p>.8?'auto':'none';el.inert=!visible;el.style.opacity=String(Math.min(1,p*3));el.dataset.state=s.state;});
    }
  }
}
