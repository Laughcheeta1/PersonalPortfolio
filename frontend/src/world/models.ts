import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original, texture-free geometry authored for this island. Dimensions here are
// asset proportions; world scale and all runtime behaviour live in configuration.
const palette = {
  ivory: '#f3e2bb', stone: '#c6b38e', gold: '#e5ac45', dark: '#343b45',
  steel: '#bac7cd', wood: '#a87749', leaf: '#518952', rose: '#e9576e',
};
const materials = new Map<string, THREE.MeshStandardMaterial>();
function material(color: string, metalness = 0) {
  const key = `${color}:${metalness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: metalness ? .38 : .78, metalness }));
  return materials.get(key)!;
}
type XYZ = [number, number, number];
function mesh(g: THREE.Group, geometry: THREE.BufferGeometry, color: string, p: XYZ, scale: XYZ = [1, 1, 1], metalness = 0) {
  const m = new THREE.Mesh(geometry, material(color, metalness));
  m.position.set(...p); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function box(g: THREE.Group, p: XYZ, size: XYZ, color: string) { return mesh(g, new THREE.BoxGeometry(...size), color, p); }
function ball(g: THREE.Group, p: XYZ, size: XYZ, color: string) { return mesh(g, new THREE.SphereGeometry(1, 12, 8), color, p, size); }
function cylinder(g: THREE.Group, p: XYZ, top: number, bottom: number, h: number, color: string, segments = 16) {
  return mesh(g, new THREE.CylinderGeometry(top, bottom, h, segments), color, p);
}
function beam(g: THREE.Group, a: XYZ, b: XYZ, radius: number, color: string) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
  const m = cylinder(g, from.add(to).multiplyScalar(.5).toArray() as XYZ, radius, radius, delta.length(), color, 8);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
}
function prism(g: THREE.Group, points: [number, number][], depth: number, p: XYZ, color: string) {
  const shape = new THREE.Shape(); points.forEach(([x,y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath();
  return mesh(g, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 1, steps: 1 }), color, p);
}
function ring(g: THREE.Group, p: XYZ, radius: number, color: string, tube = .045) {
  const m = mesh(g, new THREE.TorusGeometry(radius, tube, 6, 24), color, p); m.rotation.x = Math.PI / 2; return m;
}
function surface(g: THREE.Group, color: string, sample: (u: number, v: number) => XYZ, uSteps = 16, vSteps = 8) {
  const positions: number[] = [], indices: number[] = [];
  for (let j=0;j<=vSteps;j++) for(let i=0;i<=uSteps;i++) positions.push(...sample(i/uSteps,j/vSteps));
  for(let j=0;j<vSteps;j++) for(let i=0;i<uSteps;i++) { const k=j*(uSteps+1)+i; indices.push(k,k+uSteps+1,k+1,k+1,k+uSteps+1,k+uSteps+2); }
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const m=mesh(g,geometry,color,[0,0,0]); m.material=material(color); m.material.side=THREE.DoubleSide; return m;
}
function curvedLine(g: THREE.Group, points: XYZ[], radius: number, color: string) {
  return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,5,false),color,[0,0,0]);
}

// Batch immutable geometry by material: detailed landmarks remain inexpensive.
function batch(g: THREE.Group) {
  g.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  g.traverse(o => { if (o instanceof THREE.Mesh) {
    const mat = o.material as THREE.Material;
    const geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const normalized = geometry.index ? geometry.toNonIndexed() : geometry;
    if (normalized !== geometry) geometry.dispose();
    normalized.deleteAttribute('uv');
    const list = buckets.get(mat) ?? []; list.push(normalized); buckets.set(mat, list);
  }});
  const result = new THREE.Group();
  for (const [mat, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false);
    if (merged) { const m = new THREE.Mesh(merged, mat); m.castShadow = true; m.receiveShadow = true; result.add(m); }
    geometries.forEach(geometry => geometry.dispose());
  }
  g.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  return result;
}

function rocket() {
  const g = new THREE.Group();
  cylinder(g, [0,.16,0], 2.7,2.9,.32, '#959da6'); ring(g,[0,.34,0],2.3,palette.gold,.065);
  for (let i=0;i<4;i++) { const a=i*Math.PI/2; beam(g,[Math.cos(a)*1.1,.35,Math.sin(a)*1.1],[Math.cos(a)*.63,1.3,Math.sin(a)*.63],.17,palette.dark); }
  cylinder(g,[0,1.2,0],.82,.9,.25,palette.steel);
  mesh(g,new THREE.CylinderGeometry(.62,.66,5.7,24),palette.steel,[0,4.18,0],[1,1,1],.65);
  cylinder(g,[0,7.52,0],0,.62,1.12,palette.dark,24);
  for(let y=1.5;y<7;y+=.58) ring(g,[0,y,0],.648,'#929da4',.012);
  for(const side of [-1,1]) {
    prism(g,[[0,0],[side*.58,.15],[side*.65,1.1],[0,1.55]],.12,[side*.55,5.7,-.06],palette.dark);
    prism(g,[[0,0],[side*.4,0],[side*.48,1.3],[0,1.65]],.12,[side*.55,1.55,-.06],palette.dark);
  }
  for (const x of [1.55,2.35]) for(const z of [-.5,.3]) box(g,[x,4.25,z],[.13,8,.13],palette.dark);
  for(let y=.6;y<8.3;y+=.8) {
    box(g,[1.95,y,-.1],[.94,.13,.95],palette.steel);
    beam(g,[1.55,y,.32],[2.35,y+.75,.32],.05,palette.steel);
    beam(g,[2.35,y,.32],[1.55,y+.75,.32],.05,palette.steel);
  }
  for(const y of [4.4,6.5]) box(g,[1.05,y,0],[1.5,.17,.5],palette.dark);
  ball(g,[1.95,8.45,-.1],[.12,.12,.12],'#f39a43');
  cylinder(g,[-1.8,.8,-.7],.38,.38,1.2,palette.ivory); ball(g,[-1.8,1.4,-.7],[.38,.18,.38],palette.ivory);
  // Launch table engines, hold-down clamps, umbilicals, and tower access ladder.
  for(let i=0;i<7;i++) { const a=i/7*Math.PI*2; cylinder(g,[Math.cos(a)*.44,1.13,Math.sin(a)*.44],.1,.15,.3,palette.dark,10); }
  for(let i=0;i<10;i++) { const a=i/10*Math.PI*2;box(g,[Math.sin(a)*.87,1.22,Math.cos(a)*.87],[.12,.11,.1],palette.gold); }
  for(let y=.6;y<8;y+=.22)beam(g,[2.46,y,.16],[2.46,y,-.16],.022,palette.steel);
  for(const z of [-.2,.2])beam(g,[2.46,.5,z],[2.46,8,z],.027,palette.steel);
  for(const y of [4.4,6.5]) {
    for(const z of [-.23,.23]) {
      beam(g,[.65,y+.15,z],[1.75,y+.15,z],.04,palette.steel);
      beam(g,[.65,y+.54,z],[1.75,y+.54,z],.04,palette.steel);
      for(let x=.65;x<1.7;x+=.27)beam(g,[x,y+.15,z],[x+.27,y+.54,z],.025,palette.steel);
    }
    curvedLine(g,[[1.5,y,0],[1.35,y-.4,.05],[.85,y-.4,.04],[.66,y-.15,0]],.046,palette.dark);
  }
  for(const x of [-2,2]) { beam(g,[x,.3,1.5],[x,1.5,1.5],.045,palette.dark);for(const dx of [-.12,.12])for(const dy of [0,.25])box(g,[x+dx,1.5+dy,1.5],[.2,.19,.12],palette.gold); }
  for(let y=2;y<7;y+=1.15) { box(g,[.19,y,.62],[.17,.25,.04],palette.dark);box(g,[-.16,y+.2,.63],[.08,.09,.025],'#85949b'); }
  for(let i=0;i<5;i++) {const x=-1.5+(i%3)*.35,z=1.6+(i%2)*.32;box(g,[x,.48,z],[.3,.35,.3],'#82949c');box(g,[x,.48,z+.157],[.22,.025,.01],palette.steel);}
  return g;
}

function jet() {
  const root = new THREE.Group(), g = new THREE.Group(); root.add(g); g.position.y=3.6; g.rotation.set(.07,-.2,-.07);
  ball(g,[0,0,0],[.58,.38,2.55],palette.steel);
  const nose = cylinder(g,[0,0,2.45],0,.43,1.35,'#9caab4'); nose.rotation.x=Math.PI/2;
  for(const side of [-1,1]) {
    const wing = prism(g,[[.3,.85],[2.9,-1],[2.5,-1.8],[.35,-1.35]].map(([x,z]) => [x*side,z]), .16,[0,-.02,0], '#a5b4bd'); wing.rotation.x=Math.PI/2;
    const tail=prism(g,[[.3,-1.6],[1.8,-2.1],[1.65,-2.7],[.35,-2.35]].map(([x,z])=>[x*side,z]),.1,[0,.09,0],palette.steel); tail.rotation.x=Math.PI/2;
    const fin=prism(g,[[0,0],[.1,1.45],[-.65,1.1],[-.9,0]],.09,[side*.57,.2,-1.3], '#8798a8'); fin.rotation.y=-Math.PI/2; fin.rotation.z=side*-.32;
    box(g,[side*.43,-.03,-1.25],[.54,.48,1.85], '#9eabb6');
    box(g,[side*.43,-.02,-2.22],[.42,.24,.16],palette.dark);
    box(g,[side*.63,-.17,.65],[.36,.3,.62],palette.dark);
  }
  ball(g,[0,.34,1.14],[.34,.29,.78],'#567380');
  ball(g,[-.1,.5,1.3],[.06,.025,.36],'#e2ebda');
  // Angular camouflage panels follow the F-22's swept planform instead of
  // applying a generic aircraft texture. All surfaces are authored geometry.
  for(const side of [-1,1]) {
    const patch=prism(g,[[.9,-.12],[1.53,-.56],[2.43,-1.1],[2.19,-1.47],[1.54,-1.42],[1.24,-.96],[.72,-.62]].map(([x,z])=>[side*x,z]),.006,[0,.045,0],'#8695a4');patch.rotation.x=Math.PI/2;
    const edging=prism(g,[[.38,.63],[1.9,-.65],[2.64,-1.07],[2.8,-1.03],[.48,.84]].map(([x,z])=>[side*x,z]),.006,[0,.052,0],'#c4cbd0');edging.rotation.x=Math.PI/2;
    ball(g,[side*.24,.307,-.2],[.18,.025,.66],'#8796a6');
    const nozzle=box(g,[side*.43,-.04,-2.34],[.43,.19,.12],'#4d535a');nozzle.rotation.x=.12;
    for(let slit=0;slit<4;slit++)box(g,[side*.43-.15+slit*.1,-.04,-2.405],[.025,.12,.012],'#8c9090');
    beam(g,[side*.72,.065,.34],[side*1.1,.065,-.72],.009,'#667986');
    beam(g,[side*1.3,.065,-1.49],[side*2.45,.065,-1.49],.009,'#667986');
    const insignia=prism(g,[[0,.14],[.04,.045],[.15,.045],[.06,-.02],[.1,-.13],[0,-.06],[-.1,-.13],[-.06,-.02],[-.15,.045],[-.04,.045]],.005,[side*1.9,.07,-1.07],'#e1e2dd');insignia.rotation.x=Math.PI/2;
  }
  curvedLine(g,[[-.3,.38,.7],[-.26,.58,1.17],[0,.63,1.52],[.26,.58,1.17],[.3,.38,.7]],.02,'#d0d4ce');
  beam(g,[0,.54,1.58],[0,.19,2.07],.025,'#c1c7c8');
  for(let i=0;i<3;i++) ball(root,[-1.2+i,1+i*.16,-.5],[.9,.36,.62],'#eef6f4');
  return root;
}

function network() {
  const g=new THREE.Group(); box(g,[0,.32,0],[5.6,.64,2],palette.wood); box(g,[0,.52,1.03],[4.9,.55,.08],palette.ivory);
  const layers = [{x:-2,ys:[1.7,3,4.3],color:'#65a7e5'},{x:0,ys:[1.2,2.4,3.6,4.8],color:'#83bd67'},{x:2,ys:[2.1,3.8],color:'#f3a263'}];
  for(let i=0;i<layers.length;i++) {
    const l=layers[i]; beam(g,[l.x,.6,0],[l.x,Math.max(...l.ys),0],.06,palette.dark);
    if(i<layers.length-1) for(const y of l.ys) for(const ny of layers[i+1].ys) beam(g,[l.x,y,0],[layers[i+1].x,ny,0],.035,palette.ivory);
    for(const y of l.ys) ball(g,[l.x,y,0],[.47,.47,.47],l.color);
    box(g,[l.x,.53,1.09],[.7,.11,.03],l.color);
  }
  return g;
}

function bouquet() {
  const g=new THREE.Group(); cylinder(g,[0,.2,0],1.7,1.9,.4,palette.ivory);
  // Separate folded paper sheets flare behind the flowers, leaving the roses exposed.
  for(let sheet=0;sheet<5;sheet++) {
    const center=sheet/5*Math.PI*2;
    surface(g,sheet%2?'#f2b6b0':'#edc99b',(u,v)=>{
      const a=center+(u-.5)*1.5, radius=.23+v*1.48;
      return [Math.cos(a)*radius,.45+v*(2.65+.45*Math.sin(u*Math.PI)-1.15*Math.max(0,Math.sin(a))),Math.sin(a)*radius-.15];
    },10,5);
  }
  cylinder(g,[0,1,0],.48,.48,.3,palette.rose);
  for(const side of [-1,1]) { const bow=ball(g,[side*.46,1,.5],[.52,.27,.16],palette.rose); bow.rotation.z=side*.3; const ribbon=box(g,[side*.3,.62,.48],[.3,.68,.06],palette.rose); ribbon.rotation.z=side*.3; }
  const blooms: XYZ[]=[[-.9,3,.2],[.4,3.5,0],[1,2.8,.4],[-.2,2.8,1],[-.4,3.55,-.65]];
  blooms.forEach((p,i)=>{
    beam(g,[0,1.3,0],p,.045,palette.leaf);
    const rose=new THREE.Group(); rose.position.set(...p); rose.rotation.x=.75; g.add(rose);
    ball(rose,[0,-.1,0],[.37,.24,.37],i%2?'#e88494':'#bd334e');
    // Rolled central bud and overlapping cupped petals; thin surfaces preserve
    // the spiral silhouette that distinguishes a rose from a generic flower.
    for(let k=0;k<4;k++) for(let j=0;j<5+k;j++) {
      const angle=j/(5+k)*Math.PI*2+k*.56;
      surface(rose,i%2?(k%2?'#ffa8b4':'#f597a1'):(k%2?'#ef6476':'#d9445a'),(u,v)=>{
        const a=angle+(u-.5)*(1.45-k*.12), r=.035+k*.115+v*(.065+k*.03);
        return [Math.cos(a)*r,.22-k*.08+v*.22-Math.pow(v,3)*(.15+k*.045)+Math.sin(u*Math.PI)*.075,Math.sin(a)*r];
      },10,6);
    }
    surface(rose,i%2?'#ffc1c8':'#f47588',(u,v)=>{ const a=u*Math.PI*3.3,r=.035+u*.11; return [Math.cos(a)*r,.18+v*.2-u*.035,Math.sin(a)*r]; },26,3);
  });
  for(let i=0;i<9;i++) { const a=i*2.4,leaf=new THREE.Group();leaf.position.set(Math.sin(a)*1.15,2.75+(i%3)*.3,Math.cos(a)*1.15);leaf.rotation.z=-Math.sin(a)*.7;g.add(leaf);
    surface(leaf,palette.leaf,(u,v)=>{const x=(u-.5)*Math.sin(v*Math.PI)*.55;return[x,v*.83-.4,.06*Math.sin(v*Math.PI)-Math.abs(x)*.14];},6,8);
    beam(leaf,[0,-.4,.012],[0,.43,.012],.013,'#789c55');
    for(let j=0;j<4;j++)for(const side of [-1,1])beam(leaf,[0,-.28+j*.14,.025],[side*.18,-.17+j*.14,.025],.007,'#789c55');
  }
  for(let i=0;i<12;i++) { const a=i*2.4,p:XYZ=[Math.sin(a)*1.35,3+(i%3)*.2,Math.cos(a)*1.35];beam(g,[p[0]*.7,p[1]-.4,p[2]*.7],p,.018,palette.leaf);
    for(let j=0;j<5;j++)ball(g,[p[0]+Math.sin(j*1.26)*.06,p[1]+Math.cos(j*1.26)*.06,p[2]],[.055,.055,.047],palette.ivory);
  }
  for(const side of [-1,1])surface(g,palette.rose,(u,v)=>[side*(.06+u*.77),1+Math.sin(u*Math.PI)*(.12+v*.22),.58+Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.22],12,6);
  return g;
}

function statue() {
  const g=new THREE.Group();
  box(g,[0,.18,0],[3.4,.36,2.6],palette.stone); box(g,[0,.8,0],[2.8,1.1,2.2],palette.ivory); box(g,[0,1.4,0],[3.15,.22,2.5],palette.ivory);
  const stone=palette.ivory;
  ball(g,[.65,1.7,0],[.78,.4,.65],palette.stone);
  beam(g,[-.55,1.58,.1],[-.35,3.15,0],.25,stone); beam(g,[.65,1.92,0],[.28,3.15,0],.3,stone);
  ball(g,[-.55,1.57,.18],[.28,.14,.43],stone); ball(g,[.65,1.94,.19],[.3,.15,.42],stone);
  cylinder(g,[0,2.9,-.05],.6,.75,1.4,stone,9);
  ball(g,[0,3.72,0],[.66,.85,.37],stone);
  beam(g,[-.55,4.06,0],[-.95,3.2,.12],.24,stone); beam(g,[-.95,3.2,.12],[-1.1,2.64,.25],.19,stone); ball(g,[-1.1,2.64,.25],[.24,.28,.23],stone);
  beam(g,[.52,4.08,0],[.82,4.95,0],.26,stone); beam(g,[.82,4.95,0],[.87,5.95,.06],.21,stone); ball(g,[.87,6.05,.06],[.3,.34,.27],stone);
  for(let i=0;i<4;i++) ball(g,[.66+i*.13,6.22,.22],[.085,.12,.1],stone);
  ball(g,[-.1,4.69,.06],[.43,.52,.42],stone);
  for(let i=0;i<13;i++) { const a=i*2.4; ball(g,[-.1+Math.sin(a)*.38,4.93+(i%3)*.09,Math.cos(a)*.31],[.16,.14,.16],palette.stone); }
  for(let i=0;i<9;i++) { const a=i/8*Math.PI; const leaf=ball(g,[-.1+Math.cos(a)*.44,4.91+Math.sin(a)*.22,.24],[.07,.14,.055],palette.gold); leaf.rotation.z=-a; }
  for(let i=0;i<5;i++) { const fold=beam(g,[.45,4.15-i*.26,.28],[-.54,3.36-i*.3,.35],.075,'#dfcfac'); fold.scale.z=.7; }
  for(const [x,y] of [[-.3,3.9],[.8,5.4],[-.55,2.5],[.5,.7]]) { beam(g,[x,y,.39],[x+.15,y-.16,.4],.017,'#8e826b'); beam(g,[x+.15,y-.16,.4],[x+.1,y-.35,.41],.017,'#8e826b'); }
  for(let i=0;i<7;i++) mesh(g,new THREE.DodecahedronGeometry(.22+(i%3)*.09),palette.stone,[Math.sin(i*2.4)*2,.2,Math.cos(i*2.4)*1.7]);
  // Heroic anatomy beneath the asymmetric surviving himation.
  for(const side of [-1,1]) {
    const chest=ball(g,[side*.25,3.92,.27],[.32,.27,.2],stone);chest.rotation.z=side*.12;
    ball(g,[side*.55,4.12,.025],[.27,.3,.27],stone);
    ball(g,[side*.14,3.57,.31],[.14,.18,.08],stone);
    ball(g,[side*.14,3.32,.31],[.13,.14,.07],stone);
  }
  const bicep=ball(g,[.73,4.65,.03],[.245,.41,.24],stone);bicep.rotation.z=-.22;
  ball(g,[.84,5.41,.045],[.205,.4,.2],stone);
  ball(g,[-.39,2.66,.07],[.29,.43,.26],stone);ball(g,[.49,2.61,.03],[.32,.42,.29],stone);
  ball(g,[-.6,1.98,.06],[.19,.35,.21],stone);
  ball(g,[-.1,4.78,.405],[.3,.18,.085],stone);
  prism(g,[[-.07,0],[.065,0],[.005,-.24]],.16,[-.09,4.8,.4],stone);
  for(const side of [-1,1]) {
    curvedLine(g,[[side*.11-.1,4.77,.445],[side*.2-.1,4.8,.423],[side*.29-.1,4.78,.385]],.027,palette.stone);
    ball(g,[side*.17-.1,4.71,.426],[.065,.025,.02],'#b7a789');
    for(let t=0;t<5;t++)ball(g,[side===-1?-.73+t*.07:.48+t*.075,side===-1?1.57:1.94,.5],[.055,.075,.11],stone);
  }
  curvedLine(g,[[-.22,4.53,.415],[-.09,4.51,.443],[.035,4.54,.406]],.018,palette.stone);
  // Cloth is a continuous folded surface, with torn scalloped edges and a
  // diagonal sweep from the raised-arm shoulder across the hips.
  surface(g,stone,(u,v)=>{
    const angle=-.18+u*Math.PI*1.45, radius=.48+v*.13+Math.sin(u*Math.PI*12)*(.025+v*.045);
    return [Math.cos(angle)*radius,4.18-v*2.49-u*.2+Math.sin(u*33)*v*.12,Math.sin(angle)*radius+.05];
  },44,22);
  for(let f=0;f<6;f++)curvedLine(g,[[.47,4.12-f*.12,.36],[.2,3.84-f*.22,.59],[-.26,3.52-f*.24,.56],[-.51,3.39-f*.26,.28]],.039,'#dfcfac');
  cylinder(g,[.46,4.14,.38],.13,.13,.07,palette.gold).rotation.x=Math.PI/2;
  for(let curl=0;curl<17;curl++) {
    const a=curl/17*Math.PI*2;const m=ring(g,[-.1+Math.cos(a)*.35,4.94+Math.sin(a)*.21,.26],.079,palette.ivory,.033);m.rotation.x=0;
  }
  // Branching fractures across the plinth, limbs, and the visible drapery.
  for(let c=0;c<17;c++) {
    const x=Math.sin(c*3.7)*.5,y=2.05+(c%7)*.28,z=.64;
    curvedLine(g,[[x,y,z],[x+.05,y-.07,z+.002],[x-.025,y-.16,z],[x+.045,y-.23,z]],.0065,'#aa9679');
  }
  for(const side of [-1,1]) {
    box(g,[side*1.22,.8,1.115],[.065,.92,.025],palette.stone);
    for(let i=0;i<8;i++) { const a=.1+i/8*2.4,x=side*Math.sin(a)*.44,y=.78-Math.cos(a)*.4;
      const leaf=ball(g,[x,y,1.15],[.06,.12,.029],palette.gold);leaf.rotation.z=side*(-a+.3);
    }
  }
  box(g,[0,1.23,1.115],[2.45,.055,.03],palette.stone);box(g,[0,.34,1.115],[2.45,.055,.03],palette.stone);
  return g;
}

function gym() {
  const g=new THREE.Group();
  for(let x=-2;x<=2;x++) for(let z=-1;z<=1;z++) box(g,[x,.09,z],[.96,.18,.96],'#596066');
  for(const x of [-1.45,1.45]) { box(g,[x,.28,0],[.45,.3,2.4],palette.dark); box(g,[x,2.3,-.3],[.23,4.2,.23],palette.dark); box(g,[x,2.7,0],[.28,.3,.6],palette.dark);
    for(let y=.9;y<4.3;y+=.32) ball(g,[x,y,-.165],[.055,.055,.016],'#151f28');
    beam(g,[x,.4,.65],[x,1.2,-.3],.09,palette.steel);
  }
  beam(g,[-1.45,4.22,-.3],[1.45,4.22,-.3],.1,palette.dark);
  beam(g,[-2.75,2.8,.2],[2.75,2.8,.2],.075,palette.steel);
  for(const side of [-1,1]) for(let i=0;i<2;i++) {
    const x=side*(1.95+i*.26); const plate=cylinder(g,[x,2.8,.2],.68,.68,.22,palette.dark,24); plate.rotation.z=Math.PI/2;
    const hub=cylinder(g,[x+side*.12,2.8,.2],.14,.14,.045,palette.steel); hub.rotation.z=Math.PI/2;
    const detail=ring(g,[x+side*.12,2.8,.2],.51,'#76808a',.025); detail.rotation.set(0,Math.PI/2,0);
    // Raised "20" lettering is geometry, so no font or texture download is needed.
    const face=x+side*.145;
    const two: [number,number][]=[[3.12,.12],[3.16,.16],[3.14,.22],[3.08,.23],[3.01,.12],[3.01,.24]];
    for(let k=1;k<two.length;k++) beam(g,[face,...two[k-1]],[face,...two[k]],.01,palette.ivory);
    const zero: [number,number][]=[[3.03,.3],[3.14,.3],[3.16,.34],[3.14,.38],[3.03,.38],[3.01,.34],[3.03,.3]];
    for(let k=1;k<zero.length;k++) beam(g,[face,...zero[k-1]],[face,...zero[k]],.01,palette.ivory);
  }
  return g;
}

function library() {
  const g=new THREE.Group();
  for(let i=0;i<4;i++) box(g,[0,.2+i*.35,-i*.23],[6-i*.55,.4,4.6-i*.35],i%2?palette.ivory:palette.stone);
  for(let i=0;i<6;i++) box(g,[0,.12+i*.22,2.9-i*.28],[1.8,.25,.5],palette.ivory);
  box(g,[0,1.75,-.45],[4.7,.4,3.3],palette.ivory); box(g,[0,2.8,-1.6],[4.5,2,.25],palette.stone);
  for(const x of [-1.9,-1.15,-.38,.38,1.15,1.9]) {
    cylinder(g,[x,2.9,1],.17,.23,2.05,palette.ivory,12); cylinder(g,[x,1.97,1],.3,.3,.17,palette.ivory); box(g,[x,3.96,1],[.5,.2,.5],palette.ivory);
    for(let i=0;i<5;i++) { const a=i/5*Math.PI*2; beam(g,[x+Math.sin(a)*.18,2.1,1+Math.cos(a)*.18],[x+Math.sin(a)*.155,3.8,1+Math.cos(a)*.155],.018,'#dac9a8'); }
  }
  box(g,[0,4.17,0],[5,.28,3],palette.ivory);
  prism(g,[[-2.5,0],[0,1.1],[2.5,0]],2.9,[0,4.33,-1.45],palette.ivory);
  prism(g,[[-1.8,0],[0,.72],[1.8,0]],.06,[0,4.39,1.49],palette.stone);
  for(const x of [-2.7,2.7]) {
    for(const z of [-1.5,.5]) beam(g,[x,.4,z],[x,4.8,z],.055,palette.wood);
    for(let y=.8;y<4.9;y+=1) { beam(g,[x,y,-1.5],[x,y,.5],.045,palette.wood); beam(g,[x,y,-1.5],[x,y+.9,.5],.045,palette.wood); box(g,[x,y,-.5],[.65,.07,2.3],palette.wood); }
  }
  for(const side of [-1,1]) {
    const x=side*2.6,z=-1.9, height=side===1?7.2:6.5;
    for(const dx of [-.19,.19]) beam(g,[x+dx,0,z],[x+dx,height,z],.06,palette.gold);
    for(let y=.4;y<height-.4;y+=.5) { beam(g,[x-.19,y,z],[x+.19,y+.5,z],.035,palette.gold); beam(g,[x+.19,y,z],[x-.19,y+.5,z],.035,palette.gold); }
    beam(g,[x-side*2.3,height,z],[x+side*.8,height,z],.085,palette.gold);
    beam(g,[x-side*2.3,height+.3,z],[x+side*.8,height+.3,z],.05,palette.gold);
    for(let i=0;i<7;i++) beam(g,[x-side*2.3+i*.45,height,z],[x-side*1.85+i*.45,height+.3,z],.035,palette.gold);
    box(g,[x+side*.65,height-.2,z],[.55,.55,.55],palette.gold);
    beam(g,[x-side*1.7,height,z],[x-side*1.7,height-1.1,z],.018,palette.dark);
    box(g,[x-side*1.7,height-1.35,z],[.7,.5,.55],palette.ivory);
  }
  for(let i=0;i<5;i++) box(g,[2+(i%2)*.4,.25+Math.floor(i/2)*.35,1.8],[.4,.32,.4],palette.ivory);
  // Terraced retaining walls, a continuous ceremonial stair, and lower
  // colonnades echo the reference's hilltop civic complex.
  for(let tier=0;tier<3;tier++) {
    const y=.2+tier*.39, half=3.05-tier*.24,z=2.07-tier*.22;
    for(const side of [-1,1]) {
      box(g,[side*(half+1.05)/2,y,z],[(half-1.05),.36,.35],palette.stone);
      for(let brick=0;brick<4;brick++)box(g,[side*(1.14+brick*.43+(tier%2)*.14),y+.035,z+.19],[.39,.26,.06],palette.ivory);
      box(g,[side*(half+1.05)/2,y+.23,z],[(half-1.05)+.1,.09,.46],palette.ivory);
    }
  }
  for(let step=0;step<11;step++)box(g,[0,.07+step*.14,3.15-step*.145],[1.72,.15,.22],palette.ivory);
  for(const side of [-1,1]) {
    for(let j=0;j<5;j++) {
      const z=3.13-j*.32,y=.34+j*.3;
      cylinder(g,[side*.98,y,z],.065,.09,.4,palette.ivory,8);
      ball(g,[side*.98,y+.23,z],[.1,.11,.1],palette.ivory);
    }
    beam(g,[side*.98,.57,3.13],[side*.98,1.77,1.85],.06,palette.ivory);
    for(let k=0;k<4;k++) {
      const x=side*(1.3+k*.43);
      cylinder(g,[x,1.08,2.18],.068,.105,.47,palette.ivory,8);
      box(g,[x,1.35,2.18],[.47,.09,.24],palette.ivory);
    }
    // Incomplete side pavilions retain a visible row of classical columns.
    box(g,[side*2.15,2.03,-.76],[1.17,.18,1.05],palette.ivory);
    for(let k=0;k<3;k++)cylinder(g,[side*(1.72+k*.4),2.61,-.22],.1,.13,.97,palette.ivory,10);
    box(g,[side*2.15,3.15,-.72],[1.3,.16,1.17],palette.ivory);
    if(side===-1)prism(g,[[-.68,0],[0,.38],[.68,0]],1.05,[-2.15,3.25,-1.24],palette.ivory);
    else for(let k=0;k<3;k++)box(g,[side*(1.72+k*.38),3.31,-.72],[.28,.16,.8],palette.stone);
    for(let j=0;j<3;j++) {
      const z=.98-j*.58;
      beam(g,[side*2.87,.35,z],[side*2.87,2.7,z],.045,palette.wood);
      beam(g,[side*2.87,.9,z],[side*2.87,1.8,z-.55],.037,palette.wood);
    }
    for(let y=.85;y<2.7;y+=.75)box(g,[side*2.87,y,.43],[.55,.07,1.95],palette.wood);
    // Mediterranean cypress topiary at the stair landing.
    cylinder(g,[side*1.25,1.84,1.5],.055,.07,.65,palette.wood);
    for(let level=0;level<3;level++)ball(g,[side*1.25,1.99+level*.24,1.5],[.22-level*.04,.33,.22-level*.04],palette.leaf);
  }
  for(let i=0;i<8;i++)box(g,[-2.55+(i%3)*.28,.18+Math.floor(i/3)*.25,2.6],[.25,.23,.3],palette.ivory);
  for(const x of [-1.9,0,1.9]) { cylinder(g,[x,4.44,1.28],.055,.08,.26,palette.ivory,8);ball(g,[x,4.6,1.28],[.09,.12,.09],palette.ivory); }
  box(g,[.05,3.29,-1.42],[.66,1.05,.04],'#588266');
  // Suspension cables, cab glazing, warning stripes, and bundled stone loads.
  for(const side of [-1,1]) {
    const x=side*2.6,z=-1.9,h=side===1?7.2:6.5;
    beam(g,[x,h+.68,z],[x-side*2.3,h+.3,z],.02,palette.dark);beam(g,[x,h+.68,z],[x+side*.8,h+.3,z],.02,palette.dark);
    beam(g,[x,h,z],[x,h+.68,z],.055,palette.gold);
    box(g,[x+side*.65,h-.15,z+.29],[.32,.22,.025],'#657d80');
    for(const dx of [-.23,.23])beam(g,[x-side*1.7,h-.86,z],[x-side*1.7+dx,h-1.1,z],.014,palette.dark);
    box(g,[x-side*1.7,h-1.35,z+.281],[.7,.02,.014],palette.stone);
    box(g,[x-side*1.7,h-1.35,z+.286],[.018,.5,.014],palette.stone);
  }
  return g;
}

const builders: Record<string, () => THREE.Group> = { rocket, jet, network, bouquet, statue, gym, library };
export function createLandmark(model: string): THREE.Group {
  const builder = builders[model]; if (!builder) throw new Error(`Unknown landmark model: ${model}`);
  const result=batch(builder()); result.name=`original-${model}`; return result;
}

function createPandaMonk(): THREE.Group {
  const g = new THREE.Group(); g.name = 'original-panda-monk';
  const fur = '#28272a', cream = '#fff0d0', saffron = '#d58a36', robe = '#97613a', gold = '#e3b956';
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.name = side === 1 ? 'leftLeg' : 'rightLeg'; leg.position.set(side * .18, .48, 0); g.add(leg);
    ball(leg, [0, -.18, 0], [.15, .23, .15], fur);
    ball(leg, [0, -.38, .1], [.19, .1, .24], fur);
    const arm = new THREE.Group(); arm.name = side === 1 ? 'leftArm' : 'rightArm'; arm.position.set(side * .36, 1.02, 0); g.add(arm);
    const sleeve = cylinder(arm, [side * .05, -.16, 0], .17, .22, .34, side === -1 ? saffron : robe, 12); sleeve.rotation.z = side * .24;
    ball(arm, [side * .1, -.34, .05], [.15, .17, .15], fur);
    if (side === -1) {
      // The pilgrim's staff is held by the paw and follows the arm's walk cycle.
      beam(arm, [-.16, -.96, .15], [-.16, .83, .15], .035, '#734b2d');
      cylinder(arm, [-.16, .7, .15], .055, .055, .23, gold);
      const crown = ring(arm, [-.16, .98, .15], .16, gold, .025); crown.rotation.x = 0;
      ball(arm, [-.16, 1.17, .15], [.046, .063, .046], gold);
      for (const dx of [-.12, .12]) {
        const chime = ring(arm, [-.16 + dx, .85, .15], .07, gold, .016); chime.rotation.x = 0;
      }
    }
  }
  cylinder(g, [0, .66, 0], .35, .43, .65, robe, 16);
  ball(g, [0, .99, 0], [.36, .33, .28], saffron);
  // Overlapping sash and soft garment folds make the costume readable in 3D.
  const sash = box(g, [.03, .91, .255], [.2, .6, .07], '#e3a34b'); sash.rotation.z = -.57;
  for (const x of [-.27, -.1, .12, .28]) {
    beam(g, [x * .7, .82, .27], [x, .37, .32], .023, '#af7544');
  }
  cylinder(g, [0, .65, 0], .373, .373, .09, '#754b32');
  const knot = ball(g, [.2, .66, .3], [.085, .08, .065], '#e2aa59'); knot.rotation.z = .2;
  box(g, [.23, .48, .32], [.09, .3, .04], '#e2aa59');
  ball(g, [0, 1.57, 0], [.52, .49, .43], cream);
  for (const side of [-1, 1]) {
    ball(g, [side * .4, 1.94, -.035], [.18, .19, .135], fur);
    ball(g, [side * .4, 1.96, .064], [.093, .105, .035], '#4f4139');
    const patch = ball(g, [side * .205, 1.62, .365], [.145, .19, .061], fur); patch.rotation.z = side * -.24;
    ball(g, [side * .19, 1.635, .416], [.064, .08, .024], '#6d4b30');
    ball(g, [side * .183, 1.635, .435], [.038, .054, .013], '#181b21');
    ball(g, [side * .166, 1.668, .449], [.017, .021, .009], '#fff9e9');
    ball(g, [side * .3, 1.43, .353], [.1, .04, .017], '#e9ba97');
    ball(g, [side * .085, 1.445, .421], [.105, .077, .05], '#fff7e0');
  }
  ball(g, [0, 1.515, .453], [.073, .045, .043], fur);
  beam(g, [0, 1.48, .454], [0, 1.445, .456], .011, fur);
  const smile = new THREE.EllipseCurve(0, 0, .073, .037, Math.PI, Math.PI * 2, false, 0);
  const smileCurve = new THREE.CatmullRomCurve3(smile.getPoints(10).map(p => new THREE.Vector3(p.x, p.y + 1.445, .453)));
  mesh(g, new THREE.TubeGeometry(smileCurve, 10, .009, 5, false), fur, [0, 0, 0]);
  // Large wooden mala beads drape below the chin, with a tiny golden tassel.
  for (let i = 0; i < 11; i++) {
    const a = i / 10 * Math.PI;
    ball(g, [Math.cos(a) * .31, 1.17 - Math.sin(a) * .24, .28 + Math.sin(a) * .065], [.067, .067, .067], i % 2 ? '#694832' : '#795039');
  }
  ball(g, [0, .86, .36], [.049, .059, .049], gold);
  cylinder(g, [0, .77, .36], .023, .055, .12, saffron, 8);
  return g;
}

export function createCharacter(companion: boolean): THREE.Group {
  if (!companion) return createPandaMonk();
  const g=new THREE.Group(), skin='#edb78e', shirt=companion?'#34343d':'#f1ba64';
  for(const side of [-1,1]) {
    const leg=new THREE.Group(); leg.name=side===1?'leftLeg':'rightLeg'; leg.position.set(side*.15,.55,0); g.add(leg);
    cylinder(leg,[0,-.19,0],.13,.12,.4,'#465264'); ball(leg,[0,-.46,.07],[.15,.09,.23],companion?'#f0e9db':'#80563f');
    const arm=new THREE.Group(); arm.name=side===1?'leftArm':'rightArm'; arm.position.set(side*.32,1.02,0); g.add(arm);
    const sleeve=cylinder(arm,[side*.07,-.2,0],.14,.12,.4,shirt); sleeve.rotation.z=side*.2;
    ball(arm,[side*.12,-.43,0],[.13,.14,.13],skin);
    if(companion&&side===1) { cylinder(arm,[.11,-.35,0],.137,.137,.09,'#17252a'); box(arm,[.11,-.35,.12],[.14,.07,.045],'#46514e'); }
  }
  cylinder(g,[0,.88,0],.29,.33,.66,shirt); box(g,[0,1.11,.285],[.035,.19,.025],'#b5b8b3');
  ball(g,[0,1.58,0],[.47,.49,.4],skin);
  for(const side of [-1,1]) {
    ball(g,[side*.46,1.55,0],[.12,.16,.13],skin);
    ball(g,[side*.17,1.62,.358],[.095,.13,.041],'#fff6dd'); ball(g,[side*.16,1.61,.394],[.056,.089,.024],'#433830'); ball(g,[side*.145,1.65,.414],[.017,.024,.009],'#ffffff');
    const brow=box(g,[side*.17,1.8,.355],[.17,.035,.04],'#624435'); brow.rotation.z=side*.13;
    ball(g,[side*.29,1.46,.33],[.085,.035,.014],'#e99f86');
  }
  ball(g,[0,1.51,.4],[.055,.065,.065],skin);
  const smile=new THREE.EllipseCurve(0,0,.105,.065,Math.PI,Math.PI*2,false,0);
  const curve=new THREE.CatmullRomCurve3(smile.getPoints(12).map(p=>new THREE.Vector3(p.x,p.y+1.41,.388)));
  mesh(g,new THREE.TubeGeometry(curve,12,.013,5,false),'#704838',[0,0,0]);
  const speakingMouth=ball(g,[0,1.365,.402],[.045,.045,.016],'#613f37');speakingMouth.name='speakingMouth';speakingMouth.visible=false;
  ball(g,[0,1.84,-.045],[.47,.31,.39],companion?'#654633':'#80533c');
  for(let i=0;i<9;i++) { const a=i*2.4; const tuft=ball(g,[Math.sin(a)*.31,1.92+(i%3)*.05,Math.cos(a)*.24],[.2,.12,.19],companion?'#75513a':'#956143'); tuft.rotation.z=-.35; }
  for(let i=0;i<13;i++){
    const a=i*2.39996,x=Math.sin(a)*.32,z=Math.cos(a)*.28;
    const lock=mesh(g,new THREE.ConeGeometry(.12,.34,7),'#62412e',[x,2.02+(i%3)*.035,z]);lock.rotation.z=-.55;lock.rotation.x=.3;
  }
  if(!companion) { ball(g,[0,1.99,-.04],[.46,.15,.4],'#639f98'); box(g,[0,1.96,.36],[.58,.05,.28],'#639f98'); box(g,[0,.9,-.3],[.43,.45,.22],'#b97649'); }
  return g;
}
