// File: stickman/src/weapons/weapon.system.js
// Role: Builds, equips, switches, and lightly animates flat 2D sword and gun art for the side-view hero.
// Scope: Weapon meshes, right-hand attachment, muzzle flash, and element accent color only.
// Rule: Input, hidden-rig posing, enemies, projectiles, and level geometry remain outside this file.
// Goal: Make both weapons read clearly as drawn side-profile equipment that follows the invisible hand socket.

import * as THREE from 'three';

function material(color) {
  return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
}

function shapeMesh(shape, mat, z = 0) {
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), mat);
  mesh.position.z = z;
  mesh.renderOrder = 2;
  return mesh;
}

function rectShape(x0, y0, x1, y1) {
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.lineTo(x1, y0);
  s.lineTo(x1, y1);
  s.lineTo(x0, y1);
  s.closePath();
  return s;
}

export class WeaponSystem {
  constructor(stickman) {
    this.stickman = stickman;
    this.rig = stickman.userData.stickman;
    this.current = 'sword';
    this.flashTime = 0;
    this.actionTime = 0;

    this.dark = material(0x101820);
    this.metal = material(0xd1d9df);
    this.accent = material(0x76eaff);
    this.flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xe6fbff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    });

    this.root = new THREE.Group();
    this.root.name = 'weapon2DRig';
    this.root.position.z = 0.09;
    this.rig.sockets.rightGrip.add(this.root);

    this.sword = this.#buildSword();
    this.gun = this.#buildGun();
    this.root.add(this.sword.root, this.gun.root);
    this.select('sword');
  }

  #buildSword() {
    const root = new THREE.Group();
    root.name = 'sword2D';
    root.position.set(-0.14, 0, 0);
    root.rotation.z = 0;

    const grip = shapeMesh(rectShape(-0.02, -0.045, 0.30, 0.045), this.dark, 0.02);
    root.add(grip);

    const guard = shapeMesh(rectShape(0.25, -0.11, 0.31, 0.11), this.metal, 0.025);
    root.add(guard);

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.31, -0.055);
    bladeShape.lineTo(1.34, -0.040);
    bladeShape.lineTo(1.54, 0.0);
    bladeShape.lineTo(1.34, 0.058);
    bladeShape.lineTo(0.31, 0.055);
    bladeShape.closePath();
    const blade = shapeMesh(bladeShape, this.metal, 0.03);
    root.add(blade);

    const edge = shapeMesh(rectShape(0.34, 0.040, 1.34, 0.070), this.accent, 0.034);
    root.add(edge);

    const pommel = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), this.accent);
    pommel.position.set(-0.055, 0, 0.03);
    root.add(pommel);

    return { root, blade, edge };
  }

  #buildGun() {
    const root = new THREE.Group();
    root.name = 'gun2D';
    root.position.set(-0.25, 0.25, 0);

    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0.02, -0.10);
    bodyShape.lineTo(0.68, -0.10);
    bodyShape.lineTo(0.84, -0.03);
    bodyShape.lineTo(0.80, 0.13);
    bodyShape.lineTo(0.16, 0.15);
    bodyShape.lineTo(0.02, 0.08);
    bodyShape.closePath();
    root.add(shapeMesh(bodyShape, this.dark, 0.03));

    const slide = shapeMesh(rectShape(0.15, 0.08, 0.76, 0.17), this.metal, 0.034);
    root.add(slide);

    const barrel = shapeMesh(rectShape(0.70, -0.025, 1.03, 0.055), this.metal, 0.036);
    root.add(barrel);

    const gripShape = new THREE.Shape();
    gripShape.moveTo(0.18, -0.08);
    gripShape.lineTo(0.38, -0.08);
    gripShape.lineTo(0.31, -0.48);
    gripShape.lineTo(0.12, -0.46);
    gripShape.closePath();
    root.add(shapeMesh(gripShape, this.dark, 0.032));

    const rail = shapeMesh(rectShape(0.22, 0.18, 0.66, 0.205), this.accent, 0.038);
    root.add(rail);

    const muzzle = new THREE.Object3D();
    muzzle.name = 'gunMuzzle2D';
    muzzle.position.set(1.05, 0.015, 0.045);
    root.add(muzzle);

    const flashShape = new THREE.Shape();
    flashShape.moveTo(0, 0);
    flashShape.lineTo(0.28, 0.10);
    flashShape.lineTo(0.18, 0.0);
    flashShape.lineTo(0.30, -0.10);
    flashShape.closePath();
    const flash = shapeMesh(flashShape, this.flashMaterial, 0.05);
    flash.position.set(1.04, 0.015, 0.05);
    root.add(flash);

    return { root, muzzle, flash };
  }

  select(name) {
    if (name !== 'sword' && name !== 'gun') return this.current;
    this.current = name;
    this.sword.root.visible = name === 'sword';
    this.gun.root.visible = name === 'gun';
    this.actionTime = 0;
    return this.current;
  }

  cycle() {
    return this.select(this.current === 'sword' ? 'gun' : 'sword');
  }

  setElementMode(mode) {
    const color = mode === 'fire' ? 0xff8c38 : 0x76eaff;
    this.accent.color.setHex(color);
    this.flashMaterial.color.setHex(mode === 'fire' ? 0xffd29d : 0xe6fbff);
  }

  triggerPrimary() {
    this.actionTime = this.current === 'gun' ? 0.10 : 0.26;
    if (this.current === 'gun') this.flashTime = 0.065;
  }

  getMuzzlePosition(target = new THREE.Vector3()) {
    this.stickman.updateWorldMatrix(true, true);
    if (this.current === 'gun') return this.gun.muzzle.getWorldPosition(target);
    return this.rig.sockets.rightGrip.getWorldPosition(target);
  }

  update(delta) {
    this.flashTime = Math.max(0, this.flashTime - delta);
    this.actionTime = Math.max(0, this.actionTime - delta);

    this.flashMaterial.opacity = this.flashTime > 0 ? this.flashTime / 0.065 : 0;
    if (this.flashTime > 0) {
      const pulse = 0.9 + Math.random() * 0.35;
      this.gun.flash.scale.set(pulse, pulse, 1);
    }

    const gunKick = this.current === 'gun' && this.actionTime > 0
      ? Math.sin((1 - this.actionTime / 0.10) * Math.PI) * 0.035
      : 0;
    this.gun.root.position.x = -0.25 - gunKick;
  }
}
