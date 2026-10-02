// File: stickman/src/model/stickman.model.js
// Role: Builds the cohesive procedural 3D hero and exposes animation joints and detachable part groups.
// Scope: Character geometry, hierarchy, face, accent sockets, and element-material switching only.
// Rule: Animation timing, controls, combat, enemy AI, aura particles, and level construction stay elsewhere.
// Goal: Make the body read as one smooth character instead of separate glowing rods while staying modular.

import * as THREE from 'three';
import { createStickmanMaterials } from './stickman.materials.js';
import { STICKMAN_CONFIG as C } from './stickman.config.js';

function shadowify(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  return mesh;
}

function sphere(radius, material, scale = [1, 1, 1]) {
  const mesh = shadowify(new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material));
  mesh.scale.set(...scale);
  return mesh;
}

function capsuleSegment(name, length, radius, material) {
  const pivot = new THREE.Group();
  pivot.name = name;

  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 8, 16);
  const mesh = shadowify(new THREE.Mesh(geometry, material));
  mesh.position.y = -length * 0.5;
  pivot.add(mesh);

  return { pivot, mesh };
}

function createEyeShape(side) {
  const s = side;
  const shape = new THREE.Shape();
  shape.moveTo(-0.105 * s, 0.05);
  shape.quadraticCurveTo(0.01 * s, 0.06, 0.11 * s, 0.005);
  shape.quadraticCurveTo(0.045 * s, -0.095, -0.075 * s, -0.045);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 6);
}

function createHead(materials) {
  const head = new THREE.Group();
  head.name = 'head';

  const skull = sphere(C.headRadius, materials.bodySoft, [1.0, 1.04, 0.94]);
  head.add(skull);

  const jaw = sphere(C.headRadius * 0.78, materials.body, [1.0, 0.58, 0.90]);
  jaw.position.y = -C.headRadius * 0.34;
  head.add(jaw);

  const eyeRoots = [];
  for (const side of [-1, 1]) {
    const eyeRoot = new THREE.Group();
    eyeRoot.position.set(side * 0.115, 0.045, C.headRadius * 0.90);

    const aura = new THREE.Mesh(createEyeShape(side), materials.eyeGlow);
    aura.scale.setScalar(1.28);
    aura.position.z = -0.005;
    eyeRoot.add(aura);

    const eye = new THREE.Mesh(createEyeShape(side), materials.eyes);
    eyeRoot.add(eye);
    head.add(eyeRoot);
    eyeRoots.push({ root: eyeRoot, aura, eye });
  }

  return { root: head, skull, jaw, eyeRoots };
}

function createTorso(materials) {
  const torso = new THREE.Group();
  torso.name = 'torso';

  const center = shadowify(new THREE.Mesh(
    new THREE.CapsuleGeometry(C.torsoRadius, C.torsoLength - C.torsoRadius * 2, 10, 20),
    materials.body
  ));
  center.position.y = C.torsoLength * 0.5;
  torso.add(center);

  const chest = sphere(C.chestRadius, materials.bodySoft, [1.28, 0.70, 0.82]);
  chest.position.y = C.torsoLength * 0.78;
  torso.add(chest);

  const pelvis = sphere(C.pelvisRadius, materials.body, [1.24, 0.66, 0.88]);
  pelvis.position.y = 0.02;
  torso.add(pelvis);

  const core = shadowify(new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), materials.iceAccent));
  core.position.set(0, C.torsoLength * 0.73, 0.205);
  core.rotation.z = Math.PI * 0.25;
  torso.add(core);

  return { root: torso, center, chest, pelvis, core };
}

function createArm(side, materials) {
  const prefix = side < 0 ? 'left' : 'right';
  const upper = capsuleSegment(`${prefix}UpperArm`, C.upperArm, C.upperArmRadius, materials.body);
  const lower = capsuleSegment(`${prefix}LowerArm`, C.lowerArm, C.lowerArmRadius, materials.bodySoft);

  lower.pivot.position.y = -C.upperArm;
  upper.pivot.add(lower.pivot);

  const elbow = sphere(C.upperArmRadius * 1.05, materials.bodySoft);
  elbow.position.y = -C.upperArm;
  upper.pivot.add(elbow);

  const hand = new THREE.Group();
  hand.name = `${prefix}Hand`;
  hand.position.y = -C.lowerArm;
  lower.pivot.add(hand);

  const palm = sphere(C.handRadius, materials.body, [0.88, 1.04, 0.78]);
  hand.add(palm);

  const band = shadowify(new THREE.Mesh(new THREE.TorusGeometry(C.lowerArmRadius * 1.03, 0.018, 8, 20), materials.iceAccent));
  band.rotation.x = Math.PI * 0.5;
  band.position.y = 0.06;
  hand.add(band);

  upper.pivot.rotation.z = side * -0.12;
  lower.pivot.rotation.x = -0.08;

  return { root: upper.pivot, upper: upper.pivot, lower: lower.pivot, hand, band };
}

function createLeg(side, materials) {
  const prefix = side < 0 ? 'left' : 'right';
  const upper = capsuleSegment(`${prefix}UpperLeg`, C.upperLeg, C.upperLegRadius, materials.body);
  const lower = capsuleSegment(`${prefix}LowerLeg`, C.lowerLeg, C.lowerLegRadius, materials.bodySoft);

  lower.pivot.position.y = -C.upperLeg;
  upper.pivot.add(lower.pivot);

  const knee = sphere(C.upperLegRadius * 1.02, materials.bodySoft, [1.02, 0.90, 1.0]);
  knee.position.y = -C.upperLeg;
  upper.pivot.add(knee);

  const foot = new THREE.Group();
  foot.name = `${prefix}Foot`;
  foot.position.y = -C.lowerLeg;
  lower.pivot.add(foot);

  const sole = sphere(C.footRadius, materials.body, [0.92, 0.62, 1.68]);
  sole.position.set(side * 0.012, -0.035, 0.115);
  foot.add(sole);

  return { root: upper.pivot, upper: upper.pivot, lower: lower.pivot, foot };
}

function socket(name, position) {
  const object = new THREE.Object3D();
  object.name = name;
  object.position.copy(position);
  return object;
}

export function createStickmanModel() {
  const materials = createStickmanMaterials();
  const root = new THREE.Group();
  root.name = 'stickmanRoot';
  root.position.y = C.pelvisY;

  const torso = createTorso(materials);
  root.add(torso.root);

  const headY = C.torsoLength + C.headGap;
  const head = createHead(materials);
  head.root.position.set(0, headY, 0);
  root.add(head.root);

  const shoulderY = C.torsoLength * C.shoulderYFactor;
  const leftArm = createArm(-1, materials);
  const rightArm = createArm(1, materials);
  leftArm.root.position.set(-C.shoulderX, shoulderY, 0);
  rightArm.root.position.set(C.shoulderX, shoulderY, 0);
  root.add(leftArm.root, rightArm.root);

  const leftLeg = createLeg(-1, materials);
  const rightLeg = createLeg(1, materials);
  leftLeg.root.position.set(-C.hipX, 0.02, 0);
  rightLeg.root.position.set(C.hipX, 0.02, 0);
  root.add(leftLeg.root, rightLeg.root);

  const parts = {
    torso: torso.root,
    head: head.root,
    leftArm: leftArm.root,
    rightArm: rightArm.root,
    leftLeg: leftLeg.root,
    rightLeg: rightLeg.root
  };

  const joints = {
    torso: torso.root,
    head: head.root,
    leftUpperArm: leftArm.upper,
    leftLowerArm: leftArm.lower,
    leftHand: leftArm.hand,
    rightUpperArm: rightArm.upper,
    rightLowerArm: rightArm.lower,
    rightHand: rightArm.hand,
    leftUpperLeg: leftLeg.upper,
    leftLowerLeg: leftLeg.lower,
    leftFoot: leftLeg.foot,
    rightUpperLeg: rightLeg.upper,
    rightLowerLeg: rightLeg.lower,
    rightFoot: rightLeg.foot
  };

  const sockets = {
    head: socket('headSocket', new THREE.Vector3(0, headY, 0)),
    leftHand: socket('leftHandSocket', new THREE.Vector3(-C.shoulderX, shoulderY - C.upperArm - C.lowerArm, 0)),
    rightHand: socket('rightHandSocket', new THREE.Vector3(C.shoulderX, shoulderY - C.upperArm - C.lowerArm, 0)),
    chest: socket('chestSocket', new THREE.Vector3(0, C.torsoLength * 0.73, 0.22))
  };
  Object.values(sockets).forEach(item => root.add(item));

  const elementMeshes = [torso.core, leftArm.band, rightArm.band];
  function setElementMode(mode) {
    const material = mode === 'fire' ? materials.fireAccent : materials.iceAccent;
    for (const mesh of elementMeshes) mesh.material = material;
    const color = mode === 'fire' ? C.accentFire : C.accentIce;
    for (const eye of head.eyeRoots) eye.aura.color?.set?.(color);
    materials.eyeGlow.color.set(color);
  }

  root.userData.stickman = {
    version: 2,
    parts,
    joints,
    sockets,
    materials,
    setElementMode,
    dimensions: C
  };

  return root;
}
