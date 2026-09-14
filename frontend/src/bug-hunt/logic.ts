import { bugHuntConfig as c } from '../world/bugHuntConfig';
import type { Point } from '../world/navigation';

export function inBugArena(p: Point): boolean {
  return Math.hypot(p.x-c.island.x,p.z-c.island.z)<=c.island.radius-.5;
}
/** A cane hits one grounded target in the forward arc, never targets behind the player. */
export function hitTarget(player: Point & { y:number }, yaw:number, bugs:readonly Point[]):number {
  if(player.y>1)return -1;
  let nearest=-1, range=c.attackRange as number;
  bugs.forEach((bug,index)=>{
    const dx=bug.x-player.x,dz=bug.z-player.z,distance=Math.hypot(dx,dz);
    if(distance<=range&&(distance<.65||(dx*Math.sin(yaw)+dz*Math.cos(yaw))/distance>=.2)){
      nearest=index;range=distance;
    }
  });
  return nearest;
}
export function secondsLeft(deadline:number,now:number):number {return Math.max(0,Math.ceil((deadline-now)/1000));}
