import * as THREE from './vendor/build/three.module.js';

const canvas = document.querySelector('#scene'), status = document.querySelector('#status');
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }
catch { status.textContent = 'This preview needs WebGL. The original Bug is shown beside it.'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38,1,.1,50);
camera.position.set(0,.8,8.8); camera.lookAt(0,.35,0);
scene.add(new THREE.HemisphereLight(0xd5efef,0x48351f,2.1));
const key = new THREE.DirectionalLight(0xffd7a1,3.3); key.position.set(-3,4,5); scene.add(key);
const rim = new THREE.DirectionalLight(0x5cadbd,3); rim.position.set(3,2,-3); scene.add(rim);
const root = new THREE.Group(), body = new THREE.Group(); scene.add(root); root.add(body);
const mat = (color,roughness=.65,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const cloth=mat(0x153b3d,.95), dark=mat(0x10262a,.9), skin=mat(0x68866a,.7), gold=mat(0xc19952,.4,.65), leather=mat(0x493225,.8), page=mat(0xd4ba80,.8), black=mat(0x081316,.3);
const glow=new THREE.MeshStandardMaterial({color:0xffcf64,emissive:0xf3a928,emissiveIntensity:.7,roughness:.28});
function mesh(geometry,material,parent=body,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
function ellipsoid(parent,material,x,y,z,sx,sy,sz){const m=mesh(new THREE.SphereGeometry(1,28,20),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function tube(parent,points,radius,material){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,radius,7,false),material,parent);}
function link(parent,a,b,radius,material){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);const m=mesh(new THREE.CylinderGeometry(radius*.85,radius,va.distanceTo(vb),12),material,parent);m.position.copy(va.clone().add(vb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());return m;}

// Separate meshes and pivots: no flat character card or texture masquerading as 3D.
ellipsoid(body,dark,0,-.05,0,.55,.85,.4);
const cloak = mesh(new THREE.ConeGeometry(.78,1.65,32,1,true,Math.PI*.18,Math.PI*1.64),cloth,body,0,-.43,-.08);cloak.rotation.y=Math.PI;
for(let i=0;i<11;i++){const angle=.25+i*.265; tube(body,[[Math.sin(angle)*.32,.3,-Math.cos(angle)*.3],[Math.sin(angle)*.52,-.45,-Math.cos(angle)*.43],[Math.sin(angle)*.7,-1.22,-Math.cos(angle)*.57]],.016,dark);}
const collar=mesh(new THREE.TorusGeometry(.47,.07,8,32),gold,body,0,.45,.05);collar.rotation.x=Math.PI/2;
const head=new THREE.Group(); head.position.set(0,1.04,.06);body.add(head);
ellipsoid(head,cloth,0,0,-.04,.65,.74,.54);
ellipsoid(head,dark,0,-.04,.35,.53,.54,.21);
ellipsoid(head,skin,0,-.055,.43,.44,.42,.22);
const hoodRim=mesh(new THREE.TorusGeometry(.52,.045,8,48),gold,head,0,.015,.38);hoodRim.scale.set(1,1.18,1);
const hoodTip=mesh(new THREE.ConeGeometry(.34,.66,24),cloth,head,0,.66,-.15);hoodTip.rotation.x=-.38;
const eyePivots=[];
for(const side of [-1,1]){
  const eye=new THREE.Group(); eye.position.set(side*.205,.025,.59);head.add(eye);eye.rotation.z=side*-.18;eyePivots.push(eye);
  ellipsoid(eye,gold,0,0,0,.175,.208,.1);
  ellipsoid(eye,glow,0,0,.047,.14,.177,.09);
  ellipsoid(eye,black,side*-.025,.006,.118,.073,.115,.032);
  ellipsoid(eye,new THREE.MeshBasicMaterial({color:0xfff8dc}),-.026,.07,.15,.025,.033,.012);
  tube(head,[[side*.19,.6,-.04],[side*.35,.95,.06],[side*.63,1.1,.12]],.027,leather);
  ellipsoid(head,glow,side*.63,1.1,.12,.075,.075,.075);
}
tube(head,[[-.15,-.25,.609],[0,-.29,.638],[.15,-.25,.609]],.013,black);
ellipsoid(head,skin,0,-.13,.645,.07,.048,.04);

const wings=[];
for(const side of [-1,1]) for(const lower of [false,true]){
  const pivot=new THREE.Group();pivot.position.set(side*.32,lower?-.15:.48,-.34);body.add(pivot);wings.push({pivot,side,lower});
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.5,.08,1.8,.32,1.87,1.38);shape.bezierCurveTo(1.83,1.85,.87,1.42,0,0);
  const wingmat=new THREE.MeshPhysicalMaterial({color:lower?0x688779:0xadc3a4,metalness:.22,roughness:.27,transparent:true,opacity:.57,side:THREE.DoubleSide,depthWrite:false});
  const blade=new THREE.Group();blade.scale.set(side*(lower?.8:1),lower?-.62:1,1);pivot.add(blade);
  mesh(new THREE.ExtrudeGeometry(shape,{depth:.015,bevelEnabled:false,curveSegments:24}),wingmat,blade);
  const outline=shape.getPoints(40).map(p=>[p.x,p.y,.021]);tube(blade,outline,.012,gold);
  for(let i=0;i<4;i++)tube(blade,[[0,0,.022],[.55+i*.08,.26+i*.15,.028],[1.68-i*.22,.87+i*.12,.03]],.008,gold);
}
const arms=[];
for(const side of [-1,1]) for(const lower of [false,true]){
  const arm=new THREE.Group();arm.position.set(side*.43,lower?-.23:.3,.1);body.add(arm);arms.push({arm,side,lower});
  link(arm,[0,0,0],[side*.23,-.25,.18],.115,cloth);
  ellipsoid(arm,gold,side*.23,-.25,.18,.1,.1,.1);
  link(arm,[side*.23,-.25,.18],[side*.04,-.37,.52],.07,skin);
  ellipsoid(arm,skin,side*.04,-.37,.52,.11,.08,.08);
  for(let finger=0;finger<3;finger++)link(arm,[side*.02+finger*.034,-.36,.55],[side*.015+finger*.031,-.42,.6],.018,skin);
}
for(const side of [-1,1]){
  link(body,[side*.23,-.72,0],[side*.32,-1.14,.07],.08,skin);
  link(body,[side*.32,-1.14,.07],[side*.22,-1.53,.2],.063,leather);
  ellipsoid(body,leather,side*.22,-1.52,.3,.13,.1,.25);
}
const book=new THREE.Group();book.position.set(0,-.28,.82);book.rotation.x=-.26;body.add(book);
for(const side of [-1,1]){
  const half=new THREE.Group();half.rotation.y=side*-.23;book.add(half);
  mesh(new THREE.BoxGeometry(.53,.58,.085),leather,half,side*.265,0,0);
  mesh(new THREE.BoxGeometry(.48,.53,.055),page,half,side*.265,0,.07);
  for(const y of [-.2,-.1,0,.1,.2])link(half,[side*.075,y,.104],[side*.42,y,.104],.008,gold);
  tube(half,[[side*.27,-.09,.116],[side*.2,0,.116],[side*.27,.09,.116]],.018,glow);
}
link(book,[0,-.29,0],[0,.29,0],.04,gold);
const bookLight=new THREE.PointLight(0xffbe59,.7,2);bookLight.position.set(0,.05,1.15);body.add(bookLight);

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
  const t=time,fly=pose==='fly',read=pose==='read',wave=pose==='wave';
  root.position.y=Math.sin(t*1.7)*.065;
  root.position.x=fly?Math.sin(t*.8)*.55:0;
  body.rotation.z=fly?Math.sin(t*.8)*-.13:Math.sin(t*.9)*.014;
  head.rotation.x=read?.16+Math.sin(t)*.025:Math.sin(t*.8)*.025;
  head.rotation.y=wave?Math.sin(t*1.8)*.07:Math.sin(t*.63)*.035;
  for(const {pivot,side,lower} of wings){pivot.rotation.y=side*(.12+Math.sin(t*(fly?25:8)+(lower?.5:0))*(fly?.65:.2));}
  for(const {arm,side,lower} of arms){const greeting=wave&&side===1&&!lower;arm.rotation.z=greeting?1.9+Math.sin(t*5)*.14:Math.sin(t*1.7)*.018;arm.rotation.x=greeting?-.45:0;}
  book.rotation.x=-.26+(read?-.15:0)+Math.sin(t*1.7)*.012;
  const blink=t%5.3;const lid=blink<.13?Math.max(.08,Math.abs(blink-.065)/.065):1;eyePivots.forEach(eye=>eye.scale.y=lid);
  renderer.render(scene,camera);
});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);resize.disconnect();renderer.dispose();});
