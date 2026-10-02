// File: stickman/src/effects/elemental.aura.js
// Role: Creates and animates the hero's switchable ice/fire aura using lightweight procedural particles.
// Scope: Elemental visuals and a small local light only; combat damage and character geometry stay elsewhere.
// Rule: The effect follows the stickman but never changes player movement, enemy AI, or level rules directly.
// Goal: Give the main character a strong readable identity without coloring the whole environment red or blue.

import * as THREE from 'three';

export class ElementalAura {
  constructor(stickman, count = 64) {
    this.stickman = stickman;
    this.count = count;
    this.mode = 'ice';
    this.time = 0;

    this.positions = new Float32Array(count * 3);
    this.seeds = Array.from({ length: count }, (_, index) => ({
      angle: index / count * Math.PI * 2 + Math.random() * 0.45,
      radius: 0.45 + Math.random() * 0.72,
      y: -1.20 + Math.random() * 3.25,
      speed: 0.55 + Math.random() * 1.25,
      wobble: Math.random() * Math.PI * 2
    }));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0x8beaff,
      size: 0.105,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    stickman.add(this.points);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.025, 8, 48),
      new THREE.MeshBasicMaterial({
        color: 0x6fdcff,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.ring.rotation.x = Math.PI * 0.5;
    this.ring.position.y = -1.37;
    stickman.add(this.ring);

    this.light = new THREE.PointLight(0x7eeaff, 2.8, 4.6, 2);
    this.light.position.y = 0.40;
    stickman.add(this.light);

    this.setMode('ice');
  }

  setMode(mode) {
    this.mode = mode === 'fire' ? 'fire' : 'ice';
    const fire = this.mode === 'fire';
    const color = fire ? 0xff8d3a : 0x86ebff;
    this.material.color.setHex(color);
    this.material.size = fire ? 0.125 : 0.095;
    this.ring.material.color.setHex(fire ? 0xff7a22 : 0x65dcff);
    this.light.color.setHex(fire ? 0xff7830 : 0x75ddff);
    this.light.intensity = fire ? 3.5 : 2.8;
    this.stickman.userData.stickman?.setElementMode?.(this.mode);
  }

  toggle() {
    this.setMode(this.mode === 'ice' ? 'fire' : 'ice');
    return this.mode;
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    const fire = this.mode === 'fire';

    for (let i = 0; i < this.count; i++) {
      const seed = this.seeds[i];
      const index = i * 3;
      const spin = this.time * seed.speed * (fire ? 0.72 : 1.18);
      const radius = seed.radius * (1 + Math.sin(this.time * 2.1 + seed.wobble) * 0.10);

      if (fire) {
        const yCycle = ((seed.y + this.time * seed.speed * 1.35 + 1.35) % 3.25) - 1.35;
        this.positions[index] = Math.cos(seed.angle + spin) * radius * (0.72 + (yCycle + 1.35) * 0.06);
        this.positions[index + 1] = yCycle;
        this.positions[index + 2] = Math.sin(seed.angle + spin) * radius * 0.72;
      } else {
        this.positions[index] = Math.cos(seed.angle + spin) * radius;
        this.positions[index + 1] = seed.y + Math.sin(this.time * seed.speed * 1.7 + seed.wobble) * 0.14;
        this.positions[index + 2] = Math.sin(seed.angle + spin) * radius;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.y += dt * (fire ? 0.24 : 0.42);
    this.ring.rotation.z += dt * (fire ? -1.1 : 0.62);
    this.ring.scale.setScalar(1 + Math.sin(this.time * 2.6) * 0.07);
    this.ring.material.opacity = 0.33 + Math.sin(this.time * 3.2) * 0.09;
    this.light.intensity = (fire ? 3.2 : 2.6) + Math.sin(this.time * (fire ? 8 : 3)) * (fire ? 0.6 : 0.25);
  }
}
