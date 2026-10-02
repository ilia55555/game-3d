// File: stickman/src/levels/level01.js
// Role: Builds the 3D scenery and collision lane used by the new 2.5D side-scrolling character test.
// Scope: Ground, background depth layers, trees, rocks, ruins, water, crystals, boundaries, and spawn only.
// Rule: Character art, animation, weapons, input, enemies, and elemental effects stay in their own modules.
// Goal: Keep the world visibly three-dimensional while gameplay movement stays on one clean side-view plane.

import * as THREE from 'three';

function mat(color, roughness = 0.92) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

function box(w, h, d, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tree(x, z, scale, root) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * scale, 0.18 * scale, 1.7 * scale, 8),
    mat(0x66503a, 1)
  );
  trunk.position.set(x, 0.85 * scale, z);
  trunk.castShadow = true;
  root.add(trunk);

  const leafMaterial = mat(z < -4 ? 0x527f5d : 0x477955, 1);
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry((0.62 - i * 0.06) * scale, 1),
      leafMaterial
    );
    crown.position.set(
      x + (i - 1) * 0.11 * scale,
      (1.75 + i * 0.25) * scale,
      z + (i % 2 ? 0.12 : -0.08)
    );
    crown.castShadow = true;
    root.add(crown);
  }
}

function crystal(x, z, root) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  root.add(group);

  const material = new THREE.MeshStandardMaterial({
    color: 0xbdf6ff,
    emissive: 0x46bfe8,
    emissiveIntensity: 1.35,
    roughness: 0.16,
    metalness: 0.06,
    transparent: true,
    opacity: 0.92
  });

  for (let i = 0; i < 3; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.15 + i * 0.03, 0), material);
    shard.scale.y = 2.1 + i * 0.3;
    shard.position.set((i - 1) * 0.18, 0.38 + i * 0.06, 0);
    shard.rotation.z = (i - 1) * 0.16;
    group.add(shard);
  }

  const light = new THREE.PointLight(0x78deff, 1.3, 3.2, 2);
  light.position.y = 0.65;
  group.add(light);
  return group;
}

export function createLevel01(scene) {
  const root = new THREE.Group();
  root.name = 'sideViewForest';
  scene.add(root);

  const ground = box(74, 0.55, 10, 0x668b5d);
  ground.position.set(0, -0.275, 0);
  root.add(ground);

  const soil = box(74, 1.3, 10.2, 0x586049);
  soil.position.set(0, -1.15, 0);
  root.add(soil);

  const pathMaterial = mat(0xa8b0aa, 0.96);
  for (let x = -30; x <= 30; x += 2.4) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 1.8), pathMaterial);
    slab.position.set(x + Math.sin(x * 0.4) * 0.18, 0.04, 0.30);
    slab.rotation.y = Math.sin(x * 0.3) * 0.10;
    slab.receiveShadow = true;
    root.add(slab);
  }

  const backHillMaterial = mat(0x7d9f75, 1);
  for (let i = 0; i < 11; i++) {
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(4.0 + (i % 3) * 0.8, 7 + (i % 4) * 1.1, 8),
      backHillMaterial
    );
    hill.position.set(-34 + i * 7.0, 2.4, -14 - (i % 2) * 2.5);
    hill.rotation.y = i * 0.37;
    root.add(hill);
  }

  const treePositions = [
    [-28, -6, 1.25], [-22, -4.5, 0.95], [-16, -7, 1.4], [-10, -5.5, 1.1],
    [-3, -6.8, 1.25], [5, -5.3, 1.05], [11, -7.2, 1.35], [18, -4.8, 0.95],
    [24, -6.2, 1.28], [30, -5.0, 1.05]
  ];
  treePositions.forEach(([x, z, scale]) => tree(x, z, scale, root));

  const ruinMaterial = mat(0x8e999a, 0.96);
  for (const [x, z, w, h] of [[-18, -2.8, 2.2, 2.6], [14, -3.5, 2.8, 1.7], [27, -2.7, 1.6, 3.1]]) {
    const ruin = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.0), ruinMaterial);
    ruin.position.set(x, h * 0.5, z);
    ruin.castShadow = ruin.receiveShadow = true;
    root.add(ruin);
  }

  const foregroundRockMaterial = mat(0x68767a, 0.98);
  for (const [x, z, s] of [[-25, 2.7, 0.9], [-7, 2.9, 0.7], [9, 3.1, 1.05], [22, 2.5, 0.8]]) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 * s, 0), foregroundRockMaterial);
    rock.position.set(x, 0.30 * s, z);
    rock.scale.set(1.25, 0.72, 0.95);
    rock.rotation.y = x * 0.2;
    rock.castShadow = true;
    root.add(rock);
  }

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 5),
    new THREE.MeshStandardMaterial({
      color: 0x5ba4c9,
      roughness: 0.20,
      metalness: 0.02,
      transparent: true,
      opacity: 0.72
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(8, 0.025, -5.8);
  root.add(water);

  const crystals = [
    crystal(-13, -2.0, root),
    crystal(3, -2.4, root),
    crystal(20, -2.1, root)
  ];

  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0xf0fbff,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });
  const clouds = new THREE.Group();
  root.add(clouds);
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.1 + j * 0.18, 10, 7), cloudMaterial);
      puff.scale.y = 0.48;
      puff.position.x = j * 1.2;
      cloud.add(puff);
    }
    cloud.position.set(-28 + i * 9.5, 9 + (i % 3) * 1.2, -18);
    clouds.add(cloud);
  }

  const worldMinX = -32;
  const worldMaxX = 32;

  function getGroundY(_x) {
    return 0;
  }

  function resolveSide(position, radius = 0.3) {
    position.x = THREE.MathUtils.clamp(position.x, worldMinX + radius, worldMaxX - radius);
    position.z = 0;
  }

  return {
    root,
    playerSpawn: new THREE.Vector3(-8, 0, 0),
    getGroundY,
    resolveSide,
    worldMinX,
    worldMaxX,
    update(time) {
      water.material.opacity = 0.69 + Math.sin(time * 1.4) * 0.035;
      clouds.position.x = Math.sin(time * 0.035) * 1.8;
      crystals.forEach((item, index) => {
        item.rotation.y = time * (0.14 + index * 0.025);
        item.position.y = Math.sin(time * 1.6 + index) * 0.03;
      });
    }
  };
}
