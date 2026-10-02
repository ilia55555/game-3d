// File: stickman/src/model/stickman.model.js
// Role: Builds the cohesive 2D hero and exposes a fully hidden shoulder/elbow/hip/knee/wrist rig.
// Scope: Flat character geometry, invisible transform joints, face, hand sockets, and element accents only.
// Rule: Animation timing, controls, weapons, enemies, aura particles, and 2.5D level construction stay elsewhere.
// Goal: Make the hero read as one continuous drawn character while every articulation pivot remains invisible.

import * as THREE from 'three';
import { createStickmanMaterials } from './stickman.materials.js';
import { STICKMAN_CONFIG as C } from './stickman.config.js';

function hiddenJoint(name) {
  const joint = new THREE.Group();
  joint.name = name;
  joint.userData.hiddenRigJoint = true;
  return joint;
}

function planarMesh(geometry, material, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = z;
  mesh.frustumCulled = false;
  return mesh;
}

function capsuleShape(length, radius) {
  const r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-r, -r * 0.12);
  shape.quadraticCurveTo(-r, r * 0.52, 0, r * 0.58);
  shape.quadraticCurveTo(r, r * 0.52, r, -r * 0.12);
  shape.lineTo(r, -length + r * 0.20);
  shape.quadraticCurveTo(r, -length, 0, -length - r * 0.12);
  shape.quadraticCurveTo(-r, -length, -r, -length + r * 0.20);
  shape.closePath();
  return shape;
}

function capsule2D(name, length, radius, material, z) {
  const pivot = hiddenJoint(name);
  const geometry = new THREE.ShapeGeometry(capsuleShape(length, radius), 12);
  const mesh = planarMesh(geometry, material, z);
  pivot.add(mesh);
  return { pivot, mesh };
}

function ellipse(radiusX, radiusY, material, z) {
  const mesh = planarMesh(new THREE.CircleGeometry(1, 32), material, z);
  mesh.scale.set(radiusX, radiusY, 1);
  return mesh;
}

function createTorso(materials) {
  const root = hiddenJoint('torsoJoint');
  const s = new THREE.Shape();
  const p = C.pelvisHalfWidth;
  const w = C.torsoHalfWidth;
  const c = C.chestHalfWidth;
  const h = C.torsoLength;

  s.moveTo(-p, 0.02);
  s.quadraticCurveTo(-p * 1.04, h * 0.18, -w, h * 0.36);
  s.quadraticCurveTo(-w * 1.08, h * 0.58, -c, h * 0.82);
  s.quadraticCurveTo(-c * 0.92, h, -c * 0.62, h * 1.04);
  s.lineTo(c * 0.62, h * 1.04);
  s.quadraticCurveTo(c * 0.92, h, c, h * 0.82);
  s.quadraticCurveTo(w * 1.08, h * 0.58, w, h * 0.36);
  s.quadraticCurveTo(p * 1.04, h * 0.18, p, 0.02);
  s.quadraticCurveTo(0, -0.08, -p, 0.02);

  const body = planarMesh(new THREE.ShapeGeometry(s, 18), materials.body, 0.00);
  root.add(body);

  const chestAccent = ellipse(0.050, 0.072, materials.iceAccent, 0.022);
  chestAccent.position.set(0.055, h * 0.73, 0.022);
  root.add(chestAccent);

  return { root, body, chestAccent };
}

function createHead(materials) {
  const root = hiddenJoint('headJoint');

  const head = ellipse(C.headRadius, C.headRadius * 1.03, materials.body, 0.065);
  root.add(head);

  const jaw = ellipse(C.headRadius * 0.77, C.headRadius * 0.48, materials.body, 0.066);
  jaw.position.set(0.03, -C.headRadius * 0.34, 0.066);
  root.add(jaw);

  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-0.08, 0.035);
  eyeShape.quadraticCurveTo(0.015, 0.065, 0.105, 0.015);
  eyeShape.quadraticCurveTo(0.050, -0.075, -0.065, -0.042);
  eyeShape.closePath();

  const glow = planarMesh(new THREE.ShapeGeometry(eyeShape), materials.eyeGlow, 0.080);
  glow.scale.setScalar(1.24);
  glow.position.set(0.105, 0.035, 0.080);
  root.add(glow);

  const eye = planarMesh(new THREE.ShapeGeometry(eyeShape), materials.eyes, 0.086);
  eye.position.set(0.105, 0.035, 0.086);
  root.add(eye);

  return { root, head, jaw, eye, glow };
}

function createArm(name, front, materials) {
  const zBase = front ? 0.045 : -0.055;
  const shoulder = hiddenJoint(`${name}ShoulderJoint`);
  const elbow = hiddenJoint(`${name}ElbowJoint`);
  const wrist = hiddenJoint(`${name}WristJoint`);

  const upper = capsule2D(`${name}UpperVisual`, C.upperArm + 0.075, C.upperArmRadius, front ? materials.body : materials.bodySoft, zBase);
  shoulder.add(upper.mesh);

  elbow.position.y = -C.upperArm + 0.035;
  shoulder.add(elbow);

  const lower = capsule2D(`${name}LowerVisual`, C.lowerArm + 0.080, C.lowerArmRadius, front ? materials.body : materials.bodySoft, zBase + 0.002);
  elbow.add(lower.mesh);

  wrist.position.y = -C.lowerArm + 0.040;
  elbow.add(wrist);

  const hand = ellipse(C.handRadius, C.handRadius * 0.92, front ? materials.body : materials.bodySoft, zBase + 0.004);
  hand.position.set(0.025, -0.025, zBase + 0.004);
  wrist.add(hand);

  const gripSocket = new THREE.Object3D();
  gripSocket.name = `${name}GripSocket`;
  gripSocket.position.set(0.055, -0.015, 0.018);
  wrist.add(gripSocket);

  return { root: shoulder, shoulder, elbow, wrist, hand, gripSocket };
}

function createLeg(name, front, materials) {
  const zBase = front ? 0.025 : -0.035;
  const hip = hiddenJoint(`${name}HipJoint`);
  const knee = hiddenJoint(`${name}KneeJoint`);
  const ankle = hiddenJoint(`${name}AnkleJoint`);

  const upper = capsule2D(`${name}UpperVisual`, C.upperLeg + 0.085, C.upperLegRadius, front ? materials.body : materials.bodySoft, zBase);
  hip.add(upper.mesh);

  knee.position.y = -C.upperLeg + 0.042;
  hip.add(knee);

  const lower = capsule2D(`${name}LowerVisual`, C.lowerLeg + 0.080, C.lowerLegRadius, front ? materials.body : materials.bodySoft, zBase + 0.002);
  knee.add(lower.mesh);

  ankle.position.y = -C.lowerLeg + 0.040;
  knee.add(ankle);

  const footShape = new THREE.Shape();
  footShape.moveTo(-0.05, 0.04);
  footShape.quadraticCurveTo(0.10, 0.09, C.footLength, 0.02);
  footShape.quadraticCurveTo(C.footLength + 0.04, -0.05, C.footLength * 0.78, -C.footThickness);
  footShape.lineTo(-0.07, -C.footThickness * 0.82);
  footShape.quadraticCurveTo(-0.11, -0.02, -0.05, 0.04);

  const foot = planarMesh(new THREE.ShapeGeometry(footShape), front ? materials.body : materials.bodySoft, zBase + 0.004);
  foot.position.set(0.015, -0.02, zBase + 0.004);
  ankle.add(foot);

  return { root: hip, hip, knee, ankle, foot };
}

export function createStickmanModel() {
  const materials = createStickmanMaterials();
  const root = new THREE.Group();
  root.name = 'stickman2DRoot';
  root.position.set(0, C.pelvisY, C.laneZ);

  const visualRoot = new THREE.Group();
  visualRoot.name = 'visualRoot';
  root.add(visualRoot);

  const backLeg = createLeg('backLeg', false, materials);
  const frontLeg = createLeg('frontLeg', true, materials);
  backLeg.root.position.set(-0.055, 0.02, -0.03);
  frontLeg.root.position.set(0.070, 0.02, 0.02);
  visualRoot.add(backLeg.root, frontLeg.root);

  const backArm = createArm('backArm', false, materials);
  const frontArm = createArm('frontArm', true, materials);
  const shoulderY = C.torsoLength * C.shoulderYFactor;
  backArm.root.position.set(-0.025, shoulderY, -0.05);
  frontArm.root.position.set(0.055, shoulderY, 0.045);
  visualRoot.add(backArm.root);

  const torso = createTorso(materials);
  visualRoot.add(torso.root);
  visualRoot.add(frontArm.root);

  const head = createHead(materials);
  head.root.position.set(0.025, C.torsoLength + C.headGap, 0.065);
  visualRoot.add(head.root);

  const joints = {
    visualRoot,
    torso: torso.root,
    head: head.root,
    leftUpperArm: backArm.shoulder,
    leftLowerArm: backArm.elbow,
    leftHand: backArm.wrist,
    rightUpperArm: frontArm.shoulder,
    rightLowerArm: frontArm.elbow,
    rightHand: frontArm.wrist,
    leftUpperLeg: backLeg.hip,
    leftLowerLeg: backLeg.knee,
    leftFoot: backLeg.ankle,
    rightUpperLeg: frontLeg.hip,
    rightLowerLeg: frontLeg.knee,
    rightFoot: frontLeg.ankle
  };

  const sockets = {
    rightGrip: frontArm.gripSocket,
    leftGrip: backArm.gripSocket
  };

  function setElementMode(mode) {
    const material = mode === 'fire' ? materials.fireAccent : materials.iceAccent;
    torso.chestAccent.material = material;
    const color = mode === 'fire' ? C.accentFire : C.accentIce;
    materials.eyeGlow.color.setHex(color);
  }

  function setFacing(direction) {
    const sign = direction < 0 ? -1 : 1;
    const magnitude = Math.max(0.001, Math.abs(visualRoot.scale.x));
    visualRoot.scale.x = sign * magnitude;
  }

  root.userData.stickman = {
    version: 4,
    style: '2d-side-view',
    joints,
    sockets,
    materials,
    setElementMode,
    setFacing,
    dimensions: C
  };

  return root;
}
