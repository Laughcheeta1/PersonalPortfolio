import * as THREE from 'three';
import { config } from '../config';
import { landmarks, biomes } from './registry';
import { environmentTuning } from './environmentConfig';
import { entrance, navigation, roadZ } from './navigation';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createEnvironment() {
  const group = new THREE.Group(); group.name = 'Original procedural island';
  const obstacles: Array<{x:number; z:number; radius:number}> = [];
  const t = environmentTuning, w = config.world;
  let seed = t.seed as number;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .92, flatShading: true });
  const mats = { sand: material(t.sand), cliff: material(t.cliff), road: material(t.road), wood: material('#916744'), stone: material('#ddd4bc'), dark: material('#4b6461'), white: material('#fff3d1') };
  const add = (geometry: THREE.BufferGeometry, mat: THREE.Material, x: number,y:number,z:number, sx=1,sy=1,sz=1) => {
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  const box = new THREE.BoxGeometry(1,1,1), sphere = new THREE.IcosahedronGeometry(1,1), column = new THREE.CylinderGeometry(.32,.4,1,10);
  const islandLayer = (radiusX:number,radiusZ:number, depth:number,y:number,mat:THREE.Material) => {
    const mesh=add(new THREE.CylinderGeometry(1,1.015,depth,t.terrainSegments),mat,w.centerX,y,0,radiusX,1,radiusZ); mesh.castShadow=false; return mesh;
  };
  islandLayer(w.radiusX + 1,w.radiusZ + 1,t.cliffDepth,-t.cliffDepth/2-.2,mats.cliff);
  islandLayer(w.radiusX,w.radiusZ,.45,-.2,mats.sand);
  // A shared polar mesh gives smooth, spatially stable biome color gradients.
  const positions:number[] = [], colors:number[] = [], indices:number[] = [];
  for(let r=0;r<=t.terrainRings;r++) for(let a=0;a<=t.terrainSegments;a++) {
    const angle=a/t.terrainSegments*Math.PI*2, radius=r/t.terrainRings;
    const x=w.centerX+Math.cos(angle)*(w.radiusX-w.shoreline)*radius, z=Math.sin(angle)*(w.radiusZ-w.shoreline)*radius;
    positions.push(x,.035,z); const color=new THREE.Color(t.grass);
    for(const landmark of landmarks) { const b=biomes[landmark.biome], d=Math.hypot(x-landmark.position[0],z-landmark.position[1]); const influence=1-THREE.MathUtils.smoothstep(d,b.innerRadius,b.outerRadius); color.lerp(new THREE.Color(b.ground),influence*b.strength); }
    colors.push(color.r,color.g,color.b);
    if(r<t.terrainRings&&a<t.terrainSegments){ const i=r*(t.terrainSegments+1)+a,j=i+t.terrainSegments+1; indices.push(i,j,i+1,i+1,j,j+1); }
  }
  const ground=new THREE.BufferGeometry(); ground.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); ground.setIndex(indices); ground.computeVertexNormals();
  add(ground,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}),0,0,0).castShadow=false;
  const ocean=add(new THREE.PlaneGeometry(1800,1800),material(t.ocean),w.centerX,-3.1,0); ocean.rotation.x=-Math.PI/2; ocean.castShadow=false;
  const roadPositions:number[]=[];
  const strip=(points:Array<[number,number]>,width:number)=>{ for(let i=0;i<points.length-1;i++){ const [x,z]=points[i],[nx,nz]=points[i+1],len=Math.hypot(nx-x,nz-z),ox=-(nz-z)/len*width/2,oz=(nx-x)/len*width/2; roadPositions.push(x+ox,.07,z+oz,nx+ox,.07,nz+oz,x-ox,.07,z-oz,x-ox,.07,z-oz,nx+ox,.07,nz+oz,nx-ox,.07,nz-oz); } };
  const roadPoints:Array<[number,number]>=navigation.filter(node=>node.id.startsWith('road:')).map(node=>[node.x,node.z]);strip(roadPoints,w.roadWidth);
  for(const l of landmarks){const target=entrance(l);strip([[l.position[0],roadZ(l.position[0])],[target.x,target.z]],w.pathWidth);}
  const roadGeometry=new THREE.BufferGeometry();roadGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roadPositions,3));roadGeometry.computeVertexNormals();mats.road.side=THREE.DoubleSide;add(roadGeometry,mats.road,0,0,0).castShadow=false;
  const clear=(x:number,z:number)=>Math.abs(z-roadZ(x))>t.routeClearance && !landmarks.some(l=>Math.hypot(x-l.position[0],z-l.position[1])<t.landmarkClearance || (Math.abs(x-l.position[0])<t.routeClearance && z>Math.min(roadZ(x),l.position[1])-2 && z<Math.max(roadZ(x),l.position[1])+2));
  const dummy=new THREE.Object3D();
  const instance=(geo:THREE.BufferGeometry,mat:THREE.Material,count:number)=>{const m=new THREE.InstancedMesh(geo,mat,count);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
  const put=(m:THREE.InstancedMesh,i:number,x:number,y:number,z:number,sx:number,sy=sx,sz=sx)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,random()*Math.PI*2,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);};
  const leafGeometry=new THREE.SphereGeometry(1,6,4), leafMaterial=material('#ffffff');leafMaterial.flatShading=false;
  const trunks=instance(new THREE.CylinderGeometry(.16,.28,1.8,9),mats.wood,config.performance.trees), crowns=instance(leafGeometry,leafMaterial,config.performance.trees*t.leavesPerTree), pine=instance(new THREE.ConeGeometry(1,3,10),material('#417c60'),config.performance.trees);
  const roots=instance(box,mats.wood,config.performance.trees*3),fruits=instance(new THREE.SphereGeometry(.17,10,7),material('#eaa14d'),config.performance.trees*3);
  let leafCount=0,fruitCount=0,rootCount=0;
  let treeCount=0;for(let attempt=0;attempt<t.placementAttempts&&treeCount<config.performance.trees;attempt++){
    const x=w.centerX+(random()*2-1)*w.radiusX*t.treeEdgeMargin,z=(random()*2-1)*w.radiusZ*t.treeEdgeMargin;
    if(((x-w.centerX)/w.radiusX)**2+(z/w.radiusZ)**2>t.treeEdgeMargin**2||!clear(x,z)||landmarks.some(l=>Math.hypot(x-l.position[0],z-l.position[1])<t.treeSightClearance))continue;
    const scale=t.treeScaleMin+random()*t.treeScaleVariation,classical=x<t.classicalStart;
    put(trunks,treeCount,x,.9*scale,z,scale);
    if(!classical)for(let j=0;j<t.leavesPerTree;j++){
      const angle=j*2.39996, height=1-j/(t.leavesPerTree-1)*2, ring=Math.sqrt(1-height*height), radius=1.15*scale;
      put(crowns,leafCount,x+Math.cos(angle)*ring*radius,2.3*scale+height*.85*scale,z+Math.sin(angle)*ring*radius,.43*scale,.29*scale,.65*scale);
      crowns.setColorAt(leafCount++,new THREE.Color().setHSL(.23+random()*.075,.60+random()*.14,.13+random()*.12));
    }
    for(let j=0;j<3;j++){const angle=j/3*Math.PI*2;put(roots,rootCount++,x+Math.cos(angle)*.23,.14,z+Math.sin(angle)*.23,.18,.25,.62);if(!classical&&treeCount%3===0){put(fruits,fruitCount++,x+Math.cos(angle)*scale,1.95*scale,z+Math.sin(angle)*scale,scale);}}
    put(pine,treeCount,x,2*scale,z,classical?.65*scale:.001,classical?1.3*scale:.001,classical?.65*scale:.001);
    obstacles.push({x,z,radius:.45*scale});treeCount++;
  }trunks.count=pine.count=treeCount;crowns.count=leafCount;fruits.count=fruitCount;roots.count=rootCount;
  const flowers=instance(leafGeometry,leafMaterial,config.performance.flowers*t.flowerPetals),centers=instance(new THREE.SphereGeometry(.055,6,4),material('#edb956'),config.performance.flowers),stems=instance(new THREE.CylinderGeometry(.013,.015,.2,4),material('#5f9453'),config.performance.flowers);
  let flowerCount=0;for(let attempt=0;attempt<t.placementAttempts&&flowerCount<config.performance.flowers;attempt++){
    const x=w.centerX+(random()*2-1)*w.radiusX*.9,z=(random()*2-1)*w.radiusZ*.9;
    if(((x-w.centerX)/w.radiusX)**2+(z/w.radiusZ)**2>.85||!clear(x,z))continue;
    put(stems,flowerCount,x,.1,z,1);put(centers,flowerCount,x,.23,z,1);
    for(let j=0;j<t.flowerPetals;j++){const angle=j/t.flowerPetals*Math.PI*2,idx=flowerCount*t.flowerPetals+j;put(flowers,idx,x+Math.cos(angle)*.085,.21,z+Math.sin(angle)*.085,.075,.025,.075);flowers.setColorAt(idx,new THREE.Color(['#fff9df','#eeadba','#f5d574'][flowerCount%3]));}flowerCount++;
  }flowers.count=flowerCount*t.flowerPetals;centers.count=stems.count=flowerCount;flowers.castShadow=centers.castShadow=stems.castShadow=false;
  const grass=instance(new THREE.ConeGeometry(.06,.27,3),material('#81a966'),t.grassCount),shrubs=instance(leafGeometry,leafMaterial,t.shrubs*7);let grassCount=0,shrubCount=0;
  for(let i=0;i<t.grassCount;i++){const x=w.centerX+(random()*2-1)*w.radiusX*.9,z=(random()*2-1)*w.radiusZ*.85;if(!clear(x,z)||((x-w.centerX)/w.radiusX)**2+(z/w.radiusZ)**2>.8)continue;put(grass,grassCount++,x,.11,z,.7+random(),.7+random(),1);}
  for(let i=0;i<t.shrubs;i++){const x=w.centerX+(random()*2-1)*w.radiusX*.85,z=(random()*2-1)*w.radiusZ*.8;if(!clear(x,z)||((x-w.centerX)/w.radiusX)**2+(z/w.radiusZ)**2>.8)continue;for(let j=0;j<7;j++){const a=j*2.4;put(shrubs,shrubCount,x+Math.cos(a)*.35,.3+random()*.3,z+Math.sin(a)*.35,.4,.3,.5);shrubs.setColorAt(shrubCount++,new THREE.Color().setHSL(.25,.4,.35+random()*.15));}}
  grass.count=grassCount;grass.castShadow=false;shrubs.count=shrubCount;
  const curbs=instance(box,mats.stone,1000);let curbCount=0;
  const curb=(x:number,z:number,sx:number,sz:number)=>{put(curbs,curbCount++,x,.12,z,sx,.15,sz);dummy.rotation.set(0,0,0);dummy.updateMatrix();curbs.setMatrixAt(curbCount-1,dummy.matrix);};
  for(let x=roadPoints[0][0];x<roadPoints.at(-1)![0];x+=t.curbSpacing)for(const side of [-1,1]){if(landmarks.some(l=>Math.abs(l.position[0]-x)<w.pathWidth*.6&&Math.sign(l.position[1])===side))continue;curb(x,roadZ(x)+side*(w.roadWidth/2+.12),t.curbSpacing*.94,.25);}
  for(const l of landmarks){const e=entrance(l),start=roadZ(e.x),direction=Math.sign(e.z-start);for(let z=start+direction*(w.roadWidth/2+.4);direction*(e.z-z)>0;z+=direction*t.curbSpacing)for(const side of [-1,1])curb(e.x+side*(w.pathWidth/2+.12),z,.25,t.curbSpacing*.94);}
  curbs.count=curbCount;
  for(let x=-78;x<28;x+=t.fenceSpacing){if(landmarks.some(l=>Math.abs(l.position[0]-x)<4))continue;const z=roadZ(x)+3.1;for(const dx of [-t.fenceLength/2,t.fenceLength/2]){add(box,mats.wood,x+dx,.55,z,.18,1.1,.18);obstacles.push({x:x+dx,z,radius:.2});}for(const y of [.4,.8])add(box,mats.wood,x,y,z,t.fenceLength,.11,.12);for(let dx=-t.fenceLength/2;dx<t.fenceLength/2;dx+=.5)obstacles.push({x:x+dx,z,radius:.28});}
  const rocks=instance(new THREE.IcosahedronGeometry(1,0),mats.cliff,t.rocks+t.shoreRocks);let rockCount=0;
  for(let i=0;i<t.shoreRocks;i++){const a=i/t.shoreRocks*Math.PI*2,x=w.centerX+Math.cos(a)*(w.radiusX+.3),z=Math.sin(a)*(w.radiusZ+.3);put(rocks,rockCount++,x,-1.5,z,1.4+random()*1.8,2+random()*1.5,1.4+random());}
  for(let i=0;i<t.rocks;i++){const x=w.centerX+(random()*2-1)*w.radiusX*.85,z=(random()*2-1)*w.radiusZ*.8;if(!clear(x,z)||((x-w.centerX)/w.radiusX)**2+(z/w.radiusZ)**2>.8)continue;const s=.5+random()*.65;put(rocks,rockCount++,x,s*.4,z,s,s*.75,s);obstacles.push({x,z,radius:s});}rocks.count=rockCount;
  for(let x=roadPoints[0][0]+5;x<roadPoints.at(-1)![0];x+=t.lampSpacing){const z=roadZ(x)-t.routeClearance;if(landmarks.some(l=>Math.abs(l.position[0]-x)<w.pathWidth))continue;add(column,mats.dark,x,1.3,z,.2,2.6,.2);add(new THREE.CylinderGeometry(.2,.3,.16,10),mats.dark,x,.08,z);add(box,mats.white,x,2.6,z,.36,.5,.36);for(const dx of [-.2,.2])for(const dz of [-.2,.2])add(box,mats.dark,x+dx,2.6,z+dz,.045,.58,.045);add(new THREE.ConeGeometry(.35,.3,4),mats.dark,x,3,z);add(sphere,mats.dark,x,3.2,z,.08,.12,.08);obstacles.push({x,z,radius:t.lampRadius});}
  // Each small biome set is authored here from primitives, never downloaded models.
  for(const l of landmarks){const [x,z]=l.position;
    const prop=(g:THREE.BufferGeometry,m:THREE.Material,dx:number,y:number,dz:number,sx=1,sy=sx,sz=sx)=>add(g,m,x+dx,y,z+dz,sx,sy,sz);
    if(l.biome==='lunar'){prop(new THREE.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI/2),material('#ced5de'),-6,0,-3,2,2,2);obstacles.push({x:x-6,z:z-3,radius:2});for(let i=0;i<7;i++){const dx=-6+i*1.9;prop(sphere,mats.cliff,dx,.4,-6,.5,.45,.7);obstacles.push({x:x+dx,z:z-6,radius:.6});}}
    if(l.biome==='altitude'){for(let i=0;i<3;i++){const dx=-6+i*5;prop(new THREE.ConeGeometry(1,1,5),material('#9daead'),dx,2.5,9,3,5,3);prop(new THREE.ConeGeometry(1,1,5),mats.white,dx,4.5,9,1,1.9,1);obstacles.push({x:x+dx,z:z+9,radius:2.6});}}
    if(l.biome==='digital'){const glow=new THREE.MeshStandardMaterial({color:'#73ebdf',emissive:'#3b9d9b',emissiveIntensity:.8});for(const dx of [-5,5]){prop(box,mats.dark,dx,1,-2,1,2,1);prop(box,glow,dx,1,-1.48,.7,1.5,.03);obstacles.push({x:x+dx,z:z-2,radius:.8});}}
    if(l.biome==='garden'){const pink=material('#e9a8b5');for(let i=0;i<10;i++){const a=i/10*Math.PI*2,dx=Math.cos(a)*5,dz=Math.sin(a)*5;if(dz<-3)continue;prop(sphere,pink,dx,.4,dz,.6,.45,.6);}for(const dx of [-6,6]){prop(box,mats.wood,dx,.7,1,1,.18,2.5);prop(box,mats.wood,dx,.35,1,.5,.7,1.8);obstacles.push({x:x+dx,z:z+1,radius:1});}}
    if(l.biome==='battle'){for(let i=0;i<8;i++){const dx=(i%2?1:-1)*(4+random()*2),dz=-2+random()*7,height=.7+random()*2;prop(column,mats.stone,dx,height/2,dz,1,height,1);obstacles.push({x:x+dx,z:z+dz,radius:.6});}for(let i=0;i<10;i++)prop(sphere,mats.cliff,-5+random()*10,.2,5+random()*2,.5,.3,.4);}
    if(l.biome==='training'){prop(box,material('#677375'),0,.08,0,9,.12,7);for(const dx of [-5,5]){prop(box,mats.dark,dx,.7,0,1,.25,2.5);prop(box,mats.dark,dx,.35,0,.6,.7,1.5);obstacles.push({x:x+dx,z,radius:1});}}
  }
  for(let x=t.classicalStart;x>-91;x-=8){for(const side of [-1,1]){const z=roadZ(x)+side*4.5,height=1.2+(-x-42)/25;add(column,mats.stone,x,height/2,z,1,height,1);add(box,mats.stone,x,height,z,.9,.22,.9);obstacles.push({x,z,radius:.5});}}
  // Batch immutable authored props by shared material; detail does not cost a draw call per leaf or fence slat.
  group.updateMatrixWorld(true);
  const batches=new Map<string,THREE.Mesh[]>();
  for(const child of [...group.children])if(child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh) && !Array.isArray(child.material)){
    const key=child.material.uuid+String(child.castShadow);const batch=batches.get(key)??[];batch.push(child);batches.set(key,batch);
  }
  for(const batch of batches.values())if(batch.length>1){
    const geometries=batch.map(mesh=>{const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);return g;});
    const geometry=mergeGeometries(geometries);if(geometry){const mesh=new THREE.Mesh(geometry,batch[0].material);mesh.castShadow=batch[0].castShadow;mesh.receiveShadow=true;group.add(mesh);batch.forEach(m=>group.remove(m));}geometries.forEach(g=>g.dispose());
  }
  const waveGeometry=new THREE.BufferGeometry(),wavePositions:number[]=[];
  for(let i=0;i<t.waveCount;i++){const angle=random()*Math.PI*2,r=1.08+random()*.5,x=w.centerX+Math.cos(angle)*w.radiusX*r,z=Math.sin(angle)*w.radiusZ*r;wavePositions.push(x,-2.8,z,x+1+random()*3,-2.8,z);}
  waveGeometry.setAttribute('position',new THREE.Float32BufferAttribute(wavePositions,3));const waves=new THREE.LineSegments(waveGeometry,new THREE.LineBasicMaterial({color:'#c3eeea',transparent:true,opacity:.5}));group.add(waves);
  const particlePositions=new Float32Array(config.performance.particles*3);for(let i=0;i<config.performance.particles;i++){particlePositions[i*3]=(random()*2-1)*14;particlePositions[i*3+1]=random()*t.particleHeight;particlePositions[i*3+2]=(random()*2-1)*14;}
  const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:'#fff5d2',size:t.particleSize,transparent:true,opacity:.65,depthWrite:false}));group.add(particles);
  return { group, obstacles, update(time:number,player:THREE.Vector3){ if(config.animation.reducedMotion)return;waves.position.y=Math.sin(time*config.animation.waterSpeed)*config.animation.waterAmplitude;particles.position.set(player.x,Math.sin(time*t.particleSpeed)*t.particleBobAmplitude,player.z);particles.rotation.y=time*t.particleRotationSpeed; } };
}
