// File: stickman/src/levels/level01.js
// Role: Builds the current model-inspection stage and future Level 01 entry surface.
// Scope: Ground, grid, environmental markers, and level-owned scene objects only.
// Rule: Character geometry, animation, player controls, enemy AI, and combat logic stay elsewhere.
// Goal: Keep stage design replaceable without touching the stickman or gameplay systems.

import * as THREE from 'three';

export function createLevel01(scene) {
  const root = new THREE.Group();
  root.name = 'level01';
  scene.add(root);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(8.8, 72),
    new THREE.MeshStandardMaterial({
      color: 0x100906,
      roughness: 0.96,
      metalness: 0.0
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xff650d,
    transparent: true,
    opacity: 0.23,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (const radius of [1.65, 3.0, 4.6, 6.5]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.012, radius + 0.012, 96),
      ringMaterial
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.006;
    root.add(ring);
  }

  const spokeMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8c2a,
    transparent: true,
    opacity: 0.10,
    depthWrite: false
  });

  for (let i = 0; i < 12; i++) {
    const spoke = new THREE.Mesh(
      new THREE.PlaneGeometry(0.012, 12.6),
      spokeMaterial
    );
    spoke.rotation.x = -Math.PI / 2;
    spoke.rotation.z = i * Math.PI / 6;
    spoke.position.y = 0.005;
    root.add(spoke);
  }

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.28, 0.12, 48),
    new THREE.MeshStandardMaterial({
      color: 0x160c07,
      emissive: 0x431500,
      emissiveIntensity: 0.35,
      roughness: 0.82,
      metalness: 0.08
    })
  );
  pedestal.position.y = 0.06;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.026, 8, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff6a00,
      transparent: true,
      opacity: 0.66,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 0.14;
  root.add(glowRing);

  return {
    root,
    update(time) {
      glowRing.material.opacity = 0.54 + Math.sin(time * 2.1) * 0.12;
      glowRing.rotation.z = time * 0.08;
    }
  };
}
