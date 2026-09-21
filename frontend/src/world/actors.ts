import * as THREE from 'three';
import { config } from '../config';
import type { Input } from '../input';
import { createCharacter } from './models';
import { damping, moveWithCollisions, turn } from './physics';
import { distance, guidedRoute, localRoute, navigation, type Point, type Obstacle } from './navigation';
import { landmarks, type LandmarkId } from './registry';
export class Actor {
  readonly model: THREE.Group;
  velocity = new THREE.Vector2();
  constructor(companion: boolean, public obstacles: Obstacle[]) { this.model = createCharacter(companion); }
  move(direction: Point, speed: number, acceleration: number, deceleration: number, rotation: number, dt: number, time: number) {
    const desired = new THREE.Vector2(direction.x, direction.z);
    if (desired.length() > 1) desired.normalize(); desired.multiplyScalar(speed);
    this.velocity.lerp(desired, damping(desired.lengthSq() ? acceleration : deceleration, dt));
    const next = moveWithCollisions(this.model.position, { x: this.velocity.x * dt, z: this.velocity.y * dt }, this.obstacles, config.player.radius);
    const moved = distance(this.model.position, next) / Math.max(dt, .001);
    this.model.position.x = next.x; this.model.position.z = next.z;
    if (moved > .03) this.model.rotation.y = turn(this.model.rotation.y, Math.atan2(this.velocity.x, this.velocity.y), damping(rotation, dt));
    const swing = config.animation.reducedMotion ? 0 : Math.sin(time * config.animation.walkFrequency) * config.animation.walkAmplitude * Math.min(1, moved / config.player.walkSpeed);
    for (const [name, sign] of [['leftLeg', 1], ['rightLeg', -1], ['leftArm', -1], ['rightArm', 1]] as const) { const limb = this.model.getObjectByName(name); if (limb) limb.rotation.x = swing * sign; }
  }
}
export class Player extends Actor {
  verticalVelocity=0;
  grounded=true;
  private jumpBuffered=0;
  update(input: Input, dt: number, time: number) {
    if(input.consumeJump())this.jumpBuffered=config.player.jumpBuffer;
    else this.jumpBuffered=Math.max(0,this.jumpBuffered-dt);
    if(this.grounded&&this.jumpBuffered>0){this.verticalVelocity=config.player.jumpSpeed;this.grounded=false;this.jumpBuffered=0;}
    const movement = input.movement, sin = Math.sin(input.yaw), cos = Math.cos(input.yaw);
    this.move({ x: movement.x * cos + movement.z * sin, z: -movement.x * sin + movement.z * cos }, input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') ? config.player.runSpeed : config.player.walkSpeed, config.player.acceleration, config.player.deceleration, config.player.rotationSpeed, dt, time);
    if(!this.grounded){
      this.model.position.y+=this.verticalVelocity*dt-.5*config.player.gravity*dt*dt;
      this.verticalVelocity-=config.player.gravity*dt;
      if(this.model.position.y<=config.world.groundHeight){this.model.position.y=config.world.groundHeight;this.verticalVelocity=0;this.grounded=true;}
    }
  }
}
export type GuideState = 'IDLE' | 'FOLLOW_USER' | 'GUIDED_TRAVEL' | 'AT_DESTINATION';
export class Companion extends Actor {
  state: GuideState = 'IDLE';
  route: Point[] = [];
  destination: LandmarkId | null = null;
  private hold = 0;
  private repath = 0;
  guide(id: LandmarkId): boolean {
    const destination = landmarks.find(l => l.id === id); if (!destination) return false;
    const route = guidedRoute(this.model.position, destination.navigationNode, this.obstacles, config.player.radius);
    if (!route.length) return false;
    this.route = route; this.destination = id; this.state = 'GUIDED_TRAVEL'; return true;
  }
  update(player: THREE.Vector3, dt: number, time: number, speaking: boolean) {
    const c = config.companion, gap = distance(this.model.position, player);
    this.repath -= dt;
    if (this.state === 'AT_DESTINATION') { this.hold += dt; if (this.hold > c.guidedHold && !speaking) { this.state = 'IDLE'; this.destination = null; } }
    if (this.state !== 'GUIDED_TRAVEL' && this.state !== 'AT_DESTINATION') {
      if (gap > c.followRadius) this.state = 'FOLLOW_USER';
      if (this.state === 'FOLLOW_USER' && gap <= c.targetRadius) { this.state = 'IDLE'; this.route = []; }
      if (this.state === 'FOLLOW_USER' && this.repath <= 0) {
        if(gap>c.followRadius*2){
          const nearest=[...navigation].sort((a,b)=>distance(a,player)-distance(b,player))[0];
          this.route=[...guidedRoute(this.model.position,nearest.id,this.obstacles,config.player.radius),...localRoute(nearest,player,this.obstacles,config.player.radius)];
        } else this.route = localRoute(this.model.position, player, this.obstacles, config.player.radius);
        this.repath = c.repathInterval;
      }
    }
    let direction = { x: 0, z: 0 };
    if (this.state === 'GUIDED_TRAVEL' || this.state === 'FOLLOW_USER') {
      while (this.route.length && distance(this.model.position, this.route[0]) < c.arrivalRadius) this.route.shift();
      const next = this.route[0];
      if (next) { const length = distance(this.model.position, next); direction = { x: (next.x - this.model.position.x) / length, z: (next.z - this.model.position.z) / length }; }
      else if (this.state === 'GUIDED_TRAVEL') { this.state = 'AT_DESTINATION'; this.hold = 0; }
    }
    this.move(direction, this.state === 'GUIDED_TRAVEL' ? c.roadSpeed : c.speed, c.acceleration, c.deceleration, c.rotationSpeed, dt, time);
    if (this.state === 'IDLE' || this.state === 'AT_DESTINATION') this.model.rotation.y = turn(this.model.rotation.y, Math.atan2(player.x - this.model.position.x, player.z - this.model.position.z), damping(c.rotationSpeed, dt));
  }
}
