import * as THREE from 'three';
import type { Player } from '../world/actors';
import { bugHuntConfig as c } from '../world/bugHuntConfig';
import { createBugIsland } from '../world/bugIsland';
import { bugPartyJumpOffset, bugVerticalOffset, hitTarget, inBugArena, secondsLeft } from './logic';
import { HuntServiceError, huntService, saveVisitor, visitorIdentity, type HuntSession } from './service';
import './style.css';

const bugLabel=(count:number)=>`${count} ${count===1?'bug':'bugs'}`;
type Bug={model:THREE.Group;heading:number;respawnAt:number};
export class BugHunt {
  readonly group=new THREE.Group();
  private bugs:Bug[]=[];
  private visitor=visitorIdentity();
  private session:HuntSession|null=null;
  private deadline=0;
  private score=0;
  private phase:'idle'|'starting'|'playing'|'saving'|'finished'|'unsaved'='idle';
  private swingAt=-Infinity;
  private struck=false;
  private partyMode=false;
  private partyJumpProgress=1;
  private nearby=false;
  private boardLoaded=false;
  private boardBusy=false;
  private boardRefreshPending=false;
  private boardCanvas=document.createElement('canvas');
  private boardTexture:THREE.CanvasTexture;
  private hud=document.createElement('aside');
  private status:HTMLElement;
  private startButton:HTMLButtonElement;
  private nameInput:HTMLInputElement;
  private attackButton:HTMLButtonElement;
  constructor(scene:THREE.Scene,host:HTMLElement,private player:Player,surface:HTMLElement,private canInteract:()=>boolean){
    this.group.add(createBugIsland());scene.add(this.group);
    this.boardCanvas.width=1040;this.boardCanvas.height=840;
    this.boardTexture=new THREE.CanvasTexture(this.boardCanvas);this.boardTexture.colorSpace=THREE.SRGBColorSpace;
    const b=c.leaderboard;
    const board=new THREE.Mesh(new THREE.PlaneGeometry(b.width,b.height),new THREE.MeshBasicMaterial({map:this.boardTexture,side:THREE.DoubleSide}));
    board.position.set(b.x+Math.sin(b.rotationY)*.2,b.y,b.z+Math.cos(b.rotationY)*.2);board.rotation.y=b.rotationY;this.group.add(board);
    this.paintBoard('Walk over to load the leaderboard.');
    for(let i=0;i<c.bugCount;i++){const bug={model:this.createBug(i),heading:i*2.4,respawnAt:0};this.bugs.push(bug);this.group.add(bug.model);this.placeBug(bug,i);}
    this.hud.className='bug-hunt';this.hud.hidden=true;
    this.hud.innerHTML='<span class="bug-hunt-eyebrow">THE DEBUGGING GROVE</span><h2>Catch it. Patch it.</h2><p>Chase the code bugs. Face one and left-click to swing your cane.</p><label>Leaderboard name <input maxlength="24" autocomplete="nickname" aria-label="Leaderboard name"></label><div class="bug-hunt-counts"><span data-timer>45s</span><span data-score>0 bugs</span></div><p data-status role="status" aria-live="polite">A 45-second hunt. Every bug is one point.</p><div class="bug-hunt-actions"><button data-start>Start hunt</button><button data-attack hidden>Swing cane</button><button data-refresh aria-label="Refresh leaderboard">↻ Scores</button></div>';
    host.append(this.hud);this.status=this.hud.querySelector('[data-status]')!;
    this.startButton=this.hud.querySelector('[data-start]')!;this.nameInput=this.hud.querySelector('input')!;this.attackButton=this.hud.querySelector('[data-attack]')!;
    this.nameInput.value=this.visitor.display_name;saveVisitor(this.visitor);
    this.startButton.addEventListener('click',()=>{if(this.phase==='unsaved')void this.finish();else void this.start();});
    this.hud.querySelector('[data-refresh]')!.addEventListener('click',()=>void this.refreshBoard());
    this.attackButton.addEventListener('pointerdown',event=>{event.preventDefault();this.attack();});
    this.attackButton.addEventListener('click',event=>{if(event.detail===0)this.attack();});
    let press:{x:number;y:number;id:number}|null=null;
    surface.addEventListener('pointerdown',event=>{if(event.button===0)press={x:event.clientX,y:event.clientY,id:event.pointerId};});
    surface.addEventListener('pointermove',event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>6)press=null;});
    surface.addEventListener('pointerup',event=>{if(press?.id===event.pointerId)this.attack();press=null;});
    surface.addEventListener('pointercancel',()=>{press=null;});
  }
  setPartyMode(enabled:boolean){this.partyMode=enabled;if(!enabled)this.partyJumpProgress=1;}
  triggerPartyBeat(){if(this.partyMode&&this.partyJumpProgress>=1)this.partyJumpProgress=0;}
  get snapshot(){return {phase:this.phase,score:this.score,remaining:secondsLeft(this.deadline,performance.now()),nearby:this.nearby,partyMode:this.partyMode,bugs:this.bugs.filter(b=>b.model.visible).map(b=>({x:b.model.position.x,z:b.model.position.z})),swingAt:this.swingAt};}
  private createBug(index:number){
    const group=new THREE.Group();group.name='Code bug';
    const shell=new THREE.MeshStandardMaterial({color:['#c97154','#658eab','#9c75aa','#79a65b'][index%4],roughness:.65});
    const dark=new THREE.MeshStandardMaterial({color:'#253c3b'});
    const body=new THREE.Mesh(new THREE.SphereGeometry(.48,12,8),shell);body.scale.set(1,.65,1.25);body.position.y=.45;group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.27,10,6),dark);head.position.set(0,.4,.5);group.add(head);
    for(const side of [-1,1]){
      for(let j=0;j<3;j++){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.5,2,4),dark);leg.position.set(side*.5,.23,(j-1)*.29);leg.rotation.z=side*1.05;leg.name=`leg${side}:${j}`;group.add(leg);}
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),new THREE.MeshBasicMaterial({color:'#fff5cc'}));eye.position.set(side*.13,.5,.72);group.add(eye);
      const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.4,4),dark);antenna.position.set(side*.17,.71,.59);antenna.rotation.z=side*-.4;group.add(antenna);
    }
    const label=document.createElement('canvas');label.width=128;label.height=64;const ctx=label.getContext('2d')!;ctx.fillStyle='#fff6d7';ctx.font='bold 48px monospace';ctx.textAlign='center';ctx.fillText(['</>','{ }','!=','NaN'][index%4],64,48);
    const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;
    const mark=new THREE.Mesh(new THREE.PlaneGeometry(.66,.33),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));mark.rotation.x=-Math.PI/2;mark.position.set(0,.77,0);group.add(mark);
    group.traverse(object=>{if(object instanceof THREE.Mesh)object.castShadow=true;});return group;
  }
  private placeBug(bug:Bug,index:number){const angle=index*2.399+Math.random()*.5,radius=3+Math.random()*(c.arenaRadius-3);bug.model.position.set(c.island.x+Math.cos(angle)*radius,0,c.island.z+Math.sin(angle)*radius);bug.model.visible=true;}
  private paintBoard(message:string,rows:{rank:number;display_name:string;score:number}[]=[]){
    const ctx=this.boardCanvas.getContext('2d')!;ctx.fillStyle='#203e39';ctx.fillRect(0,0,1040,840);ctx.strokeStyle='#b9b883';ctx.lineWidth=4;ctx.strokeRect(24,24,992,792);
    ctx.textAlign='center';ctx.fillStyle='#efca7b';ctx.font='24px monospace';ctx.fillText('THE DEBUGGING GROVE',520,88);ctx.fillStyle='#fff3d7';ctx.font='bold 64px Georgia';ctx.fillText('Bug hunters',520,174);ctx.font='26px sans-serif';ctx.fillText('45 SECONDS · ALL-TIME BESTS',520,228);
    ctx.font='28px sans-serif';ctx.fillStyle='#d4decd';ctx.fillText(message,520,rows.length?754:420);
    ctx.font='40px sans-serif';
    rows.slice(0,5).forEach((row,index)=>{const y=324+index*78;ctx.fillStyle=index===0?'#efca7b':'#fff3d7';ctx.textAlign='left';ctx.fillText(`${row.rank}. ${row.display_name}`,72,y,760);ctx.textAlign='right';ctx.fillText(String(row.score),962,y);});
    this.boardTexture.needsUpdate=true;
  }
  private async refreshBoard(){
    if(this.boardBusy){this.boardRefreshPending=true;return;}this.boardBusy=true;this.paintBoard('Loading saved scores…');
    try{const board=await huntService.leaderboard();this.paintBoard(board.entries.length?'One best score per visitor':'No scores yet. Set the first record!',board.entries);}
    catch{this.paintBoard('Scores unavailable. Use ↻ Scores to retry.');}
    finally{this.boardBusy=false;if(this.boardRefreshPending){this.boardRefreshPending=false;void this.refreshBoard();}}
  }
  private async start(){
    if(!this.nearby||!['idle','finished'].includes(this.phase))return;
    const name=this.nameInput.value.trim();if(!name){this.status.textContent='Choose a leaderboard name first.';return;}
    this.phase='starting';this.startButton.disabled=true;this.status.textContent='Getting your round ready…';
    this.visitor.display_name=name;saveVisitor(this.visitor);
    try{
      this.session=await huntService.start(this.visitor);this.score=0;this.deadline=performance.now()+this.session.duration_seconds*1000;
      this.phase='playing';this.swingAt=-Infinity;this.bugs.forEach((bug,i)=>{bug.respawnAt=0;this.placeBug(bug,i);});
      this.status.textContent='Go! Chase the bugs and swing your cane.';this.startButton.hidden=true;this.nameInput.disabled=true;
      (document.activeElement as HTMLElement)?.blur();
      void this.refreshBoard();
    }catch(error){this.phase='idle';this.status.textContent=error instanceof Error?error.message:'Could not start the round.';}
    finally{this.startButton.disabled=false;}
  }
  private async finish(){
    if(!this.session||!['playing','unsaved'].includes(this.phase))return;
    this.phase='saving';this.startButton.hidden=false;this.startButton.disabled=true;this.status.textContent=`Time! ${bugLabel(this.score)} caught. Saving your score…`;
    try{const result=await huntService.finish(this.session,this.score);this.phase='finished';this.status.textContent=`You caught ${bugLabel(result.score)}! Personal best: ${result.personal_best}. Score saved.`;this.startButton.textContent='Play again';this.nameInput.disabled=false;void this.refreshBoard();}
    catch(error){
      if(error instanceof HuntServiceError&&[404,410].includes(error.status)){
        this.phase='finished';this.status.textContent=`You caught ${bugLabel(this.score)}. This round expired before it could be saved.`;this.startButton.textContent='Play again';this.nameInput.disabled=false;
      }else{this.phase='unsaved';this.status.textContent=`You caught ${bugLabel(this.score)}. Score not saved yet—retry within five minutes.`;this.startButton.textContent='Retry saving score';}
    }
    finally{this.startButton.disabled=false;}
  }
  private attack(){
    const now=performance.now();if(!this.canInteract()||!inBugArena(this.player.model.position)||now-this.swingAt<c.attackCooldown*1000)return;
    this.swingAt=now;this.struck=false;
  }
  update(dt:number,time:number){
    const now=performance.now(),p=this.player.model.position;
    if(this.partyMode)this.partyJumpProgress=Math.min(1,this.partyJumpProgress+dt/c.bugPartyJumpDuration);
    const near=inBugArena(p)||(p.x>=c.bridge.endX-8&&p.x<=c.bridge.endX+2&&Math.abs(p.z-c.bridge.z)<7);
    if(near&&!this.nearby){this.boardLoaded=true;void this.refreshBoard();}
    this.nearby=near;this.hud.hidden=!near&&this.phase!=='playing'&&this.phase!=='saving'&&this.phase!=='unsaved';
    if(!this.boardLoaded&&p.x>c.bridge.startX+5){this.boardLoaded=true;void this.refreshBoard();}
    this.attackButton.hidden=!inBugArena(p);this.startButton.disabled=this.phase==='starting'||this.phase==='saving'||(!near&&this.phase!=='unsaved');
    if(this.phase==='playing'&&now>=this.deadline)void this.finish();
    const elapsed=(now-this.swingAt)/1000;
    const arm=this.player.model.getObjectByName('rightArm');
    if(arm&&elapsed<c.attackDuration){arm.rotation.x=-Math.sin(elapsed/c.attackDuration*Math.PI)*2.1;}
    if(!this.struck&&elapsed>=c.attackDuration*.35&&elapsed<c.attackDuration){
      this.struck=true;
      if(this.phase==='playing'&&inBugArena(p)&&this.canInteract()){
        const live=this.bugs.filter(b=>b.model.visible),index=hitTarget(p,this.player.model.rotation.y,live.map(b=>b.model.position));
        if(index>=0){const bug=live[index];bug.model.visible=false;bug.respawnAt=now+900;this.score++;}
      }
    }
    this.bugs.forEach((bug,index)=>{
      if(!bug.model.visible){if(now>=bug.respawnAt)this.placeBug(bug,index);else return;}
      const position=bug.model.position,gap=Math.hypot(p.x-position.x,p.z-position.z);
      if(!this.partyMode||this.phase==='playing'){
        const outward=Math.atan2(position.x-c.island.x,position.z-c.island.z);
        if(Math.hypot(position.x-c.island.x,position.z-c.island.z)>c.arenaRadius)bug.heading=outward+Math.PI;
        else if(gap<3.5&&this.phase==='playing')bug.heading=Math.atan2(position.x-p.x,position.z-p.z);
        else bug.heading+=Math.sin(time*.8+index)*dt*.7;
        position.x+=Math.sin(bug.heading)*c.bugSpeed*dt;position.z+=Math.cos(bug.heading)*c.bugSpeed*dt;
        const radius=Math.hypot(position.x-c.island.x,position.z-c.island.z);if(radius>c.arenaRadius+.1){position.x=c.island.x+(position.x-c.island.x)/radius*c.arenaRadius;position.z=c.island.z+(position.z-c.island.z)/radius*c.arenaRadius;}
      }
      bug.model.rotation.y=bug.heading;position.y=this.partyMode?bugPartyJumpOffset(this.partyJumpProgress):bugVerticalOffset(time,index);
      bug.model.children.filter(child=>child.name.startsWith('leg')).forEach((leg,j)=>{leg.rotation.x=Math.sin(time*18+j)*.35;});
    });
    this.hud.querySelector('[data-timer]')!.textContent=`${this.phase==='playing'?secondsLeft(this.deadline,now):this.phase==='idle'||this.phase==='starting'?45:0}s`;
    this.hud.querySelector('[data-score]')!.textContent=bugLabel(this.score);
  }
}
