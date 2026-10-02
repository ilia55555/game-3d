import * as THREE from 'three';
import { STICKMAN_CONFIG as C } from '../model/stickman.config.js';

const {clamp, lerp, damp} = THREE.MathUtils;
const tau = Math.PI * 2;
export function solveLimb(x, y, upper, lower, bend = -1) {
  const distance = clamp(Math.hypot(x, y), 0.001, upper + lower - 0.001);
  const knee = bend * Math.acos(clamp((distance * distance - upper * upper - lower * lower) / (2 * upper * lower), -1, 1));
  const hip = Math.atan2(x, -y) - Math.atan2(lower * Math.sin(knee), upper + lower * Math.cos(knee));
  return [hip, knee, -hip - knee];
}

// Pure pose sampling also supplies deterministic, portable animation clips.
export function samplePose({mode = 'idle', phase = 0, time = 0, speed = 0, weapon = 'sword', aim = 0, action = -1, landing = 0}) {
  const run = mode === 'run', moving = mode === 'walk' || run;
  const pose = {lHip:0,rHip:0,lKnee:0,rKnee:0,lAnkle:0,rAnkle:0,lShoulder:-0.28,rShoulder:0.32,lElbow:-0.10,rElbow:-0.12,lWrist:0,rWrist:0,torso:0,head:0,bob:0};
  const compression = Math.sin(clamp(landing, 0, 1) * Math.PI) * 0.12;
  pose.bob = -compression + Math.sin(time * 2.2) * 0.006;
  if (moving) pose.bob += -(run ? 0.15 : 0.085) + (run ? 0.025 : 0.01) * Math.cos(phase * 2);
  const footY = -C.pelvisY + C.footThickness + 0.02;
  for (const [side, offset, hipX] of [['r',0,0.07],['l',Math.PI,-0.055]]) {
    const cycle = ((phase + offset) % tau + tau) % tau / tau;
    let x = side === 'r' ? 0.12 : -0.12, y = footY - pose.bob - 0.02;
    if (moving) {
      const stride = (run ? 0.50 : 0.36) * clamp(speed / (run ? 7.2 : 4.45),0.15,1);
      const stance = 0.62;
      if (cycle < stance) x = lerp(stride, -stride, cycle / stance);
      else { const u = (cycle - stance) / (1 - stance); x = lerp(-stride,stride,u*u*(3-2*u)); y += Math.sin(u*Math.PI)*(run ? 0.29 : 0.17); }
    } else if (mode === 'jump' || mode === 'fall') {
      x = side === 'r' ? 0.36 : -0.30;
      y += mode === 'jump' ? (side === 'r' ? 0.33 : 0.16) : 0.09;
    }
    const angles = solveLimb(x - hipX, y, C.upperLeg - 0.042, C.lowerLeg - 0.040);
    pose[side+'Hip']=angles[0]; pose[side+'Knee']=angles[1]; pose[side+'Ankle']=angles[2];
  }
  if (moving) {
    pose.lShoulder += Math.sin(phase)*(run ? 0.55 : 0.35);
    pose.rShoulder -= Math.sin(phase)*0.18;
    pose.lElbow -= run ? 0.55 : 0.08;
    pose.torso = run ? -0.10 : -0.035;
  }
  if (mode === 'jump') {pose.lShoulder=-0.5; pose.lElbow=-0.65;}
  if (mode === 'fall') {pose.lShoulder=0.45; pose.lElbow=-0.6;}
  if (weapon === 'gun') {
    const recoil = action >= 0 ? Math.sin(action * Math.PI)*0.045 : 0;
    const x = 0.57*Math.cos(aim)-recoil, y = 0.57*Math.sin(aim)-0.10;
    const a=solveLimb(x,y,C.upperArm-0.035,C.lowerArm-0.040,1);
    pose.rShoulder=a[0]; pose.rElbow=a[1]; pose.rWrist=aim-a[0]-a[1];
    const b=solveLimb(x+0.36-0.07*Math.cos(aim)+0.06*Math.sin(aim),y-0.07*Math.sin(aim)-0.06*Math.cos(aim),C.upperArm-0.035,C.lowerArm-0.040,1);
    pose.lShoulder=b[0]; pose.lElbow=b[1]; pose.lWrist=aim-b[0]-b[1];
  } else {
    // Blade rests diagonally down; windup, strike and recovery form one continuous arc.
    pose.rWrist=-0.35-pose.rShoulder-pose.rElbow;
    if(action >= 0) {
      const ease=u=>u*u*(3-2*u);
      const arc=action<0.25 ? lerp(0.35,2.5,ease(action/0.25)) : action<0.60 ? lerp(2.5,-0.65,ease((action-0.25)/0.35)) : lerp(-0.65,0.35,ease((action-0.60)/0.40));
      pose.rShoulder=arc; pose.rElbow=-0.45; pose.rWrist=0.25;
      pose.torso += Math.sin(action*tau)*-0.10;
    }
  }
  pose.head=-pose.torso*0.6+aim*0.1;
  return pose;
}
const bindings={rHip:'rightUpperLeg',lHip:'leftUpperLeg',rKnee:'rightLowerLeg',lKnee:'leftLowerLeg',rAnkle:'rightFoot',lAnkle:'leftFoot',rShoulder:'rightUpperArm',lShoulder:'leftUpperArm',rElbow:'rightLowerArm',lElbow:'leftLowerArm',rWrist:'rightHand',lWrist:'leftHand',torso:'torso',head:'head'};
export function applyPose(rig,pose,dt=1,instant=false) {
  for(const [key,joint] of Object.entries(bindings)) {
    const node=rig.joints[joint]; node.rotation.z=instant ? pose[key] : damp(node.rotation.z,pose[key],24,dt);
  }
  // Grounded legs are solved rather than damped: contact stays on the ground.
  for(const key of ['rHip','lHip','rKnee','lKnee','rAnkle','lAnkle']) rig.joints[bindings[key]].rotation.z=pose[key];
  rig.joints.visualRoot.position.y=pose.bob;
}
export class StickmanAnimator {
  constructor(stickman){this.stickman=stickman;this.rig=stickman.userData.stickman;this.mode='idle';this.weapon='sword';this.time=0;this.phase=0;this.speed=0;this.aimAngle=0;this.actionTimer=0;this.actionDuration=0.5;this.landingTimer=0;}
  setMotion({speed=0,grounded=true,sprinting=false,verticalVelocity=0}){this.speed=speed;this.mode=!grounded?(verticalVelocity>0.35?'jump':'fall'):speed>0.18?(sprinting?'run':'walk'):'idle';}
  setWeapon(weapon){this.weapon=weapon;this.actionTimer=0;}
  setAim(angle){this.aimAngle=clamp(angle,-0.8,0.8);}
  triggerPrimary(weapon=this.weapon){this.weapon=weapon;this.actionDuration=weapon==='gun'?0.12:0.5;this.actionTimer=this.actionDuration;}
  notifyLand(){this.landingTimer=0.20;}
  update(delta){const dt=Math.min(delta,0.05);this.time+=dt;this.phase+=this.speed*dt/(this.mode==='run'?1.613:1.161)*tau;this.actionTimer=Math.max(0,this.actionTimer-dt);this.landingTimer=Math.max(0,this.landingTimer-dt);applyPose(this.rig,samplePose({mode:this.mode,phase:this.phase,time:this.time,speed:this.speed,weapon:this.weapon,aim:this.aimAngle,action:this.actionTimer>0?1-this.actionTimer/this.actionDuration:-1,landing:this.landingTimer/0.20}),dt);}
}
