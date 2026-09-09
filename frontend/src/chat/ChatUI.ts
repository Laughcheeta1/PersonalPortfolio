import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { config } from '../config';
import { isolatePanel } from '../panels';
import { BrowserHistoryStore, createChatService, type ChatMessage } from '../services';
import { SpeechQueue, type SpeechSnapshot } from './Speech';
import type { LandmarkId } from '../world/registry';
export class ChatUI {
  readonly speech:SpeechQueue;
  readonly object:CSS3DObject;
  private element=document.createElement('section');
  private log:HTMLElement;
  private comic:HTMLElement;
  private status:HTMLElement;
  private form:HTMLFormElement;
  private store=new BrowserHistoryStore();
  private history:ChatMessage[]=this.store.load();
  private service=createChatService();
  private pending=false;
  private live:HTMLElement|null=null;
  private near=false;
  constructor(scene:THREE.Scene,private guide:(id:LandmarkId)=>boolean) {
    this.element.className='chat-anchor';this.element.setAttribute('aria-label','Companion conversation');isolatePanel(this.element);
    this.element.style.setProperty('--chat-open-duration',`${config.panels.openDuration}s`);
    this.element.innerHTML=`<div class="chat-full"><header><span class="guide-avatar">✦</span><div><strong>Your island guide</strong><small>A little company, a little curiosity.</small></div><span class="online-dot"></span></header><div class="chat-log" role="log" aria-label="Conversation history"></div><p class="chat-status" role="status"></p><form><input aria-label="Message your guide" placeholder="Where shall we go?" maxlength="1500" autocomplete="off"/><button aria-label="Send message" type="submit">↑</button></form><footer>LOCAL DEMO GUIDE <button type="button" class="clear-chat">Clear history</button></footer></div><div class="comic"><strong>YOUR GUIDE</strong><p></p></div>`;
    this.log=this.element.querySelector('.chat-log')!;this.comic=this.element.querySelector('.comic p')!;this.status=this.element.querySelector('.chat-status')!;this.form=this.element.querySelector('form')!;
    this.renderHistory();this.speech=new SpeechQueue(config.speech,snapshot=>this.onSpeech(snapshot));
    this.form.addEventListener('submit',event=>{event.preventDefault();const input=this.form.querySelector('input')!;const value=input.value.trim();if(!value||this.pending)return;input.value='';void this.send(value);});
    this.element.querySelector('.clear-chat')!.addEventListener('click',()=>{if(this.speech.snapshot.state!=='idle'||this.pending){this.status.textContent='Let me finish this thought first.';return;}this.history=[];this.store.clear();this.renderHistory();});
    this.object=new CSS3DObject(this.element);this.element.style.userSelect='text';this.object.scale.setScalar(config.ui.chatScale);scene.add(this.object);
  }
  private append(role:string,text:string){const p=document.createElement('p');p.className=`message ${role}`;p.textContent=text;this.log.append(p);this.log.scrollTop=this.log.scrollHeight;return p;}
  private renderHistory(){this.log.replaceChildren();if(!this.history.length)this.append('assistant','Welcome, wanderer. Ask me about a landmark, or choose a destination on the island map.');for(const message of this.history)this.append(message.role,message.content);}
  async send(message:string){
    this.speech.unlockAudio();this.pending=true;this.status.textContent='Thinking…';this.form.querySelector('button')!.disabled=true;
    this.history.push({role:'user',content:message});this.append('user',message);this.store.save(this.history);
    try {const reply=await this.service.send(message,this.history);this.history.push({role:'assistant',content:reply.message});this.store.save(this.history);this.speech.enqueue(reply.message);if(reply.destination_object_id&&!this.guide(reply.destination_object_id))this.status.textContent='I could not find a clear route. Try meeting me on the path.';else this.status.textContent='';}
    catch(error){this.status.textContent=error instanceof Error?error.message:'The guide is unavailable. Please try again.';}
    finally{this.pending=false;this.form.querySelector('button')!.disabled=false;}
  }
  private onSpeech(snapshot:SpeechSnapshot){
    if(snapshot.state==='received'){this.live=this.append('assistant','');}
    if(this.live)this.live.textContent=snapshot.text;
    this.comic.textContent=snapshot.text;this.comic.scrollTop=this.comic.scrollHeight;this.log.scrollTop=this.log.scrollHeight;
    if(snapshot.state==='finished')this.live=null;
  }
  update(player:THREE.Vector3,companion:THREE.Vector3,camera:THREE.Camera,dt:number){
    this.speech.tick(dt);this.near=player.distanceTo(companion)<=config.companion.chatRadius;
    const talking=this.speech.snapshot.state!=='idle';this.element.classList.toggle('is-far',!this.near);
    const visible=this.near||talking;this.element.style.visibility=visible?'visible':'hidden';this.element.style.pointerEvents=visible?'auto':'none';this.element.inert=!visible;
    this.object.position.copy(companion).add(new THREE.Vector3(0,this.near?config.ui.chatHeight:config.ui.speechHeight,0));this.object.quaternion.copy(camera.quaternion);
    if(camera instanceof THREE.PerspectiveCamera){
      const distance=camera.position.distanceTo(this.object.position),worldPerPixel=distance*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/innerHeight;
      const desiredWidth=Math.min(config.ui.chatWidth,innerWidth-config.ui.viewportPadding*2),elementWidth=innerWidth<600?config.ui.mobileChatWidth:config.ui.chatWidth;
      this.object.scale.setScalar(desiredWidth*worldPerPixel/elementWidth);
      const projected=this.object.position.clone().project(camera),screenX=(projected.x+1)*innerWidth/2;
      const clampedX=THREE.MathUtils.clamp(screenX,desiredWidth/2+config.ui.viewportPadding,innerWidth-desiredWidth/2-config.ui.viewportPadding);
      this.object.position.add(new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar((clampedX-screenX)*worldPerPixel));
    }
  }
}
