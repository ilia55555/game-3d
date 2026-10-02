// File: stickman/src/effects/elemental.aura.js
// Role: Creates a switchable ice/fire aura that stays visually flat around the 2D hero in the 2.5D scene.
// Scope: Elemental particles, halo ring, and a small local light only; movement and combat rules stay elsewhere.
// Rule: The effect follows the character but never changes hidden joints, weapon selection, or level collision.
// Goal: Keep the aura expressive without making the environment itself red or blue or breaking the 2D silhouette.

import * as THREE from 'three';

export class ElementalAura {
  constructor(stickman, count = 48) {
    this.stickman = stickman;
    this.count = count;
    this.mode = 'ice';
    this.time = 0;

    this.positions = new Float32Array(count * 3);
    this.seeds = Array.from({ length: count }, (_, index) => ({
      angle: index / count * Math.PI * 2 + Math.random() * 0.45,
      radiusX: 0.42 + Math.random() * 0.72,
      radiusY: 0.72 + Math.random() * 0.86,
      speed: 0.55 + Math.random() * 1.15,
      wobble: Math.random() * Math.PI * 2
    }));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0x8beaff,
      size: 0.085,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.80,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.position.set(0, 0.15, -0.11);
    this.points.frustumCulled = false;
    stickman.add(this.points);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.58, 0.63, 64),
      new THREE.MeshBasicMaterial({
        color: 0x6fdcff,
        transparent: true,
        opacity: 0.30,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      })
    );
    this.ring.scale.set(1.15, 1.70, 1);
    this.ring.position.set(0, 0.18, -0.12);
    stickman.add(this.ring);

    this.light = new THREE.PointLight(0x7eeaff, 1.8, 4.2, 2);
    this.light.position.set(0, 0.35, 1.2);
    stickman.add(this.light);

    this.setMode('ice');
  }

  setMode(mode) {
    this.mode = mode === 'fire' ? 'fire' : 'ice';
    const fire = this.mode === 'fire';
    const color = fire ? 0xff8d3a : 0x86ebff;
    this.material.color.setHex(color);
    this.material.size = fire ? 0.10 : 0.078;
    this.ring.material.color.setHex(fire ? 0xff7a22 : 0x65dcff);
    this.light.color.setHex(fire ? 0xff7830 : 0x75ddff);
    this.light.intensity = fire ? 2.2 : 1.8;
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
      const spin = this.time * seed.speed * (fire ? 0.42 : 0.68);
      const a = seed.angle + spin;

      if (fire) {
        const rise = ((this.time * seed.speed * 0.95 + seed.wobble) % 2.2) - 1.1;
        this.positions[index] = Math.cos(a) * seed.radiusX * (0.70 + (rise + 1.1) * 0.08);
        this.positions[index + 1] = rise + 0.20;
        this.positions[index + 2] = -0.02 + (i % 3) * 0.004;
      } else {
        this.positions[index] = Math.cos(a) * seed.radiusX;
        this.positions[index + 1] = Math.sin(a) * seed.radiusY + 0.20;
        this.positions[index + 2] = -0.02 + (i % 3) * 0.004;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    const pulse = 1 + Math.sin(this.time * (fire ? 4.2 : 2.2)) * 0.045;
    this.ring.scale.set(1.15 * pulse, 1.70 * pulse, 1);
    this.ring.material.opacity = (fire ? 0.23 : 0.28) + Math.sin(this.time * 3.0) * 0.04;
    this.light.intensity = (fire ? 2.1 : 1.7) + Math.sin(this.time * (fire ? 7 : 3)) * 0.20;
  }
}
