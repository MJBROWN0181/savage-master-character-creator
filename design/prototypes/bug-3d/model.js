import * as THREE from './vendor/build/three.module.js';
import { createBug } from './character.js';

const canvas = document.querySelector('#scene'), status = document.querySelector('#status');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }
catch { status.textContent = 'This preview needs WebGL. The original Bug is shown beside it.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38,1,.1,50);
camera.position.set(0,.8,8.8); camera.lookAt(0,.35,0);
scene.add(new THREE.HemisphereLight(0xd5efef,0x29362d,1.1));
const key = new THREE.DirectionalLight(0xffd7a1,2.8); key.position.set(-3,4,5); scene.add(key);
key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.018;key.shadow.bias=-.0002;
const rim = new THREE.DirectionalLight(0x5cadbd,2.5); rim.position.set(3,2,-3); scene.add(rim);
const studio=new THREE.Scene();studio.background=new THREE.Color(0x243239);
for(const [x,y,z,sx,sy,intensity] of [[-3,3,4,3,4,3],[3,1,1,1,3,1.8],[0,4,-2,3,2,2]]){
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity*.91,intensity*.79),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
}
const environmentGenerator=new THREE.PMREMGenerator(renderer),environment=environmentGenerator.fromScene(studio,.06);
scene.environment=environment.texture;scene.environmentIntensity=.65;environmentGenerator.dispose();
studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
const root = new THREE.Group(); const {body,head,eyePivots,wings,arms,legs,cape,materialReady} = createBug(); scene.add(root); root.add(body);
body.traverse(o=>{if(o.isMesh&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true;}});
let pose='hover',paused=matchMedia('(prefers-reduced-motion: reduce)').matches,yaw=-.31,targetYaw=yaw,drag=null,time=0,last=performance.now();
const turn=document.querySelector('#turn'),pause=document.querySelector('#pause');
const syncPause=()=>{pause.textContent=paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(paused));};syncPause();
document.querySelectorAll('[data-pose]').forEach(button=>button.addEventListener('click',()=>{pose=button.dataset.pose;document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
pause.addEventListener('click',()=>{paused=!paused;syncPause();});
turn.addEventListener('input',()=>{targetYaw=Number(turn.value)*Math.PI/180;});
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw:targetYaw};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(drag){targetYaw=drag.yaw+(e.clientX-drag.x)*.009;turn.value=String(((targetYaw*180/Math.PI+540)%360)-180);}});
canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
const resize=new ResizeObserver(()=>{const {width,height}=canvas.parentElement.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=width/height<1?11:8.8;camera.updateProjectionMatrix();});resize.observe(canvas.parentElement);
status.textContent='Real 3D geometry · drag to rotate';
renderer.setAnimationLoop(now=>{
  const dt=Math.min((now-last)/1000,.05);last=now;if(!paused&&!document.hidden)time+=dt;
  yaw+=(targetYaw-yaw)*(1-Math.exp(-dt*12));root.rotation.y=yaw;
  const t=time,fly=pose==='fly',wave=pose==='wave';
  root.position.y=Math.sin(t*1.7)*.065;
  root.position.x=fly?Math.sin(t*.8)*.55:0;
  body.rotation.z=fly?Math.sin(t*.8)*-.13:Math.sin(t*.9)*.014;
  head.rotation.x=Math.sin(t*.8)*.025;
  head.rotation.y=wave?Math.sin(t*1.8)*.07:Math.sin(t*.63)*.035;
  for(const {pivot,side,lower} of wings){pivot.rotation.y=side*(.12+Math.sin(t*(fly?25:8)+(lower?.5:0))*(fly?.65:.2));}
  for(const {arm,side,lower} of arms){const greeting=wave&&side===1&&!lower;arm.rotation.z=greeting?1.9+Math.sin(t*5)*.14:side*(lower?.06:.1)+Math.sin(t*1.7+side)*.025;arm.rotation.x=greeting?-.45:fly?.14:Math.sin(t*1.2+side)*.028;}
  cape.rotation.x=fly?.08+Math.sin(t*2)*.025:Math.sin(t)*.012; for(const {leg,side} of legs){leg.rotation.x=fly?-.22+Math.sin(t*2+side)*.055:Math.sin(t*1.7+side)*.035;leg.rotation.z=side*.07+Math.sin(t*1.4+side)*.025;}
  const blink=t%5.3;const lid=blink<.13?Math.max(.08,Math.abs(blink-.065)/.065):1;eyePivots.forEach(eye=>eye.scale.y=lid);
  renderer.render(scene,camera);
});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);resize.disconnect();environment.dispose();renderer.dispose();});


materialReady.then(()=>{status.textContent=body.userData.materialsLoaded?'Detailed materials loaded · drag to rotate':'Material fallback active · drag to rotate';});
