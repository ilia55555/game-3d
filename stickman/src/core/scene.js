// File: stickman/src/core/scene.js
// Role: Creates the renderer, camera, sky colors, fog, and neutral outdoor lighting.
// Scope: Rendering infrastructure only; player follow-camera motion is handled by the controller.
// Rule: Character construction, animation, combat, enemy AI, and level geometry stay elsewhere.
// Goal: Remove the old red/orange mood and provide a bright readable 3D game environment.

import * as THREE from 'three';

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
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x91c9e6);
  scene.fog = new THREE.Fog(0x91c9e6, 28, 78);

  const camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / window.innerHeight,
    0.05,
    160
  );
  camera.position.set(5.4, 4.3, 8.5);

  const hemi = new THREE.HemisphereLight(0xd9f4ff, 0x355042, 2.0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1cf, 3.0);
  sun.position.set(-12, 18, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.00035;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaadfff, 0.8);
  fill.position.set(12, 8, -14);
  scene.add(fill);

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
    sun,
    dispose() {
      window.removeEventListener('resize', resize);
      renderer.dispose();
    }
  };
}
