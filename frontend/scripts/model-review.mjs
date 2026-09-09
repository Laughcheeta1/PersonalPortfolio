import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1400,height:850}});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  const metrics=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {createLandmark,createCharacter}=await import('/src/world/models.ts');
    const {RoomEnvironment}=await import('/node_modules/three/examples/jsm/environments/RoomEnvironment.js');
    document.body.replaceChildren();document.body.style.background='#edf0e5';
    const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1400,850);renderer.setScissorTest(true);renderer.toneMapping=THREE.ACESFilmicToneMapping;document.body.append(renderer.domElement);
    const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment()).texture;
    const keys=['rocket','jet','network','bouquet','statue','gym','library','panda'];
    return keys.map((key,index)=>{
      const scene=new THREE.Scene();scene.background=new THREE.Color('#e7eddf');scene.environment=environment;scene.environmentIntensity=.5;
      const object=key==='panda'?createCharacter(false):createLandmark(key);scene.add(object);
      const bounds=new THREE.Box3().setFromObject(object),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      const camera=new THREE.PerspectiveCamera(35,350/425,.1,100),extent=Math.max(size.x,size.y,size.z);
      camera.position.copy(center).add(new THREE.Vector3(extent*.75,extent*.48,extent*1.9));camera.lookAt(center);
      scene.add(new THREE.HemisphereLight('#fff4d7','#9fbaa0',2));const light=new THREE.DirectionalLight('#fff2dd',3);light.position.set(5,12,9);scene.add(light);
      renderer.setViewport(index%4*350,Math.floor(index/4)===0?425:0,350,425);renderer.setScissor(index%4*350,Math.floor(index/4)===0?425:0,350,425);renderer.render(scene,camera);
      const label=document.createElement('div');label.textContent=key;label.style.cssText=`position:fixed;left:${index%4*350+18}px;top:${Math.floor(index/4)*425+15}px;font:14px sans-serif;color:#35503f`;document.body.append(label);
      return {key,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};
    });
  });
  await page.screenshot({path:'/tmp/portfolio-model-review.png',timeout:60000});console.log(JSON.stringify(metrics));
}finally{await browser.close();}
