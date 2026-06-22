import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================
   SCENE
========================= */

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.002);

/* =========================
   CAMERA
========================= */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 60, 160);

/* =========================
   RENDERER
========================= */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

/* =========================
   CONTROLS
========================= */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/* =========================
   LIGHTING
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sunLight = new THREE.PointLight(0xffffff, 5, 500);
scene.add(sunLight);

/* =========================
   TEXTURES
========================= */

const loader = new THREE.TextureLoader();

function tex(file){
    return loader.load(file);
}

/* =========================
   UI
========================= */

const planetList = document.getElementById("planetList");
const planetName = document.getElementById("planetName");
const planetData = document.getElementById("planetData");
const infoBox = document.getElementById("infoBox");

/* =========================
   STATE
========================= */

let paused = false;
let selectedPlanet = null;

/* =========================
   PLANET DATA
========================= */

const planetInfo = {
    Mercury:{c:"#aaa",d:"Ancient times",t:"167°C",y:"88 days",m:0},
    Venus:{c:"#d4a373",d:"Ancient times",t:"464°C",y:"225 days",m:0},
    Earth:{c:"#4dabf7",d:"Home planet",t:"15°C",y:"365 days",m:1},
    Mars:{c:"#ff6b4a",d:"Ancient times",t:"-63°C",y:"687 days",m:2},
    Jupiter:{c:"#f4a261",d:"Ancient times",t:"-145°C",y:"11.8 years",m:95},
    Saturn:{c:"#ffd166",d:"Ancient times",t:"-178°C",y:"29.4 years",m:146},
    Uranus:{c:"#90e0ef",d:"1781",t:"-224°C",y:"84 years",m:27},
    Neptune:{c:"#4361ee",d:"1846",t:"-214°C",y:"165 years",m:14}
};

/* =========================
   SUN (GLOW EFFECT)
========================= */

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(12,64,64),
    new THREE.MeshBasicMaterial({
        map: tex("sun.jpg")
    })
);

scene.add(sun);

/* Sun glow light */
const sunGlow = new THREE.PointLight(0xffaa00, 2, 800);
scene.add(sunGlow);

/* =========================
   ORBIT PATH (CINEMATIC)
========================= */

function createOrbit(radius, tilt=0){

    const points = [];

    for(let i=0;i<=256;i++){

        const angle = (i/256)*Math.PI*2;

        const x = Math.cos(angle)*radius;
        const z = Math.sin(angle)*radius;

        const y = Math.sin(tilt)*Math.sin(angle)*radius*0.12;

        points.push(new THREE.Vector3(x,y,z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
        color:0xffffff,
        transparent:true,
        opacity:0.18
    });

    const line = new THREE.Line(geo,mat);
    scene.add(line);
}

/* =========================
   PLANETS
========================= */

const planets = [];

function createPlanet(name,size,dist,texture,speed,tilt){

    const orbit = new THREE.Object3D();
    scene.add(orbit);

    createOrbit(dist,tilt);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size,64,64),
        new THREE.MeshStandardMaterial({
            map: tex(texture)
        })
    );

    mesh.position.x = dist;
    mesh.userData = {name,dist,speed};

    orbit.add(mesh);
    planets.push({mesh,orbit,speed});

    const btn = document.createElement("button");
    btn.innerText = name;
    btn.className = "planetBtn";
    btn.onclick = ()=>focusPlanet(mesh);

    planetList.appendChild(btn);

    return mesh;
}

/* =========================
   CREATE SYSTEM
========================= */

createPlanet("Mercury",1.5,18,"mercury.jpg",0.04,0.03);
createPlanet("Venus",2.5,28,"venus.jpg",0.02,0.02);

const earth = createPlanet("Earth",2.8,40,"earth.jpg",0.01,0.01);

createPlanet("Mars",2,55,"mars.jpg",0.008,0.04);
createPlanet("Jupiter",6,80,"jupiter.jpg",0.004,0.01);

const saturn = createPlanet("Saturn",5,110,"saturn.jpg",0.003,0.05);

createPlanet("Uranus",4,145,"uranus.jpg",0.002,0.09);
createPlanet("Neptune",4,180,"neptune.jpg",0.001,0.03);

/* =========================
   SATURN RING
========================= */

const ring = new THREE.Mesh(
    new THREE.RingGeometry(7,12,64),
    new THREE.MeshBasicMaterial({
        map: tex("saturn_ring.png"),
        transparent:true,
        side:THREE.DoubleSide
    })
);

ring.rotation.x = Math.PI/2;
saturn.add(ring);

/* =========================
   MOON
========================= */

const moonOrbit = new THREE.Object3D();
earth.add(moonOrbit);

const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.8,32,32),
    new THREE.MeshStandardMaterial({
        map: tex("moon.jpg")
    })
);

moon.position.x = 6;
moonOrbit.add(moon);

/* =========================
   CLICK SYSTEM
========================= */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click",(e)=>{

    mouse.x=(e.clientX/window.innerWidth)*2-1;
    mouse.y=-(e.clientY/window.innerHeight)*2+1;

    raycaster.setFromCamera(mouse,camera);

    const hits = raycaster.intersectObjects(planets.map(p=>p.mesh));

    if(hits.length) focusPlanet(hits[0].object);
});

/* =========================
   CINEMATIC FOCUS ANIMATION
========================= */

function focusPlanet(mesh){

    const name = mesh.userData.name;

    if(selectedPlanet===mesh){

        selectedPlanet=null;
        paused=false;

        planetName.innerText="Solar System";
        planetData.innerHTML="Explore the universe";

        infoBox.style.borderColor="rgba(255,255,255,0.2)";
        return;
    }

    selectedPlanet=mesh;
    paused=true;

    const info=planetInfo[name];

    planetName.innerText=name;

    planetData.innerHTML=`
        <b>Discovered:</b> ${info.d}<br><br>
        <b>Temperature:</b> ${info.t}<br><br>
        <b>Year Length:</b> ${info.y}<br><br>
        <b>Natural Satellites:</b> ${info.m}
    `;

    infoBox.style.borderColor=info.c;

    const target=mesh.getWorldPosition(new THREE.Vector3());

    /* SMOOTH CAMERA MOVE */
    const startPos=camera.position.clone();
    const endPos=new THREE.Vector3(
        target.x+25,
        target.y+12,
        target.z+25
    );

    let t=0;

    function animateCam(){

        if(t<1){
            t+=0.02;

            camera.position.lerpVectors(startPos,endPos,t);
            controls.target.lerp(target,0.08);

            requestAnimationFrame(animateCam);
        }
    }

    animateCam();
}

/* =========================
   LOOP
========================= */

function animate(){

    requestAnimationFrame(animate);

    if(!paused){

        planets.forEach(p=>{
            p.orbit.rotation.y += p.speed;
            p.mesh.rotation.y += 0.005;
        });

        moonOrbit.rotation.y += 0.02;
    }

    controls.update();
    renderer.render(scene,camera);
}

animate();

/* =========================
   RESIZE
========================= */

window.addEventListener("resize",()=>{

    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth,innerHeight);
});
