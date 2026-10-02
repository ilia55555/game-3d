// File: stickman/src/model/stickman.model.js
// Role: Builds the cohesive procedural 3D hero and exposes a fully hidden articulation rig.
// Scope: Character geometry, invisible joint hierarchy, face, hand sockets, and element eye color only.
// Rule: Animation timing, input, weapon models, combat, enemies, aura particles, and levels stay elsewhere.
// Goal: Make the hero read as one continuous body while shoulders, elbows, hips, knees, and wrists stay invisible.

import * as THREE from 'three';
import { createStickmanMaterials } from './stickman.materials.js';
import { STICKMAN_CONFIG as C } from './stickman.config.js';

function shadowify(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  return mesh;
}

function sphere(radius, material, scale = [1, 1, 1]) {
  const object = shadowify(new THREE.Mesh(new THREE.SphereGeometry(radius, 26, 18), material));
  object.scale.set(...scale);
  return object;
}

function hiddenJoint(name) {
  const joint = new THREE.Group();
  joint.name = name;
  joint.userData.hiddenRigJoint = true;
  return joint;
}

function capsuleMesh(length, radius, material, overlap = 0) {
  const effective = Math.max(radius * 2 + 0.02, length + overlap);
  const geometry = new THREE.CapsuleGeometry(radius, Math.max(0.02, effective - radius * 2), 10, 18);
  return shadowify(new THREE.Mesh(geometry, material));
}

function createEyeShape(side) {
  const s = side;
  const shape = new THREE.Shape();
  shape.moveTo(-0.105 * s, 0.05);
  shape.quadraticCurveTo(0.01 * s, 0.06, 0.11 * s, 0.005);
  shape.quadraticCurveTo(0.045 * s, -0.095, -0.075 * s, -0.045);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 8);
}

function createHead(materials) {
  const head = hiddenJoint('headJoint');

  const skull = sphere(C.headRadius, materials.body, [1.0, 1.045, 0.95]);
  head.add(skull);

  const jaw = sphere(C.headRadius * 0.79, materials.body, [1.0, 0.60, 0.91]);
  jaw.position.y = -C.headRadius * 0.33;
  head.add(jaw);

  const eyeRoots = [];
  for (const side of [-1, 1]) {
    const eyeRoot = new THREE.Group();
    eyeRoot.position.set(side * 0.115, 0.045, C.headRadius * 0.905);

    const aura = new THREE.Mesh(createEyeShape(side), materials.eyeGlow);
    aura.scale.setScalar(1.24);
    aura.position.z = -0.004;
    eyeRoot.add(aura);

    const eye = new THREE.Mesh(createEyeShape(side), materials.eyes);
    eyeRoot.add(eye);
    head.add(eyeRoot);
    eyeRoots.push({ root: eyeRoot, aura, eye });
  }

  return { root: head, skull, jaw, eyeRoots };
}

function createTorso(materials) {
  const torso = hiddenJoint('torsoJoint');

  const center = capsuleMesh(C.torsoLength, C.torsoRadius, materials.body, 0.06);
  center.position.y = C.torsoLength * 0.5;
  center.scale.set(1.02, 1.0, 0.93);
  torso.add(center);

  const chest = sphere(C.chestRadius, materials.body, [1.31, 0.73, 0.85]);
  chest.position.y = C.torsoLength * 0.78;
  torso.add(chest);

  const pelvis = sphere(C.pelvisRadius, materials.body, [1.28, 0.70, 0.92]);
  pelvis.position.y = 0.025;
  torso.add(pelvis);

  const neck = capsuleMesh(0.34, 0.105, materials.body, 0.10);
  neck.position.y = C.torsoLength + 0.12;
  torso.add(neck);

  return { root: torso, center, chest, pelvis, neck };
}

function createArm(side, materials) {
  const prefix = side < 0 ? 'left' : 'right';
  const shoulder = hiddenJoint(`${prefix}ShoulderJoint`);
  const elbow = hiddenJoint(`${prefix}ElbowJoint`);
  const wrist = hiddenJoint(`${prefix}WristJoint`);

  // The meshes overlap slightly around elbow/wrist so the rig bends without a visible joint sphere or gap.
  const upperMesh = capsuleMesh(C.upperArm + 0.08, C.upperArmRadius, materials.body, 0.08);
  upperMesh.position.y = -(C.upperArm * 0.5 - 0.025);
  shoulder.add(upperMesh);

  elbow.position.y = -C.upperArm + 0.07;
  shoulder.add(elbow);

  const lowerMesh = capsuleMesh(C.lowerArm + 0.10, C.lowerArmRadius, materials.body, 0.10);
  lowerMesh.position.y = -(C.lowerArm * 0.5 - 0.025);
  elbow.add(lowerMesh);

  wrist.position.y = -C.lowerArm + 0.075;
  elbow.add(wrist);

  const palm = sphere(C.handRadius, materials.body, [0.92, 1.06, 0.82]);
  palm.position.y = -0.02;
  wrist.add(palm);

  const gripSocket = new THREE.Object3D();
  gripSocket.name = `${prefix}GripSocket`;
  gripSocket.position.set(0, -0.01, -0.06);
  wrist.add(gripSocket);

  shoulder.rotation.z = side * -0.18;
  elbow.rotation.x = -0.10;

  return {
    root: shoulder,
    shoulder,
    elbow,
    wrist,
    hand: wrist,
    gripSocket,
    upperMesh,
    lowerMesh
  };
}

function createLeg(side, materials) {
  const prefix = side < 0 ? 'left' : 'right';
  const hip = hiddenJoint(`${prefix}HipJoint`);
  const knee = hiddenJoint(`${prefix}KneeJoint`);
  const ankle = hiddenJoint(`${prefix}AnkleJoint`);

  const upperMesh = capsuleMesh(C.upperLeg + 0.10, C.upperLegRadius, materials.body, 0.10);
  upperMesh.position.y = -(C.upperLeg * 0.5 - 0.025);
  hip.add(upperMesh);

  knee.position.y = -C.upperLeg + 0.075;
  hip.add(knee);

  const lowerMesh = capsuleMesh(C.lowerLeg + 0.10, C.lowerLegRadius, materials.body, 0.10);
  lowerMesh.position.y = -(C.lowerLeg * 0.5 - 0.02);
  knee.add(lowerMesh);

  ankle.position.y = -C.lowerLeg + 0.075;
  knee.add(ankle);

  const sole = sphere(C.footRadius, materials.body, [0.94, 0.62, 1.72]);
  sole.position.set(side * 0.012, -0.04, 0.115);
  ankle.add(sole);

  return { root: hip, hip, knee, ankle, foot: ankle, upperMesh, lowerMesh };
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

  // Arms intentionally float just outside the torso silhouette; only the invisible shoulder pivots connect them.
  leftArm.root.position.set(-C.shoulderX - 0.045, shoulderY, 0);
  rightArm.root.position.set(C.shoulderX + 0.045, shoulderY, 0);
  root.add(leftArm.root, rightArm.root);

  const leftLeg = createLeg(-1, materials);
  const rightLeg = createLeg(1, materials);
  leftLeg.root.position.set(-C.hipX, 0.03, 0);
  rightLeg.root.position.set(C.hipX, 0.03, 0);
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
    leftUpperArm: leftArm.shoulder,
    leftLowerArm: leftArm.elbow,
    leftHand: leftArm.wrist,
    rightUpperArm: rightArm.shoulder,
    rightLowerArm: rightArm.elbow,
    rightHand: rightArm.wrist,
    leftUpperLeg: leftLeg.hip,
    leftLowerLeg: leftLeg.knee,
    leftFoot: leftLeg.ankle,
    rightUpperLeg: rightLeg.hip,
    rightLowerLeg: rightLeg.knee,
    rightFoot: rightLeg.ankle
  };

  const sockets = {
    rightGrip: rightArm.gripSocket,
    leftGrip: leftArm.gripSocket,
    head: head.root,
    chest: torso.root
  };

  function setElementMode(mode) {
    const color = mode === 'fire' ? C.accentFire : C.accentIce;
    materials.eyeGlow.color.setHex(color);
    for (const eye of head.eyeRoots) eye.aura.material.color.setHex(color);
  }

  root.userData.stickman = {
    version: 3,
    parts,
    joints,
    sockets,
    materials,
    setElementMode,
    dimensions: C,
    hiddenJointNames: [
      'headJoint',
      'leftShoulderJoint', 'leftElbowJoint', 'leftWristJoint',
      'rightShoulderJoint', 'rightElbowJoint', 'rightWristJoint',
      'leftHipJoint', 'leftKneeJoint', 'leftAnkleJoint',
      'rightHipJoint', 'rightKneeJoint', 'rightAnkleJoint'
    ]
  };

  return root;
}
