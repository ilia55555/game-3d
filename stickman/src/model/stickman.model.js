// File: stickman/src/model/stickman.model.js
// Role: Builds the complete procedural 3D stickman and exposes its rig parts.
// Scope: Geometry, hierarchy, detachable body groups, sockets, face, hands, and feet only.
// Rule: Animation timing, gameplay, enemy AI, hit logic, and level construction live elsewhere.
// Goal: Make every body part independently editable and detachable for later combat systems.

import * as THREE from 'three';
import { createStickmanMaterials } from './stickman.materials.js';

const BODY = Object.freeze({
  pelvisY: 1.68,
  torsoLength: 1.05,
  headRadius: 0.36,
  upperArm: 0.68,
  lowerArm: 0.64,
  upperLeg: 0.78,
  lowerLeg: 0.76
});

function addGlowPair(parent, geometry, materials, {
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  glowScale = [1.18, 1.03, 1.18],
  coreMaterial = materials.core,
  glowMaterial = materials.glow,
  castShadow = true
} = {}) {
  const core = new THREE.Mesh(geometry, coreMaterial);
  core.position.set(...position);
  core.rotation.set(...rotation);
  core.castShadow = castShadow;
  core.receiveShadow = false;
  parent.add(core);

  const halo = new THREE.Mesh(geometry, glowMaterial);
  halo.position.copy(core.position);
  halo.rotation.copy(core.rotation);
  halo.scale.set(...glowScale);
  halo.renderOrder = 2;
  parent.add(halo);

  return { core, halo };
}

function addJoint(parent, radius, y, materials, intensity = 1) {
  const geometry = new THREE.SphereGeometry(radius, 18, 12);
  const pair = addGlowPair(parent, geometry, materials, {
    position: [0, y, 0],
    glowScale: [1.16 + intensity * 0.03, 1.16 + intensity * 0.03, 1.16 + intensity * 0.03]
  });
  return pair;
}

function createSegment(name, length, radius, materials) {
  const pivot = new THREE.Group();
  pivot.name = name;

  const cylinder = new THREE.CylinderGeometry(radius * 0.92, radius, length, 16, 1, false);
  addGlowPair(pivot, cylinder, materials, {
    position: [0, -length * 0.5, 0],
    glowScale: [1.18, 1.02, 1.18]
  });

  addJoint(pivot, radius * 1.04, -length, materials, 0.8);
  return pivot;
}

function createHand(name, materials) {
  const hand = new THREE.Group();
  hand.name = name;
  const geometry = new THREE.SphereGeometry(0.105, 18, 12);
  addGlowPair(hand, geometry, materials, {
    glowScale: [1.22, 1.22, 1.22]
  });
  return hand;
}

function createFoot(name, side, materials) {
  const foot = new THREE.Group();
  foot.name = name;

  const geometry = new THREE.SphereGeometry(0.13, 18, 12);
  const pair = addGlowPair(foot, geometry, materials, {
    position: [side * 0.015, -0.045, 0.10],
    glowScale: [1.18, 1.15, 1.45]
  });
  pair.core.scale.set(1.0, 0.68, 1.55);
  pair.halo.scale.multiply(new THREE.Vector3(1.0, 0.68, 1.55));
  return foot;
}

function createEyeGeometry(side) {
  const s = side;
  const shape = new THREE.Shape();
  shape.moveTo(-0.085 * s, 0.045);
  shape.lineTo(0.088 * s, 0.012);
  shape.lineTo(0.048 * s, -0.072);
  shape.lineTo(-0.055 * s, -0.018);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function createHead(materials) {
  const head = new THREE.Group();
  head.name = 'head';

  const sphere = new THREE.SphereGeometry(BODY.headRadius, 28, 20);
  addGlowPair(head, sphere, materials, {
    glowScale: [1.12, 1.12, 1.12]
  });

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(BODY.headRadius * 1.03, 0.038, 10, 48),
    materials.glowStrong
  );
  haloRing.position.z = 0.012;
  haloRing.renderOrder = 3;
  head.add(haloRing);

  for (const side of [-1, 1]) {
    const eyeRoot = new THREE.Group();
    eyeRoot.position.set(side * 0.105, 0.035, BODY.headRadius * 0.985);

    const glowEye = new THREE.Mesh(createEyeGeometry(side), materials.eyeGlow);
    glowEye.scale.setScalar(1.24);
    glowEye.position.z = -0.002;
    eyeRoot.add(glowEye);

    const eye = new THREE.Mesh(createEyeGeometry(side), materials.eyes);
    eyeRoot.add(eye);
    head.add(eyeRoot);
  }

  return head;
}

function createTorso(materials) {
  const torso = new THREE.Group();
  torso.name = 'torso';

  const geometry = new THREE.CylinderGeometry(0.20, 0.16, BODY.torsoLength, 18, 1, false);
  addGlowPair(torso, geometry, materials, {
    position: [0, BODY.torsoLength * 0.5, 0],
    glowScale: [1.19, 1.02, 1.19]
  });

  addJoint(torso, 0.17, 0, materials, 0.4);
  addJoint(torso, 0.215, BODY.torsoLength * 0.80, materials, 0.6);
  addJoint(torso, 0.155, BODY.torsoLength, materials, 0.5);
  return torso;
}

function createArm(side, materials) {
  const sideName = side < 0 ? 'left' : 'right';
  const upper = createSegment(`${sideName}UpperArm`, BODY.upperArm, 0.095, materials);
  const lower = createSegment(`${sideName}LowerArm`, BODY.lowerArm, 0.086, materials);
  const hand = createHand(`${sideName}Hand`, materials);

  lower.position.y = -BODY.upperArm;
  hand.position.y = -BODY.lowerArm;
  upper.add(lower);
  lower.add(hand);

  upper.rotation.z = side * -0.11;
  lower.rotation.x = -0.10;

  return { root: upper, upper, lower, hand };
}

function createLeg(side, materials) {
  const sideName = side < 0 ? 'left' : 'right';
  const upper = createSegment(`${sideName}UpperLeg`, BODY.upperLeg, 0.112, materials);
  const lower = createSegment(`${sideName}LowerLeg`, BODY.lowerLeg, 0.098, materials);
  const foot = createFoot(`${sideName}Foot`, side, materials);

  lower.position.y = -BODY.upperLeg;
  foot.position.y = -BODY.lowerLeg;
  upper.add(lower);
  lower.add(foot);

  return { root: upper, upper, lower, foot };
}

function makeSocket(name, position) {
  const socket = new THREE.Object3D();
  socket.name = name;
  socket.position.copy(position);
  return socket;
}

export function createStickmanModel() {
  const materials = createStickmanMaterials();
  const root = new THREE.Group();
  root.name = 'stickmanRoot';
  root.position.y = BODY.pelvisY;

  const torso = createTorso(materials);
  root.add(torso);

  const head = createHead(materials);
  head.position.set(0, BODY.torsoLength + 0.37, 0);
  root.add(head);

  const leftArm = createArm(-1, materials);
  const rightArm = createArm(1, materials);
  leftArm.root.position.set(-0.36, BODY.torsoLength * 0.84, 0);
  rightArm.root.position.set(0.36, BODY.torsoLength * 0.84, 0);
  root.add(leftArm.root, rightArm.root);

  const leftLeg = createLeg(-1, materials);
  const rightLeg = createLeg(1, materials);
  leftLeg.root.position.set(-0.15, 0, 0);
  rightLeg.root.position.set(0.15, 0, 0);
  root.add(leftLeg.root, rightLeg.root);

  const parts = {
    torso,
    head,
    leftArm: leftArm.root,
    rightArm: rightArm.root,
    leftLeg: leftLeg.root,
    rightLeg: rightLeg.root
  };

  const joints = {
    torso,
    head,
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
    head: makeSocket('headSocket', new THREE.Vector3(0, BODY.torsoLength + 0.37, 0)),
    leftArm: makeSocket('leftShoulderSocket', new THREE.Vector3(-0.36, BODY.torsoLength * 0.84, 0)),
    rightArm: makeSocket('rightShoulderSocket', new THREE.Vector3(0.36, BODY.torsoLength * 0.84, 0)),
    leftLeg: makeSocket('leftHipSocket', new THREE.Vector3(-0.15, 0, 0)),
    rightLeg: makeSocket('rightHipSocket', new THREE.Vector3(0.15, 0, 0))
  };
  Object.values(sockets).forEach(socket => root.add(socket));

  const visibility = new Map(Object.keys(parts).map(name => [name, true]));

  function setPartVisible(name, visible) {
    const part = parts[name];
    if (!part) return false;
    part.visible = Boolean(visible);
    visibility.set(name, Boolean(visible));
    return true;
  }

  function togglePart(name) {
    const next = !(visibility.get(name) ?? true);
    setPartVisible(name, next);
    return next;
  }

  function resetVisibility() {
    for (const name of Object.keys(parts)) setPartVisible(name, true);
  }

  root.userData.stickman = {
    version: 1,
    parts,
    joints,
    sockets,
    materials,
    visibility,
    setPartVisible,
    togglePart,
    resetVisibility,
    dimensions: BODY
  };

  return root;
}
