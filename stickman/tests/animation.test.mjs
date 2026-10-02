import assert from 'node:assert/strict';
import {samplePose,applyPose} from '../src/animation/stickman.animations.js';
import {createStickmanModel} from '../src/model/stickman.model.js';
import * as THREE from 'three';
const model=createStickmanModel(), rig=model.userData.stickman;
for(const mode of ['idle','walk','run','jump','fall'])for(let i=0;i<=600;i++) {
 const phase=i/600*Math.PI*2;
 const p=samplePose({mode,phase,time:i/60,speed:mode==='run'?7.2:4.45});
 assert(Object.values(p).every(Number.isFinite));
 applyPose(rig,p,1,true);model.updateMatrixWorld(true);
 for(const [side,offset] of [['right',0],['left',Math.PI]]) {
  const cycle=((phase+offset)%(Math.PI*2))/(Math.PI*2);
  if(mode==='idle'||((mode==='walk'||mode==='run')&&cycle<0.62)) {
   const ankle=rig.joints[side+'Foot'].getWorldPosition(new THREE.Vector3());
   assert(Math.abs(ankle.y-0.125)<0.005,`${mode} ${side}: ankle ${ankle.y}`);
  }
 }
}
for(const aim of [-0.7,0,0.7]) {
 const p=samplePose({weapon:'gun',aim});assert(Math.abs(p.rShoulder+p.rElbow+p.rWrist-aim)<1e-9);
}
console.log('PASS: 3005 finite poses, grounded stance feet, exact gun wrist alignment');
