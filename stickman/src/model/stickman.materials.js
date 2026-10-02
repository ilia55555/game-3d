// File: stickman/src/model/stickman.materials.js
// Role: Owns reusable body, face, and elemental accent materials for the main character.
// Scope: Material definitions only; geometry, animation, gameplay, enemies, and levels stay elsewhere.
// Rule: Elemental aura particles are handled by the effects module rather than fake glow shells here.
// Goal: Give the stickman a clean unified body that reads well in both ice and fire modes.

import * as THREE from 'three';
import { STICKMAN_CONFIG as C } from './stickman.config.js';

export function createStickmanMaterials() {
  const body = new THREE.MeshStandardMaterial({
    color: C.bodyColor,
    roughness: 0.38,
    metalness: 0.16,
    emissive: 0x07131b,
    emissiveIntensity: 0.34
  });

  const bodySoft = new THREE.MeshStandardMaterial({
    color: C.bodySecondary,
    roughness: 0.48,
    metalness: 0.10,
    emissive: 0x07131b,
    emissiveIntensity: 0.22
  });

  const iceAccent = new THREE.MeshStandardMaterial({
    color: 0xcff9ff,
    roughness: 0.18,
    metalness: 0.06,
    emissive: C.accentIce,
    emissiveIntensity: 2.0,
    toneMapped: true
  });

  const fireAccent = new THREE.MeshStandardMaterial({
    color: 0xffd3a8,
    roughness: 0.20,
    metalness: 0.04,
    emissive: C.accentFire,
    emissiveIntensity: 2.2,
    toneMapped: true
  });

  const eyes = new THREE.MeshBasicMaterial({
    color: C.eyeColor,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const eyeGlow = new THREE.MeshBasicMaterial({
    color: C.accentIce,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  return { body, bodySoft, iceAccent, fireAccent, eyes, eyeGlow };
}
