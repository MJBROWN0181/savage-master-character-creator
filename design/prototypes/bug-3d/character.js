import * as THREE from './vendor/build/three.module.js';

export function createBug() {
  const body = new THREE.Group();
  const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  // Seeded patina, woven cloth and chitin relief are generated as material data.
  function surface(base,accent,seed,scale=1) {
    const size=256,data=new Uint8Array(size*size*4);let n=seed;
    const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const grain=random(),cloud=(Math.sin(x*.11)*Math.sin(y*.075)+Math.sin((x+y)*.036))*.1;
      const wear=grain>.962? .7:Math.max(0,grain*.16+cloud);
      for(let c=0;c<3;c++)data[(y*size+x)*4+c]=Math.max(0,Math.min(255,base[c]*(.75+grain*.4)+accent[c]*wear));
      data[(y*size+x)*4+3]=255;
    }
    const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.repeat.set(scale,scale);texture.needsUpdate=true;return texture;
  }
  const cloth=mat(0xffffff,.93);cloth.map=surface([14,26,29],[20,26,22],43,2);cloth.bumpMap=cloth.map;cloth.bumpScale=.016;cloth.side=THREE.DoubleSide;
  const shell=mat(0xffffff,.54,.2);shell.map=surface([22,59,62],[143,106,55],87);shell.bumpMap=shell.map;shell.bumpScale=.018;
  const skin=mat(0xffffff,.7);skin.map=surface([69,104,82],[101,106,54],137);
  const gold=mat(0xb38a43,.4,.72),dark=mat(0x101d20,.65),leather=mat(0xffffff,.77),ivory=mat(0xd5b277,.8),muzzle=mat(0xb2b078,.7);
  leather.map=surface([25,36,33],[122,76,34],46);leather.bumpMap=leather.map;leather.bumpScale=.02;
  const amber=new THREE.MeshStandardMaterial({color:0xeaaa30,emissive:0x994400,emissiveIntensity:.23,roughness:.2,metalness:.25});
  const light=new THREE.MeshStandardMaterial({color:0xffdda0,emissive:0xffa932,emissiveIntensity:1.8});
  const jewel=new THREE.MeshPhysicalMaterial({color:0x156c97,metalness:.55,roughness:.12,clearcoat:1});
  const pupil=mat(0x100b05,.1),white=new THREE.MeshBasicMaterial({color:0xfff2cf});
  // The atlas is sampled into GPU material tiles at runtime; its source stays intact.
  const materialReady = typeof document === 'undefined' ? Promise.resolve() : new Promise(resolve=>{
    new THREE.TextureLoader().load('/output/bug-3d/material-atlas.png', atlas=>{
      const tile=(column,row,repeat)=>{
        const c=document.createElement('canvas');c.width=c.height=512;
        c.getContext('2d').drawImage(atlas.image,column*atlas.image.width/2,row*atlas.image.height/2,atlas.image.width/2,atlas.image.height/2,0,0,512,512);
        const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;return t;
      };
      for(const [material,column,row,repeat,bump] of [[shell,0,0,1.6,.014],[cloth,1,0,3,.012],[gold,1,1,1,.005]]){
        material.map?.dispose();material.map=tile(column,row,repeat);material.bumpMap=material.map;material.bumpScale=bump;material.needsUpdate=true;
      }
      gold.color.set(0xffffff);
      body.userData.wingMaterials.forEach(material=>{material.map=tile(0,1,1);material.needsUpdate=true;});
      atlas.dispose();body.userData.materialsLoaded=true;resolve();
    },undefined,()=>{body.userData.materialsLoaded=false;resolve();});
  });
  body.userData.wingMaterials=[];
  function mesh(geo,material,parent=body,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;}
  function ell(parent,material,x,y,z,sx,sy,sz){const m=mesh(new THREE.SphereGeometry(1,32,24),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
  function tube(parent,points,r,material=gold,closed=false){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),Math.max(24,points.length*6),r,8,closed),material,parent);}
  function segment(parent,a,b,r,material=shell){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const m=ell(parent,material,0,0,0,r,start.distanceTo(end)/2,r*.85);m.position.copy(start.clone().add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function gem(parent,x,y,z,size){const setting=mesh(new THREE.OctahedronGeometry(size*1.35),gold,parent,x,y,z);setting.scale.z=.4;const stone=mesh(new THREE.OctahedronGeometry(size),jewel,parent,x,y,z+size*.38);stone.scale.z=.55;}
  function cuff(parent,x,y,z,r){const c=mesh(new THREE.TorusGeometry(r,.023,8,24),gold,parent,x,y,z);c.rotation.x=Math.PI/2;return c;}

  ell(body,shell,0,-.12,0,.48,.68,.32);
  ell(body,dark,0,-.72,0,.35,.67,.26);
  for(let i=0;i<6;i++){
    const plate=ell(body,leather,0,-.48-i*.13,.2-i*.014,.34-i*.041,.13,.13);plate.rotation.x=-.15;
    tube(body,[[-(.3-i*.04),-.47-i*.13,.27],[0,-.55-i*.13,.345],[.3-i*.04,-.47-i*.13,.27]],.012,gold);
  }
  // The uncovered thorax has overlapping chitin, with a narrow engraved breastplate.
  for(const side of [-1,1]){
    const chest=ell(body,shell,side*.18,.12,.27,.235,.31,.13);chest.rotation.z=side*-.18;
    tube(body,[[side*.06,.38,.34],[side*.28,.25,.37],[side*.33,.03,.34],[side*.17,-.22,.38],[0,-.3,.36]],.015,gold);
    for(let i=0;i<3;i++)tube(body,[[side*.07,.18-i*.085,.395],[side*.18,.14-i*.085,.4],[side*.25,.17-i*.085,.37]],.009,gold);
  }
  tube(body,[[0,.38,.39],[0,.04,.43],[0,-.27,.38]],.019,gold);
  gem(body,0,.25,.43,.052);
  // Open-front ragged cloak: the hind legs are exposed rather than hidden in a cone.
  const cape=new THREE.Group();body.add(cape);
  const positions=[],uv=[],indices=[],rows=26,cols=64;
  function capePoint(u,v){const angle=.84+u*(Math.PI*2-1.68),flare=.5+v*.6;
    return [Math.sin(angle)*(flare+Math.sin(u*42)*v*.035),.5-v*(2.15+.15*Math.sin(u*33)+.07*Math.cos(u*73)),Math.cos(angle)*(.35+v*.38)-.16+Math.sin(v*5+u*25)*v*.065];}
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){positions.push(...capePoint(c/cols,r/rows));uv.push(c/cols,r/rows);if(r<rows&&c<cols){const i=r*(cols+1)+c;indices.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);}}
  const capeGeo=new THREE.BufferGeometry();capeGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));capeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));capeGeo.setIndex(indices);capeGeo.computeVertexNormals();mesh(capeGeo,cloth,cape);
  for(const u of [0,.018,.982,1])tube(cape,Array.from({length:20},(_,i)=>capePoint(u,i/19)),u===0||u===1?.023:.009,gold);
  for(const u of [.1,.22,.4,.6,.78,.9])tube(cape,Array.from({length:20},(_,i)=>capePoint(u,i/19)),.028,cloth);
  for(const side of [-1,1]){const shoulder=ell(body,cloth,side*.46,.38,-.04,.38,.21,.4);shoulder.rotation.z=side*-.3;tube(body,[[side*.17,.54,.27],[side*.45,.44,.34],[side*.73,.29,.16]],.027,gold);}
  cuff(body,0,.45,.06,.4);

  const head=new THREE.Group();head.position.set(0,1.03,.05);head.rotation.z=.09;body.add(head);
  ell(head,cloth,0,.06,-.16,.66,.68,.55);
  ell(head,dark,0,-.01,.29,.58,.51,.27);
  const face=ell(head,skin,0,-.06,.38,.54,.405,.25);
  // Subtle cheek and temple variation breaks the spherical toy silhouette.
  const facePosition=face.geometry.attributes.position;
  for(let i=0;i<facePosition.count;i++){
    const x=facePosition.getX(i),y=facePosition.getY(i),z=facePosition.getZ(i);
    facePosition.setXYZ(i,x*(1+.07*Math.sin(y*5)),y,z*(1+.025*Math.sin(x*13+y*9)));
  }
  face.geometry.computeVertexNormals();
  ell(head,muzzle,0,-.255,.50,.265,.075,.12);
  for(const side of [-1,1])ell(head,skin,side*.34,-.15,.49,.19,.18,.13);
  const hoodPath=[[0,.79,.12],[-.27,.58,.37],[-.49,.27,.47],[-.61,-.13,.42],[-.46,-.46,.36],[0,-.53,.34],[.46,-.46,.36],[.61,-.13,.42],[.49,.27,.47],[.27,.58,.37]];
  tube(head,hoodPath,.062,cloth,true);tube(head,hoodPath.map(([x,y,z])=>[x,y,z+.057]),.018,gold,true);
  tube(head,[[0,.69,.18],[-.12,.83,-.13],[0,.65,-.5],[.13,.33,-.61]],.12,cloth);
  // Engraved forehead crest and blue gem match the reference's distinctive hood.
  tube(head,[[-.22,.49,.45],[-.12,.53,.52],[0,.76,.3],[.12,.53,.52],[.22,.49,.45],[0,.32,.58],[-.22,.49,.45]],.026,gold);
  gem(head,0,.51,.52,.113);
  for(const side of [-1,1])for(let i=0;i<7;i++)tube(head,[[side*(.29+i*.042),.46-i*.105,.43],[side*(.24+i*.048),.415-i*.105,.49],[side*(.28+i*.046),.38-i*.105,.46]],.009,gold);
  const eyePivots=[];
  for(const side of [-1,1]){
    const eye=new THREE.Group();eye.position.set(side*.25,.015,.57);eye.rotation.z=side*.19;head.add(eye);eyePivots.push(eye);
    ell(eye,dark,0,0,0,.218,.163,.095);ell(eye,ivory,0,0,.038,.185,.127,.062);
    ell(eye,amber,side*-.014,-.008,.078,.135,.116,.06);
    ell(eye,pupil,side*-.025,.003,.128,.071,.087,.021);
    for(let ray=0;ray<28;ray++){
      const a=ray/28*Math.PI*2,r=.091+.006*Math.sin(ray*7);
      tube(eye,[[Math.cos(a)*r-side*.014,Math.sin(a)*r*.84-.008,.139],[Math.cos(a+.025)*.119-side*.014,Math.sin(a+.025)*.102-.008,.116]],.0019,ray%3?gold:dark);
    }
    ell(eye,white,-.032,.046,.156,.012,.015,.006);
    tube(head,[[side*.075,.13,.61],[side*.23,.18,.62],[side*.44,.135,.54]],.06,skin);
    tube(head,[[side*.09,-.12,.6],[side*.25,-.19,.6],[side*.44,-.1,.51]],.019,skin);
    const antenna=[[side*.24,.59,.03],[side*.36,.98,.01],[side*.52,1.33,.07],[side*.73,1.38,.14],[side*.85,1.23,.2]];
    tube(head,antenna,.039,shell);tube(head,antenna.map(([x,y,z])=>[x,y,z+.035]),.008,gold);
    const bulb=ell(head,gold,side*.85,1.22,.2,.105,.15,.09);bulb.rotation.z=side*.42;
    ell(head,light,side*.855,1.18,.25,.071,.095,.061);
  }
  tube(head,[[-.19,-.272,.602],[-.065,-.29,.624],[.085,-.286,.625],[.20,-.253,.59]],.007,dark);
  ell(head,muzzle,0,-.137,.611,.075,.043,.036);
  for(const side of [-1,1])ell(head,dark,side*.036,-.14,.645,.009,.006,.004);
  // Small overlapping scales carry the teal chitin into the forehead and cheeks.
  for(let row=0;row<3;row++)for(let col=-2;col<=2;col++){const s=ell(head,skin,col*.067,.2+row*.065,.596-row*.025,.035,.043,.004);s.rotation.z=col*.18;}

  const wings=[];
  const wingTex=surface([100,132,131],[108,94,58],562);
  for(const side of [-1,1])for(const lower of [false,true]){
    const pivot=new THREE.Group();pivot.position.set(side*.36,lower?-.15:.49,-.32);body.add(pivot);wings.push({pivot,side,lower});
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.7,.03,1.75,.43,1.82,1.53);shape.bezierCurveTo(1.8,1.96,.58,1.34,0,0);
    const wm=new THREE.MeshPhysicalMaterial({map:wingTex,color:0xbcc3af,metalness:.16,roughness:.34,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false,iridescence:.65,iridescenceIOR:1.3});
    body.userData.wingMaterials.push(wm);
    const blade=new THREE.Group();blade.scale.set(side*(lower?.88:1),lower?-.66:1,1);pivot.add(blade);
    mesh(new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,curveSegments:32}),wm,blade);
    tube(blade,shape.getPoints(50).map(p=>[p.x,p.y,.022]),.013,gold);
    const edge=(t,upper)=>{const u=1-t,a=upper?[.58,1.34]:[.7,.03],b=upper?[1.8,1.96]:[1.75,.43];return [3*u*u*t*a[0]+3*u*t*t*b[0]+t*t*t*1.82,3*u*u*t*a[1]+3*u*t*t*b[1]+t*t*t*1.53,.027];};
    const center=t=>{const a=edge(t,false),b=edge(t,true);return [(a[0]+b[0])/2,(a[1]+b[1])/2,.028];};
    tube(blade,Array.from({length:14},(_,i)=>center(i/13)),.012,gold);
    for(let i=1;i<8;i++)for(const upper of [false,true]){const t=i/9,a=center(t-.055),b=edge(t,upper);tube(blade,[a,[(a[0]+b[0])/2,(a[1]+b[1])/2,.028],b],.007,gold);}
  }
  const arms=[];
  for(const side of [-1,1])for(const lower of [false,true]){
    const arm=new THREE.Group();arm.position.set(side*.47,lower?-.45:.32,.08);body.add(arm);arms.push({arm,side,lower});
    const elbow=[side*(lower?.23:.32),lower?-.22:-.27,lower?.14:.08],hand=[side*(lower?.24:.35),lower?-.53:-.56,lower?.33:.22];
    segment(arm,[0,0,0],elbow,.145);ell(arm,gold,...elbow,.112,.12,.11);segment(arm,elbow,hand,.105);
    cuff(arm,...hand,.096);ell(arm,dark,hand[0],hand[1]-.07,hand[2]+.035,.11,.14,.09);
    for(let f=0;f<3;f++){const x=hand[0]+side*(f-1)*.045;tube(arm,[[x,hand[1]-.03,hand[2]+.08],[x+side*.025,hand[1]-.13,hand[2]+.13],[x-side*.035,hand[1]-(lower?.27:.15),hand[2]+.09]],.025,dark);}
    if(lower)tube(arm,[[hand[0],hand[1]-.15,hand[2]+.1],[hand[0]-side*.09,hand[1]-.3,hand[2]+.13],[hand[0]-side*.16,hand[1]-.32,hand[2]+.1]],.018,gold);
  }
  const legs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.29,-.77,.11);body.add(leg);legs.push({leg,side});
    const knee=[side*.22,-.48,.25],ankle=[side*.14,-1.04,.42];
    segment(leg,[0,.02,0],knee,.2);ell(leg,gold,...knee,.15,.145,.13);segment(leg,knee,ankle,.15);
    const kneeplate=mesh(new THREE.OctahedronGeometry(.16),gold,leg,knee[0],knee[1],knee[2]+.12);kneeplate.scale.set(.8,1.3,.45);
    cuff(leg,...ankle,.107);
    segment(leg,ankle,[side*.05,-1.32,.59],.113,dark);
    tube(leg,[[ankle[0]+side*.075,ankle[1],ankle[2]+.03],[side*.12,-1.25,.59],[0,-1.39,.68]],.023,gold);
    tube(leg,[[side*.05,-1.27,.59],[0,-1.39,.68],[-side*.045,-1.34,.71]],.038,dark);
  }
  Object.assign(body.userData,{identity:'Bug',wings:4,arms:4,legs:2,features:['hood crest','amber eyes','segmented hind legs','clawed feet','open ragged cloak']});
  return {body,head,eyePivots,wings,arms,legs,cape,materialReady};
}
