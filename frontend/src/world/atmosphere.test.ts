import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { config } from '../config';
import { Atmosphere } from './atmosphere';

describe('party atmosphere', () => {
  it('switches the sky on beat events and fades back out when disabled', () => {
    const colorDistance = (a: THREE.Color, b: THREE.Color) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
    const scene = new THREE.Scene();
    const atmosphere = new Atmosphere(scene);
    const position = new THREE.Vector3(0, 0, 0);

    atmosphere.update(position, .5);
    const daytime = (scene.background as THREE.Color).clone();
    atmosphere.setPartyMode(true);
    atmosphere.update(position, .1);
    const firstPartyColor = (scene.background as THREE.Color).clone();
    const firstPartyLight = atmosphere.sun.color.clone();
    atmosphere.triggerPartyBeat();
    atmosphere.update(position, .016);
    const secondPartyColor = (scene.background as THREE.Color).clone();
    const secondPartyLight = atmosphere.sun.color.clone();

    expect(firstPartyColor.equals(new THREE.Color(config.atmosphere.partyLightPalette[0]).multiplyScalar(config.atmosphere.partySkyScale))).toBe(true);
    expect(secondPartyColor.equals(new THREE.Color(config.atmosphere.partyLightPalette[1]).multiplyScalar(config.atmosphere.partySkyScale))).toBe(true);
    expect(firstPartyLight.equals(new THREE.Color(config.atmosphere.partyLightPalette[0]))).toBe(true);
    expect(secondPartyLight.equals(new THREE.Color(config.atmosphere.partyLightPalette[1]))).toBe(true);
    expect(secondPartyColor.equals(firstPartyColor)).toBe(false);

    atmosphere.setPartyMode(false);
    for (let i = 0; i < 30; i++) atmosphere.update(position, .1);
    expect(colorDistance(scene.background as THREE.Color, daytime)).toBeLessThan(colorDistance(firstPartyColor, daytime));
  });
});
