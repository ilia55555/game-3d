// File: stickman/src/enemies/enemy.system.js
// Role: Owns enemy creation, wave spawning, chase AI, melee attacks, elemental reactions, and death cleanup.
// Scope: Enemy entities and lifecycle only; player input, projectiles, hero model, aura, and level art stay elsewhere.
// Rule: Incoming ranged hits arrive through damageAt and player damage is delegated to PlayerController.
// Goal: Provide a complete lightweight arena loop without turning the main entry file into an AI monolith.

import * as THREE from 'three';

function capsule(radius, length, material) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 6, 12),
    material
  );
  mesh.castShadow = true;
  return mesh;
}

function buildEnemyModel() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x28313a,
    roughness: 0.58,
    metalness: 0.08,
    emissive: 0x111a23,
    emissiveIntensity: 0.45
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xcaa6ff,
    emissive: 0x713de0,
    emissiveIntensity: 1.8,
    roughness: 0.22
  });

  const torso = capsule(0.20, 0.88, bodyMat);
  torso.position.y = 1.18;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), bodyMat);
  head.position.y = 1.83;
  head.scale.set(1, 1.05, 0.92);
  head.castShadow = true;
  group.add(head);

  const eyeBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.035), accentMat);
  eyeBar.position.set(0, 1.86, -0.245);
  group.add(eyeBar);

  const chest = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), accentMat);
  chest.position.set(0, 1.32, -0.19);
  group.add(chest);

  const limbs = {};
  for (const side of [-1, 1]) {
    const prefix = side < 0 ? 'left' : 'right';
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.27, 1.46, 0);
    const arm = capsule(0.075, 0.62, bodyMat);
    arm.position.y = -0.31;
    armPivot.add(arm);
    group.add(armPivot);
    limbs[`${prefix}Arm`] = armPivot;

    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.13, 0.80, 0);
    const leg = capsule(0.09, 0.72, bodyMat);
    leg.position.y = -0.36;
    legPivot.add(leg);
    group.add(legPivot);
    limbs[`${prefix}Leg`] = legPivot;
  }

  group.userData.enemyVisual = { bodyMat, accentMat, chest, limbs };
  return group;
}

export class EnemySystem {
  constructor({ scene, level, player, onCountChange, onWaveChange, onScore }) {
    this.scene = scene;
    this.level = level;
    this.player = player;
    this.onCountChange = onCountChange;
    this.onWaveChange = onWaveChange;
    this.onScore = onScore;

    this.enabled = false;
    this.enemies = [];
    this.wave = 0;
    this.score = 0;
    this.nextWaveTimer = 0;
    this.time = 0;
    this.playerPosition = new THREE.Vector3();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  start() {
    this.clear();
    this.enabled = true;
    this.wave = 0;
    this.score = 0;
    this.nextWaveTimer = 0.35;
    this.onScore?.(this.score);
    this.onWaveChange?.(1);
  }

  #spawnEnemy(position, index) {
    const mesh = buildEnemyModel();
    mesh.position.set(position.x, 0, position.z);
    mesh.rotation.y = index * 0.7;
    this.scene.add(mesh);

    const hp = 58 + this.wave * 10;
    const enemy = {
      mesh,
      hp,
      maxHp: hp,
      radius: 0.46,
      speed: 2.15 + Math.min(this.wave * 0.09, 1.35),
      attackCooldown: 0.55 + Math.random() * 0.65,
      slowTimer: 0,
      burnTimer: 0,
      burnTick: 0,
      deathTimer: 0,
      dead: false,
      walkTime: Math.random() * 10,
      knockback: new THREE.Vector3()
    };
    this.enemies.push(enemy);
    return enemy;
  }

  spawnWave() {
    this.wave += 1;
    const count = Math.min(3 + this.wave * 2, 15);
    const spawns = this.level.enemySpawns;
    for (let i = 0; i < count; i++) {
      const base = spawns[i % spawns.length];
      const ring = Math.floor(i / spawns.length);
      const offset = new THREE.Vector3(
        Math.sin(i * 2.13) * ring * 1.2,
        0,
        Math.cos(i * 1.77) * ring * 1.2
      );
      this.#spawnEnemy(base.clone().add(offset), i);
    }
    this.onWaveChange?.(this.wave);
    this.#notifyCount();
  }

  #notifyCount() {
    this.onCountChange?.(this.enemies.filter(enemy => !enemy.dead).length);
  }

  #damageEnemy(enemy, damage, mode, direction) {
    if (!enemy || enemy.dead) return false;
    enemy.hp -= damage;
    const visuals = enemy.mesh.userData.enemyVisual;
    visuals.accentMat.emissiveIntensity = 3.4;

    if (mode === 'ice') enemy.slowTimer = Math.max(enemy.slowTimer, 1.5);
    if (mode === 'fire') {
      enemy.burnTimer = Math.max(enemy.burnTimer, 1.8);
      enemy.burnTick = 0.18;
    }

    if (direction) {
      enemy.knockback.addScaledVector(direction, mode === 'fire' ? 3.4 : 2.2);
      enemy.knockback.y = 0;
    }

    if (enemy.hp <= 0) this.#kill(enemy);
    return true;
  }

  #kill(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    enemy.deathTimer = 0.55;
    const gain = 100 + this.wave * 15;
    this.score += gain;
    this.onScore?.(this.score, gain);
    this.#notifyCount();
  }

  damageAt(position, radius, damage, mode, direction) {
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const center = enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.18, 0));
      if (center.distanceToSquared(position) <= (enemy.radius + radius) ** 2) {
        return this.#damageEnemy(enemy, damage, mode, direction);
      }
    }
    return false;
  }

  meleeAttack(origin, direction, mode) {
    let hits = 0;
    const flatDirection = direction.clone().setY(0).normalize();
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const target = enemy.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const delta = target.sub(origin);
      const distance = delta.length();
      if (distance > 2.25) continue;
      const facing = delta.clone().setY(0).normalize().dot(flatDirection);
      if (facing < -0.1) continue;
      this.#damageEnemy(enemy, mode === 'fire' ? 48 : 38, mode, flatDirection);
      hits += 1;
    }
    return hits;
  }

  update(delta) {
    if (!this.enabled) return;
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    this.player.getPosition(this.playerPosition);

    let alive = 0;
    for (const enemy of this.enemies) {
      const mesh = enemy.mesh;
      const visual = mesh.userData.enemyVisual;

      if (enemy.dead) {
        enemy.deathTimer -= dt;
        const scale = Math.max(0.001, enemy.deathTimer / 0.55);
        mesh.scale.setScalar(scale);
        mesh.rotation.y += dt * 5;
        if (enemy.deathTimer <= 0 && mesh.parent) this.scene.remove(mesh);
        continue;
      }

      alive += 1;
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
      enemy.attackCooldown -= dt;
      visual.accentMat.emissiveIntensity = THREE.MathUtils.lerp(visual.accentMat.emissiveIntensity, enemy.burnTimer > 0 ? 2.5 : 1.8, 1 - Math.exp(-dt * 8));

      if (enemy.burnTimer > 0) {
        enemy.burnTick -= dt;
        visual.accentMat.color.setHex(0xffa05c);
        visual.accentMat.emissive.setHex(0xff5722);
        if (enemy.burnTick <= 0) {
          enemy.burnTick = 0.32;
          enemy.hp -= 3;
          if (enemy.hp <= 0) {
            this.#kill(enemy);
            continue;
          }
        }
      } else if (enemy.slowTimer > 0) {
        visual.accentMat.color.setHex(0xbcefff);
        visual.accentMat.emissive.setHex(0x4aa7ff);
      } else {
        visual.accentMat.color.setHex(0xcaa6ff);
        visual.accentMat.emissive.setHex(0x713de0);
      }

      const toPlayer = this.playerPosition.clone().sub(mesh.position);
      toPlayer.y = 0;
      const distance = toPlayer.length();
      const direction = distance > 0.001 ? toPlayer.multiplyScalar(1 / distance) : new THREE.Vector3();
      const slow = enemy.slowTimer > 0 ? 0.48 : 1;
      const movement = distance > 1.28 ? enemy.speed * slow : 0;

      enemy.knockback.multiplyScalar(Math.exp(-dt * 5.8));
      mesh.position.addScaledVector(direction, movement * dt);
      mesh.position.addScaledVector(enemy.knockback, dt);
      this.level.resolveCircle(mesh.position, 0.40);

      if (direction.lengthSq() > 0) {
        const targetYaw = Math.atan2(direction.x, direction.z);
        const diff = Math.atan2(Math.sin(targetYaw - mesh.rotation.y), Math.cos(targetYaw - mesh.rotation.y));
        mesh.rotation.y += diff * (1 - Math.exp(-dt * 8));
      }

      enemy.walkTime += dt * (movement > 0 ? 7.5 : 2.2);
      const swing = Math.sin(enemy.walkTime) * (movement > 0 ? 0.55 : 0.08);
      visual.limbs.leftArm.rotation.x = -swing;
      visual.limbs.rightArm.rotation.x = swing;
      visual.limbs.leftLeg.rotation.x = swing;
      visual.limbs.rightLeg.rotation.x = -swing;
      visual.chest.rotation.y += dt * 2.4;

      if (distance < 1.38 && enemy.attackCooldown <= 0 && !this.player.dead) {
        enemy.attackCooldown = Math.max(0.58, 1.05 - this.wave * 0.025);
        visual.limbs.rightArm.rotation.x = -1.35;
        this.player.takeDamage(10 + Math.min(this.wave * 1.2, 12));
      }
    }

    this.enemies = this.enemies.filter(enemy => !enemy.dead || enemy.deathTimer > 0);

    if (alive === 0 && !this.player.dead) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) {
        this.nextWaveTimer = 2.1;
        this.spawnWave();
      }
    }
  }

  clear() {
    for (const enemy of this.enemies) {
      if (enemy.mesh.parent) this.scene.remove(enemy.mesh);
    }
    this.enemies.length = 0;
    this.#notifyCount();
  }
}
