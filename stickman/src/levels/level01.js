// File: stickman/src/levels/level01.js
// Role: Builds the playable outdoor 3D arena, scenery, spawn points, and simple world colliders.
// Scope: Terrain, ruins, trees, rocks, water, crystals, boundaries, and collision metadata only.
// Rule: Character geometry, controls, combat, animation, aura effects, and enemy behavior stay elsewhere.
// Goal: Provide a bright layered environment that feels like a real level instead of a red preview stage.

import * as THREE from 'three';

function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function cylinder(radius, height, color, roughness = 0.9) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.05, height, 10),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 })
  );
}

function makeTree(x, z, scale, root, colliders) {
  const trunk = cylinder(0.18 * scale, 1.8 * scale, 0x62462f, 1);
  trunk.position.set(x, 0.9 * scale, z);
  trunk.castShadow = trunk.receiveShadow = true;
  root.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3d744e, roughness: 0.98 });
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry((0.72 - i * 0.08) * scale, 1),
      foliageMat
    );
    crown.position.set(x + (i - 1) * 0.13 * scale, (1.85 + i * 0.32) * scale, z + (i % 2 ? 0.12 : -0.08) * scale);
    crown.castShadow = true;
    root.add(crown);
  }

  colliders.push({ type: 'circle', x, z, radius: 0.35 * scale });
}

function makeRock(x, z, scale, root, colliders) {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.55 * scale, 0),
    new THREE.MeshStandardMaterial({ color: 0x6d7b80, roughness: 0.96, metalness: 0.02 })
  );
  mesh.position.set(x, 0.35 * scale, z);
  mesh.scale.set(1.25, 0.72, 1.0);
  mesh.rotation.y = x * 0.3 + z * 0.2;
  mesh.castShadow = mesh.receiveShadow = true;
  root.add(mesh);
  colliders.push({ type: 'circle', x, z, radius: 0.55 * scale });
}

function makeCrystal(x, z, root) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  root.add(group);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xb9f4ff,
    emissive: 0x2bb7e7,
    emissiveIntensity: 1.25,
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.94
  });

  for (let i = 0; i < 4; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 + i * 0.025, 0), mat);
    shard.scale.y = 2.4 + i * 0.25;
    shard.position.set((i - 1.5) * 0.13, 0.38 + i * 0.06, (i % 2 ? 1 : -1) * 0.08);
    shard.rotation.z = (i - 1.5) * 0.12;
    shard.castShadow = true;
    group.add(shard);
  }

  const light = new THREE.PointLight(0x72dcff, 1.6, 4, 2);
  light.position.y = 0.8;
  group.add(light);
  return group;
}

function makeRuin(x, z, w, d, h, root, colliders) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x8c9698, roughness: 0.95, metalness: 0.02 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  base.position.set(x, h * 0.5, z);
  base.castShadow = base.receiveShadow = true;
  root.add(base);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, 0.16, d * 1.08), mat);
  cap.position.set(x, h + 0.08, z);
  cap.castShadow = cap.receiveShadow = true;
  root.add(cap);

  colliders.push({ type: 'box', x, z, halfX: w * 0.5, halfZ: d * 0.5 });
}

export function createLevel01(scene) {
  const root = new THREE.Group();
  root.name = 'forestArena';
  scene.add(root);

  const colliders = [];
  const enemySpawns = [
    [-14, -10], [14, -11], [-16, 7], [16, 9], [0, -17], [-8, 15], [10, 16], [18, -2]
  ].map(([x, z]) => new THREE.Vector3(x, 0, z));

  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(33, 96),
    new THREE.MeshStandardMaterial({ color: 0x668a5b, roughness: 1.0, metalness: 0 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  root.add(grass);

  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(16.5, 72),
    new THREE.MeshStandardMaterial({ color: 0x718f67, roughness: 1.0 })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.01;
  inner.receiveShadow = true;
  root.add(inner);

  const pathMat = new THREE.MeshStandardMaterial({ color: 0x9ba3a0, roughness: 0.95 });
  for (let z = -15; z <= 15; z += 2.4) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 1.45), pathMat);
    stone.position.set(Math.sin(z * 0.35) * 0.38, 0.045, z);
    stone.rotation.y = Math.sin(z * 0.17) * 0.12;
    stone.receiveShadow = true;
    root.add(stone);
  }

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(5.1, 64),
    new THREE.MeshStandardMaterial({
      color: 0x4f9ec4,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.78
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.scale.y = 0.62;
  water.position.set(-19, 0.035, -2);
  root.add(water);

  const random = mulberry32(1337);
  for (let i = 0; i < 32; i++) {
    const a = random() * Math.PI * 2;
    const r = 19 + random() * 11;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (x < -14 && Math.abs(z) < 7) continue;
    makeTree(x, z, 0.78 + random() * 0.75, root, colliders);
  }

  const rocks = [
    [-7, -5, 1.1], [8, -7, 0.9], [-11, 3, 1.25], [12, 4, 1.05],
    [-5, 11, 0.85], [6, 12, 1.15], [3, -12, 0.8], [-15, -5, 0.95]
  ];
  rocks.forEach(([x, z, s]) => makeRock(x, z, s, root, colliders));

  makeRuin(-9, -10, 2.3, 1.1, 2.5, root, colliders);
  makeRuin(10, 9, 2.8, 1.2, 1.7, root, colliders);
  makeRuin(-13, 10, 1.2, 2.3, 2.1, root, colliders);
  makeRuin(14, -5, 1.15, 2.8, 2.8, root, colliders);

  const crystals = [makeCrystal(-4, 5, root), makeCrystal(7, 3, root), makeCrystal(3, -8, root)];

  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x738a84, roughness: 1.0 });
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2;
    const radius = 45 + (i % 3) * 3;
    const h = 8 + (i % 5) * 1.4;
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(5.5, h, 7), mountainMat);
    mountain.position.set(Math.cos(a) * radius, h * 0.5 - 0.2, Math.sin(a) * radius);
    mountain.rotation.y = a * 1.7;
    mountain.receiveShadow = true;
    root.add(mountain);
  }

  const clouds = new THREE.Group();
  root.add(clouds);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xe7f7ff, transparent: true, opacity: 0.42, depthWrite: false });
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4 + j * 0.22, 10, 7), cloudMat);
      puff.scale.y = 0.48;
      puff.position.x = j * 1.5;
      c.add(puff);
    }
    const a = i / 8 * Math.PI * 2;
    c.position.set(Math.cos(a) * 32, 12 + (i % 3) * 2, Math.sin(a) * 32);
    c.rotation.y = -a;
    clouds.add(c);
  }

  function resolveCircle(position, radius) {
    const limit = 24.5 - radius;
    const flatLength = Math.hypot(position.x, position.z);
    if (flatLength > limit) {
      position.x = position.x / flatLength * limit;
      position.z = position.z / flatLength * limit;
    }

    for (const c of colliders) {
      if (c.type === 'circle') {
        const dx = position.x - c.x;
        const dz = position.z - c.z;
        const min = radius + c.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 < min * min && d2 > 0.00001) {
          const d = Math.sqrt(d2);
          position.x = c.x + dx / d * min;
          position.z = c.z + dz / d * min;
        }
      } else {
        const nearestX = THREE.MathUtils.clamp(position.x, c.x - c.halfX, c.x + c.halfX);
        const nearestZ = THREE.MathUtils.clamp(position.z, c.z - c.halfZ, c.z + c.halfZ);
        const dx = position.x - nearestX;
        const dz = position.z - nearestZ;
        const d2 = dx * dx + dz * dz;
        if (d2 < radius * radius) {
          if (d2 > 0.00001) {
            const d = Math.sqrt(d2);
            position.x = nearestX + dx / d * radius;
            position.z = nearestZ + dz / d * radius;
          } else {
            const left = Math.abs(position.x - (c.x - c.halfX));
            const right = Math.abs(position.x - (c.x + c.halfX));
            const top = Math.abs(position.z - (c.z - c.halfZ));
            const bottom = Math.abs(position.z - (c.z + c.halfZ));
            const m = Math.min(left, right, top, bottom);
            if (m === left) position.x = c.x - c.halfX - radius;
            else if (m === right) position.x = c.x + c.halfX + radius;
            else if (m === top) position.z = c.z - c.halfZ - radius;
            else position.z = c.z + c.halfZ + radius;
          }
        }
      }
    }
  }

  return {
    root,
    colliders,
    enemySpawns,
    playerSpawn: new THREE.Vector3(0, 0, 7),
    resolveCircle,
    update(time) {
      water.material.opacity = 0.72 + Math.sin(time * 1.2) * 0.035;
      clouds.rotation.y = time * 0.0025;
      crystals.forEach((crystal, index) => {
        crystal.rotation.y = time * (0.18 + index * 0.025);
        crystal.position.y = Math.sin(time * 1.6 + index) * 0.035;
      });
    }
  };
}
