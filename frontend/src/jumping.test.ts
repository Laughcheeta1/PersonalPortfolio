import { describe, expect, it } from 'vitest';
import { config } from './config';
import type { Input } from './input';
import { Player } from './world/actors';
import { onIsland } from './world/physics';

function controls(){
  let jump=false;
  const input={movement:{x:0,z:0},yaw:0,keys:new Set<string>(),consumeJump:()=>{const value=jump;jump=false;return value;}};
  return {input:input as unknown as Input,jump:()=>{jump=true;}};
}
describe('player jumping',()=>{
  it('leaves the ground, follows a ballistic arc, lands, and can jump again',()=>{
    const player=new Player(false,[]),control=controls();control.jump();let peak=0;
    for(let i=0;i<100;i++){player.update(control.input,.01,i*.01);peak=Math.max(peak,player.model.position.y);}
    expect(peak).toBeCloseTo(config.player.jumpSpeed**2/(2*config.player.gravity),2);
    expect(player.grounded).toBe(true);expect(player.model.position.y).toBe(config.world.groundHeight);expect(player.verticalVelocity).toBe(0);
    control.jump();player.update(control.input,.01,1);expect(player.grounded).toBe(false);expect(player.model.position.y).toBeGreaterThan(0);
  });
  it('does not allow midair jumps but buffers a press immediately before landing',()=>{
    const player=new Player(false,[]),control=controls();control.jump();player.update(control.input,.1,0);
    const velocity=player.verticalVelocity;control.jump();player.update(control.input,.1,.1);
    expect(player.verticalVelocity).toBeLessThan(velocity);
    while(player.verticalVelocity>=0||player.model.position.y>.1)player.update(control.input,.01,.2);
    control.jump();for(let i=0;i<8;i++)player.update(control.input,.01,.8+i*.01);
    expect(player.grounded).toBe(false);expect(player.verticalVelocity).toBeGreaterThan(0);
  });
  it('retains structure and shoreline collisions while airborne',()=>{
    const obstacle={x:1.2,z:0,radius:.6},player=new Player(false,[obstacle]),control=controls();
    control.input.movement.x=1;control.jump();
    for(let i=0;i<30;i++)player.update(control.input,.016,i*.016);
    expect(player.model.position.x).toBeLessThanOrEqual(obstacle.x-obstacle.radius-config.player.radius);
    player.model.position.x=config.world.centerX+config.world.radiusX-config.world.shoreline-config.player.radius-.05;
    control.jump();for(let i=0;i<60;i++)player.update(control.input,.016,i*.016);
    expect(onIsland(player.model.position)).toBe(true);
  });
  it('runs faster than before without changing walking speed',()=>{
    const running=new Player(false,[]),walking=new Player(false,[]),run=controls(),walk=controls();
    run.input.movement.x=walk.input.movement.x=1;run.input.keys.add('ShiftLeft');
    for(let i=0;i<100;i++){running.update(run.input,.01,i*.01);walking.update(walk.input,.01,i*.01);}
    expect(running.velocity.length()).toBeGreaterThan(8);expect(walking.velocity.length()).toBeCloseTo(config.player.walkSpeed,2);
  });
});
