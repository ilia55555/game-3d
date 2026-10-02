// File: stickman/src/model/stickman.materials.js
// Role: Owns flat body, outline, face, and elemental accent materials for the 2D main character.
// Scope: Material definitions only; geometry, hidden joints, animation, gameplay, weapons, and levels stay elsewhere.
// Rule: The character should read like clean 2D art even though it lives inside a Three.js 2.5D scene.
// Goal: Remove the plastic 3D look and keep a crisp cohesive silhouette with subtle elemental accents.

import * as THREE from 'three';
import { STICKMAN_CONFIG as C } from './stickman.config.js';

export function createStickmanMaterials() {
  const body = new THREE.MeshBasicMaterial({
    color: C.bodyColor,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const bodySoft = new THREE.MeshBasicMaterial({
    color: C.bodySecondary,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const outline = new THREE.MeshBasicMaterial({
    color: C.outlineColor,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const iceAccent = new THREE.MeshBasicMaterial({
    color: C.accentIce,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const fireAccent = new THREE.MeshBasicMaterial({
    color: C.accentFire,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const eyes = new THREE.MeshBasicMaterial({
    color: C.eyeColor,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const eyeGlow = new THREE.MeshBasicMaterial({
    color: C.accentIce,
    transparent: true,
    opacity: 0.50,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  return { body, bodySoft, outline, iceAccent, fireAccent, eyes, eyeGlow };
}
