import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { config } from './config';
import { landmarks, type Landmark } from './world/registry';
import { distance } from './world/navigation';
import { createPanelContentService, sanitizePanelHtml, type PanelDefinition } from './services';
import { localize, onLanguageChange, t } from './i18n';
export type PanelState = 'inactive' | 'opening' | 'active' | 'closing';
export function choosePanel(player:{x:number;z:number},current:Landmark|null):Landmark|null {
  if(current&&distance(player,{x:current.position[0],z:current.position[1]})<=config.panels.deactivationRadius)return current;
  return landmarks.filter(l=>distance(player,{x:l.position[0],z:l.position[1]})<=l.proximityRadius).sort((a,b)=>distance(player,{x:a.position[0],z:a.position[1]})-distance(player,{x:b.position[0],z:b.position[1]}))[0]??null;
}
export function isolatePanel(element:HTMLElement) {
  for(const event of ['pointerdown','pointermove','pointerup','wheel','keydown','keyup'])element.addEventListener(event,e=>e.stopPropagation());
}
export async function renderContent(element:HTMLElement, definition:PanelDefinition) {
  element.dataset.panelType=definition.type;
  if(definition.localize===false)element.dataset.i18nSkip='';else delete element.dataset.i18nSkip;
  element.replaceChildren();
  if(definition.type==='html')element.innerHTML=sanitizePanelHtml(definition.html);
  if(definition.type==='iframe') {
    try {const url=new URL(definition.url);if(url.protocol!=='https:')throw new Error();
      const iframe=document.createElement('iframe');iframe.src=url.href;iframe.title=definition.title;iframe.sandbox.add('allow-scripts','allow-forms','allow-presentation');iframe.referrerPolicy='no-referrer';iframe.loading='lazy';iframe.allow='fullscreen';element.append(iframe);
    } catch { element.textContent=t('This embedded page is not available.'); }
  }
}
interface Surface {landmark:Landmark;group:THREE.Group;elements:HTMLElement[];state:PanelState;progress:number}
export class PanelSystem {
  private service=createPanelContentService();
  private surfaces:Surface[]=[];
  active:Landmark|null=null;
  constructor(scene:THREE.Scene) {
    for(const landmark of landmarks){
      const group=new THREE.Group();scene.add(group);const elements:HTMLElement[]=[];
      for(const [index,id] of [landmark.frontPanel,landmark.backPanel].entries()){
        const el=document.createElement('article');el.className='world-panel';el.setAttribute('aria-label',`${landmark.title} ${index?'back':'front'}`);isolatePanel(el);el.textContent='Opening the notebook…';
        el.style.width=`${config.panels.width}px`;el.style.height=`${config.panels.height}px`;
        const object=new CSS3DObject(el);el.style.userSelect='text';object.rotation.y=landmark.rotation+index*Math.PI;object.position.z=index?-.02:.02;group.add(object);elements.push(el);
        this.service.get(id).then(async def=>{await renderContent(el,def);localize(el);}).catch(()=>{el.textContent=t('This notebook could not be opened. Approach again or reload to retry.');});
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
      // Keep text legible on portrait screens while retaining a fixed world orientation.
      const mobile=window.innerWidth<config.ui.mobileBreakpoint;
      const width=mobile?360:config.panels.width;
      s.elements.forEach(el=>{el.style.width=`${width}px`;});
      const scale=mobile?Math.min(.025,(window.innerWidth-36)*camera.position.distanceTo(s.group.position)*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/(window.innerHeight*width)):config.panels.scale;
      s.group.scale.setScalar(scale*Math.max(.001,eased));s.group.updateMatrixWorld(true);
      const toward=camera.position.clone().sub(s.group.position),normal=new THREE.Vector3(Math.sin(s.landmark.rotation),0,Math.cos(s.landmark.rotation));
      const front=toward.dot(normal)>0;
      s.elements.forEach((el,index)=>{const visible=el.dataset.panelType!=='none'&&p>0&&(index===0?front:!front);el.style.visibility=visible?'visible':'hidden';el.style.pointerEvents=visible&&p>.8?'auto':'none';el.inert=!visible;el.style.opacity=String(Math.min(1,p*3));el.dataset.state=s.state;});
    }
  }
}
