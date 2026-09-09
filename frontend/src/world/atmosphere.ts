import * as THREE from 'three';
import { config } from '../config';
import { biomes, landmarks } from './registry';
import { damping } from './physics';
export function biomeWeights(position: {x:number;z:number}) {
  const weights = landmarks.map(l => { const b = biomes[l.biome]; return { landmark: l, biome: b, weight: (1 - THREE.MathUtils.smoothstep(Math.hypot(position.x-l.position[0],position.z-l.position[1]),b.innerRadius,b.outerRadius))*b.strength }; });
  const total = weights.reduce((sum,b)=>sum+b.weight,0);
  return { base: Math.max(0,1-total), weights: weights.map(b=>({...b,weight:b.weight/Math.max(1,total)})) };
}
export class Atmosphere {
  private skyGroup=new THREE.Group();
  private cloudMaterial=new THREE.MeshBasicMaterial({color:'#fff9e9',transparent:true,opacity:.85,depthWrite:false,fog:false});
  private starMaterial=new THREE.PointsMaterial({color:'#e4f1ff',size:.45,transparent:true,opacity:0,depthWrite:false,fog:false});
  readonly ambient = new THREE.HemisphereLight(config.atmosphere.sky,'#a08e6b',config.atmosphere.ambient);
  readonly sun = new THREE.DirectionalLight(config.atmosphere.sunColor,config.atmosphere.sun);
  constructor(private scene: THREE.Scene) {
    scene.background=new THREE.Color(config.atmosphere.sky);scene.fog=new THREE.FogExp2(config.atmosphere.sky,config.atmosphere.fog);
    this.sun.position.set(20,35,18);this.sun.castShadow=true;this.sun.shadow.mapSize.setScalar(config.performance.shadowMap);
    Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:100});this.sun.shadow.bias=-.001;
    scene.add(this.ambient,this.sun,this.sun.target);
    const cloudGeometry=new THREE.SphereGeometry(1,10,6);
    const clouds=new THREE.InstancedMesh(cloudGeometry,this.cloudMaterial,config.sky.clouds*4),cloud=new THREE.Object3D();
    for(let i=0;i<config.sky.clouds;i++)for(let puff=0;puff<4;puff++){
      const angle=i/config.sky.clouds*Math.PI*2;
      cloud.position.set(Math.cos(angle)*config.sky.cloudRadius+puff*2,config.sky.cloudHeight+Math.sin(i*7)*8,Math.sin(angle)*config.sky.cloudRadius);
      cloud.scale.set(4,2+puff%2,2.8);cloud.updateMatrix();clouds.setMatrixAt(i*4+puff,cloud.matrix);
    }
    this.skyGroup.add(clouds);
    const stars:number[]=[];for(let i=0;i<config.sky.stars;i++){
      const angle=i*2.39996,height=.12+(i/config.sky.stars)*.85,radius=Math.sqrt(1-height*height)*config.sky.starRadius;
      stars.push(Math.cos(angle)*radius,height*config.sky.starRadius,Math.sin(angle)*radius);
    }
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));this.skyGroup.add(new THREE.Points(starGeometry,this.starMaterial));scene.add(this.skyGroup);
  }
  update(position:THREE.Vector3,dt:number) {
    const {base,weights}=biomeWeights(position), sky=new THREE.Color(config.atmosphere.sky).multiplyScalar(base),light=new THREE.Color(config.atmosphere.sunColor).multiplyScalar(base);
    let fog=config.atmosphere.fog*base,ambient=config.atmosphere.ambient*base;
    for(const b of weights){sky.add(new THREE.Color(b.biome.sky).multiplyScalar(b.weight));light.add(new THREE.Color(b.biome.light).multiplyScalar(b.weight));fog+=b.biome.fog*b.weight;ambient+=b.biome.ambient*b.weight;}
    const alpha=damping(config.atmosphere.smoothing,dt);(this.scene.background as THREE.Color).lerp(sky,alpha);
    const lunar=weights.find(b=>b.landmark.biome==='lunar')?.weight??0;
    this.cloudMaterial.opacity=THREE.MathUtils.lerp(this.cloudMaterial.opacity,(1-lunar)*.85,alpha);this.starMaterial.opacity=THREE.MathUtils.lerp(this.starMaterial.opacity,lunar,alpha);
    this.skyGroup.position.set(position.x,0,position.z);if(!config.animation.reducedMotion)this.skyGroup.rotation.y+=dt*config.sky.cloudDrift*.01;
    const sceneFog=this.scene.fog as THREE.FogExp2;sceneFog.color.copy(this.scene.background as THREE.Color);sceneFog.density=THREE.MathUtils.lerp(sceneFog.density,fog,alpha);
    this.ambient.intensity=THREE.MathUtils.lerp(this.ambient.intensity,ambient,alpha);this.ambient.color.lerp(sky,alpha);this.sun.color.lerp(light,alpha);
    this.sun.position.set(position.x+20,35,position.z+18);this.sun.target.position.copy(position);
    return weights.reduce((a,b)=>a.weight>b.weight?a:b);
  }
}
