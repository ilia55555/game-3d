// File: stickman/src/weapons/weapon.system.js
// Role: Builds, equips, switches, and animates the hero sword and gun models.
// Scope: Weapon meshes, right-hand attachment, muzzle flash, and element accent color only.
// Rule: Input, character animation, enemy AI, projectiles, and level geometry stay outside this file.
// Goal: Let weapons be edited independently while remaining correctly attached to the hidden hand rig.

import * as THREE from 'three';

function mesh(geometry, material) {
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = false;
  return object;
}

export class WeaponSystem {
  constructor(stickman) {
    this.stickman = stickman;
    this.rig = stickman.userData.stickman;
    this.current = 'sword';
    this.flashTime = 0;

    this.dark = new THREE.MeshStandardMaterial({
      color: 0x101820,
      roughness: 0.42,
      metalness: 0.58
    });
    this.metal = new THREE.MeshStandardMaterial({
      color: 0xb7c4cf,
      roughness: 0.28,
      metalness: 0.82
    });
    this.accent = new THREE.MeshStandardMaterial({
      color: 0x76eaff,
      emissive: 0x76eaff,
      emissiveIntensity: 1.6,
      roughness: 0.24,
      metalness: 0.35
    });
    this.flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xdafaff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });

    this.root = new THREE.Group();
    this.root.name = 'weaponRig';
    this.rig.sockets.rightGrip.add(this.root);

    this.sword = this.#buildSword();
    this.gun = this.#buildGun();
    this.root.add(this.sword.root, this.gun.root);
    this.select('sword');
  }

  #buildSword() {
    const root = new THREE.Group();
    root.name = 'sword';
    root.rotation.set(0.08, 0, 0);

    const grip = mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.30, 12), this.dark);
    grip.rotation.x = Math.PI / 2;
    grip.position.z = -0.10;
    root.add(grip);

    const pommel = mesh(new THREE.SphereGeometry(0.065, 14, 10), this.accent);
    pommel.position.z = 0.075;
    root.add(pommel);

    const guard = mesh(new THREE.BoxGeometry(0.42, 0.055, 0.07), this.metal);
    guard.position.z = -0.25;
    root.add(guard);

    const bladeGeometry = new THREE.BoxGeometry(0.095, 0.035, 1.18);
    bladeGeometry.translate(0, 0, -0.59);
    const blade = mesh(bladeGeometry, this.metal);
    blade.position.z = -0.29;
    root.add(blade);

    const edge = mesh(new THREE.BoxGeometry(0.022, 0.045, 1.12), this.accent);
    edge.position.set(0.050, 0, -0.87);
    root.add(edge);

    return { root, blade, edge, guard };
  }

  #buildGun() {
    const root = new THREE.Group();
    root.name = 'gun';
    root.position.set(0.01, 0.015, -0.02);

    const body = mesh(new THREE.BoxGeometry(0.22, 0.20, 0.62), this.dark);
    body.position.z = -0.34;
    root.add(body);

    const upper = mesh(new THREE.BoxGeometry(0.16, 0.09, 0.56), this.metal);
    upper.position.set(0, 0.105, -0.34);
    root.add(upper);

    const barrel = mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.54, 14), this.metal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.82;
    root.add(barrel);

    const grip = mesh(new THREE.BoxGeometry(0.13, 0.36, 0.15), this.dark);
    grip.position.set(0, -0.24, -0.20);
    grip.rotation.x = -0.20;
    root.add(grip);

    const accentRail = mesh(new THREE.BoxGeometry(0.035, 0.035, 0.44), this.accent);
    accentRail.position.set(0, 0.16, -0.36);
    root.add(accentRail);

    const muzzle = new THREE.Object3D();
    muzzle.name = 'gunMuzzle';
    muzzle.position.set(0, 0, -1.10);
    root.add(muzzle);

    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), this.flashMaterial);
    flash.position.copy(muzzle.position);
    flash.scale.set(0.75, 0.75, 1.8);
    root.add(flash);

    return { root, muzzle, flash, body };
  }

  select(name) {
    if (name !== 'sword' && name !== 'gun') return this.current;
    this.current = name;
    this.sword.root.visible = name === 'sword';
    this.gun.root.visible = name === 'gun';
    return this.current;
  }

  cycle(direction = 1) {
    if (direction === 0) return this.current;
    return this.select(this.current === 'sword' ? 'gun' : 'sword');
  }

  setElementMode(mode) {
    const color = mode === 'fire' ? 0xff8c38 : 0x76eaff;
    this.accent.color.setHex(color);
    this.accent.emissive.setHex(color);
    this.flashMaterial.color.setHex(mode === 'fire' ? 0xffd29d : 0xdafaff);
  }

  triggerPrimary() {
    if (this.current !== 'gun') return;
    this.flashTime = 0.075;
    this.gun.flash.scale.setScalar(1);
    this.gun.flash.scale.z = 1.8;
  }

  getMuzzlePosition(target = new THREE.Vector3()) {
    this.stickman.updateWorldMatrix(true, true);
    if (this.current === 'gun') return this.gun.muzzle.getWorldPosition(target);
    return this.rig.sockets.rightGrip.getWorldPosition(target);
  }

  update(delta) {
    this.flashTime = Math.max(0, this.flashTime - delta);
    const active = this.flashTime > 0;
    this.flashMaterial.opacity = active ? this.flashTime / 0.075 : 0;
    if (active) {
      const pulse = 0.9 + Math.random() * 0.45;
      this.gun.flash.scale.set(pulse, pulse, pulse * 1.8);
    }
  }
}
