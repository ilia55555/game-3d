// File: stickman/src/core/scene.js
// Role: Creates the renderer, fixed side-view camera, fog, sky, and neutral outdoor lighting.
// Scope: Rendering infrastructure only; horizontal follow motion is handled by the player controller.
// Rule: Character sprites, animation, weapons, gameplay, enemies, and level geometry stay elsewhere.
// Goal: Present a clean 2.5D side-scrolling game while preserving a fully three-dimensional environment.

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
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa7d4ea);
  scene.fog = new THREE.Fog(0xa7d4ea, 22, 70);

  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / Math.max(1, window.innerHeight),
    0.05,
    180
  );
  camera.position.set(0, 3.2, 12.5);
  camera.lookAt(0, 2.0, 0);

  const hemi = new THREE.HemisphereLight(0xeaf8ff, 0x415941, 2.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0cf, 3.1);
  sun.position.set(-10, 18, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -32;
  sun.shadow.camera.right = 32;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 75;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x9fdcff, 0.9);
  fill.position.set(8, 7, 7);
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
