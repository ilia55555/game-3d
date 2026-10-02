// File: stickman/src/core/scene.js
// Role: Creates the renderer, camera, lighting, and orbit controls.
// Scope: Rendering infrastructure only; it knows nothing about the stickman model internals.
// Rule: Character construction, animation, gameplay, enemies, and level rules stay elsewhere.
// Goal: Let rendering settings change independently from every gameplay-facing system.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070403);
  scene.fog = new THREE.FogExp2(0x080402, 0.034);

  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.05,
    120
  );
  camera.position.set(4.8, 3.1, 7.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.75, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.minDistance = 3.4;
  controls.maxDistance = 13;
  controls.minPolarAngle = Math.PI * 0.16;
  controls.maxPolarAngle = Math.PI * 0.76;
  controls.enablePan = false;

  const hemi = new THREE.HemisphereLight(0xffd1a0, 0x190b06, 1.1);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffad67, 2.1);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -3;
  scene.add(key);

  const rim = new THREE.PointLight(0xff5a00, 18, 12, 2);
  rim.position.set(-3.4, 3.7, -2.4);
  scene.add(rim);

  const front = new THREE.PointLight(0xffb14d, 8, 9, 2);
  front.position.set(0, 2.3, 5.2);
  scene.add(front);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);

  return {
    scene,
    camera,
    renderer,
    controls,
    dispose() {
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
    }
  };
}
