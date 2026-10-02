// File: stickman/src/model/stickman.materials.js
// Role: Owns all reusable materials used by the stickman model.
// Scope: Core black body, orange glow shells, eye material, and debug socket material.
// Rule: Geometry, animation, gameplay, damage, enemies, and levels must not be defined here.
// Goal: Make the character's visual identity editable from one small focused file.

import * as THREE from 'three';
import { STICKMAN_CONFIG } from './stickman.config.js';

export function createStickmanMaterials() {
  const core = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.62,
    metalness: 0.08
  });

  const coreSoft = new THREE.MeshStandardMaterial({
    color: 0x0b0908,
    roughness: 0.74,
    metalness: 0.03
  });

  const glow = new THREE.MeshBasicMaterial({
    color: STICKMAN_CONFIG.glowColor,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const glowStrong = new THREE.MeshBasicMaterial({
    color: STICKMAN_CONFIG.glowStrongColor,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const eyes = new THREE.MeshBasicMaterial({
    color: STICKMAN_CONFIG.eyeColor,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const eyeGlow = new THREE.MeshBasicMaterial({
    color: 0xffc57a,
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const socketDebug = new THREE.MeshBasicMaterial({
    color: 0x50e3ff,
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });

  return {
    core,
    coreSoft,
    glow,
    glowStrong,
    eyes,
    eyeGlow,
    socketDebug
  };
}
