import { describe,expect,it } from 'vitest';
import { bugPartyJumpOffset, bugVerticalOffset, hitTarget,inBugArena,secondsLeft } from './logic';
import { bugHuntConfig as c } from '../world/bugHuntConfig';
describe('bug hunt hits',()=>{
  const player={x:0,y:0,z:0};
  it('hits only the nearest bug in the forward cane arc',()=>{
    expect(hitTarget(player,0,[{x:0,z:-1},{x:0,z:2},{x:0,z:1}])).toBe(2);
    expect(hitTarget(player,Math.PI,[{x:0,z:-1},{x:0,z:1}])).toBe(0);
  });
  it('misses distant bugs, targets behind, and bugs under a high jump',()=>{
    expect(hitTarget(player,0,[{x:0,z:4}])).toBe(-1);
    expect(hitTarget(player,0,[{x:0,z:-1}])).toBe(-1);
    expect(hitTarget({...player,y:2},0,[{x:0,z:1}])).toBe(-1);
  });
  it('limits attacks to the island and the timer to zero',()=>{
    expect(inBugArena({x:c.island.x,z:c.island.z})).toBe(true);
    expect(inBugArena({x:c.bridge.startX,z:c.bridge.z})).toBe(false);
    expect(secondsLeft(45000,0)).toBe(45);
    expect(secondsLeft(45000,44999)).toBe(1);
    expect(secondsLeft(45000,60000)).toBe(0);
  });
  it('makes party-mode bugs jump higher on a music beat',()=>{
    const peakTime=Math.PI/(2*c.bugBounceFrequency);
    expect(bugVerticalOffset(peakTime,0)).toBe(c.bugBobHeight);
    expect(bugPartyJumpOffset(.5)).toBe(c.bugDiscoJumpHeight);
    expect(bugPartyJumpOffset(0)).toBe(0);
    expect(bugPartyJumpOffset(1)).toBe(0);
    expect(bugPartyJumpOffset(.5)).toBeGreaterThan(bugVerticalOffset(peakTime,0));
  });
});
