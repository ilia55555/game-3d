// File: stickman/src/combat/projectile.system.js
// Role: Owns pooled visible energy projectiles, travel, enemy hit checks, and impact flashes.
// Scope: Player ranged attacks only; input, enemy AI, player health, and level construction stay elsewhere.
// Rule: Damage is delegated to EnemySystem so projectile visuals never own enemy lifecycle decisions.
// Goal: Make shots bright and readable while avoiding garbage-heavy create/remove loops during combat.

import * as THREE from 'three';

function createProjectileMesh() {
  const group = new THREE.Group();
  group.visible = false;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xbef7ff, toneMapped: false })
  );
  group.add(core);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0x73e3ff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    })
  );
  group.add(halo);

  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.11, 0.9, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x73e3ff,
      transparent: true,
      opacity: 0.40,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    })
  );
  trail.rotation.x = Math.PI * 0.5;
  trail.position.z = 0.42;
  group.add(trail);

  group.userData.visuals = { core, halo, trail };
  return group;
}

function createImpactMesh() {
  const material = new THREE.MeshBasicMaterial({
    color: 0x8eeaff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), material);
  mesh.visible = false;
  return mesh;
}

export class ProjectileSystem {
  constructor({ scene, enemySystem }) {
    this.scene = scene;
    this.enemySystem = enemySystem;
    this.pool = Array.from({ length: 42 }, () => {
      const mesh = createProjectileMesh();
      scene.add(mesh);
      return {
        active: false,
        mesh,
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(0, 0, -1),
        life: 0,
        mode: 'ice',
        damage: 0
      };
    });

    this.impacts = Array.from({ length: 18 }, () => {
      const mesh = createImpactMesh();
      scene.add(mesh);
      return { active: false, mesh, life: 0, maxLife: 0.24 };
    });
  }

  #takeProjectile() {
    return this.pool.find(item => !item.active) ?? this.pool[0];
  }

  #takeImpact() {
    return this.impacts.find(item => !item.active) ?? this.impacts[0];
  }

  spawn(origin, direction, mode = 'ice') {
    const item = this.#takeProjectile();
    const fire = mode === 'fire';
    item.active = true;
    item.mode = fire ? 'fire' : 'ice';
    item.damage = fire ? 32 : 22;
    item.life = fire ? 1.75 : 2.15;
    item.direction.copy(direction).normalize();
    item.velocity.copy(item.direction).multiplyScalar(fire ? 24 : 30);
    item.mesh.position.copy(origin);
    item.mesh.visible = true;
    item.mesh.scale.setScalar(fire ? 1.10 : 0.95);
    item.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), item.direction);

    const color = fire ? 0xff8b3d : 0x75e7ff;
    const bright = fire ? 0xffe0ad : 0xe1fbff;
    const { core, halo, trail } = item.mesh.userData.visuals;
    core.material.color.setHex(bright);
    halo.material.color.setHex(color);
    trail.material.color.setHex(color);
  }

  impact(position, mode) {
    const flash = this.#takeImpact();
    flash.active = true;
    flash.life = flash.maxLife;
    flash.mesh.visible = true;
    flash.mesh.position.copy(position);
    flash.mesh.scale.setScalar(0.35);
    flash.mesh.material.color.setHex(mode === 'fire' ? 0xff8738 : 0x7feaff);
    flash.mesh.material.opacity = 0.86;
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);

    for (const item of this.pool) {
      if (!item.active) continue;
      item.life -= dt;
      item.mesh.position.addScaledVector(item.velocity, dt);
      item.mesh.rotation.z += dt * 6;

      const pulse = 1 + Math.sin(item.life * 19) * 0.08;
      item.mesh.userData.visuals.halo.scale.setScalar(pulse);

      const hit = this.enemySystem?.damageAt?.(
        item.mesh.position,
        item.mode === 'fire' ? 0.34 : 0.27,
        item.damage,
        item.mode,
        item.direction
      );

      const out = Math.hypot(item.mesh.position.x, item.mesh.position.z) > 30 || item.mesh.position.y < -0.5 || item.mesh.position.y > 14;
      if (hit || item.life <= 0 || out) {
        if (hit) this.impact(item.mesh.position, item.mode);
        item.active = false;
        item.mesh.visible = false;
      }
    }

    for (const flash of this.impacts) {
      if (!flash.active) continue;
      flash.life -= dt;
      const t = 1 - Math.max(0, flash.life) / flash.maxLife;
      flash.mesh.scale.setScalar(0.35 + t * 2.2);
      flash.mesh.material.opacity = (1 - t) * 0.78;
      flash.mesh.rotation.x += dt * 7;
      flash.mesh.rotation.y += dt * 5;
      if (flash.life <= 0) {
        flash.active = false;
        flash.mesh.visible = false;
      }
    }
  }

  clear() {
    for (const item of this.pool) {
      item.active = false;
      item.mesh.visible = false;
    }
    for (const flash of this.impacts) {
      flash.active = false;
      flash.mesh.visible = false;
    }
  }
}
