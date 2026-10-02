import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createStickmanModel } from '../model/stickman.model.js';
import { WeaponSystem } from '../weapons/weapon.system.js';
import { samplePose, applyPose } from '../animation/stickman.animations.js';

export async function exportUnityCharacter(hero) {
  // Independent snapshot: exporting never changes the live animation or weapon.
  const root = createStickmanModel();
  new WeaponSystem(root);
  const original = root.userData.stickman;
  root.position.set(0, original.dimensions.pelvisY, 0);
  const joints = {};
  for (const [key, node] of Object.entries(original.joints)) joints[key] = root.getObjectByName(node.name);
  const rig = {joints};
  root.traverse(node => { node.userData = {}; });
  root.getObjectByName('visualRoot').scale.set(1,1,1);
  const specs = [
    ['Idle',2,'idle',0,'sword'], ['Walk',1.161/4.45,'walk',4.45,'sword'],
    ['Run',1.613/7.2,'run',7.2,'sword'], ['Jump',0.5,'jump',0,'sword'],
    ['Fall',0.5,'fall',0,'sword'], ['Land',0.2,'idle',0,'sword'],
    ['SwordAttack',0.5,'idle',0,'sword'], ['GunAim',1,'idle',0,'gun'],
    ['GunFire',0.12,'idle',0,'gun']
  ];
  const animations = [];
  for (const [name,duration,mode,speed,weapon] of specs) {
    const nodes = Object.values(joints);
    const times=[], rotations=nodes.map(()=>[]), positions=[];
    const frames=Math.max(2,Math.ceil(duration*60));
    for(let i=0;i<=frames;i++) {
      const t=i/frames*duration, progress=i/frames;
      applyPose(rig,samplePose({mode,speed,weapon,time:t,phase:progress*Math.PI*2,action:name==='SwordAttack'||name==='GunFire'?progress:-1,landing:name==='Land'?1-progress:0}),1,true);
      times.push(t);
      nodes.forEach((node,n)=>rotations[n].push(...node.quaternion.toArray()));
      positions.push(...joints.visualRoot.position.toArray());
    }
    const tracks=nodes.map((node,n)=>new THREE.QuaternionKeyframeTrack(node.name+'.quaternion',times,rotations[n]));
    tracks.push(new THREE.VectorKeyframeTrack('visualRoot.position',times,positions));
    animations.push(new THREE.AnimationClip(name,duration,tracks));
  }
  applyPose(rig,samplePose({}),1,true);
  // Include both weapons; toggle these named nodes on import in Unity.
  root.getObjectByName('sword2D').visible=true;
  root.getObjectByName('gun2D').visible=true;
  const data=await new GLTFExporter().parseAsync(root,{binary:true,animations,onlyVisible:false});
  const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));
  const link=document.createElement('a');link.href=url;link.download='StickmanHero.glb';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
