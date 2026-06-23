import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================
   SCENE
========================= */

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0018);

/* =========================
   CAMERA
========================= */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 70, 170);

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

/* =========================
   LIGHTS
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const sunLight = new THREE.PointLight(0xffffff, 4, 1000);
scene.add(sunLight);

/* =========================
   TEXTURES
========================= */

const loader = new THREE.TextureLoader();
const tex = (f) => loader.load(f);

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
   PLANET INFO
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
   SUN
========================= */

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(12,64,64),
    new THREE.MeshBasicMaterial({
        map: tex("sun.jpg")
    })
);

scene.add(sun);

/* =========================
   REAL TIME FUNCTION (KEY PART)
========================= */

function getTimeFactor(speed){

    const now = new Date();

    const seconds =
        now.getUTCFullYear() * 31536000 +
        now.getUTCMonth() * 2629746 +
        now.getUTCDate() * 86400 +
        now.getUTCHours() * 3600 +
        now.getUTCMinutes() * 60 +
        now.getUTCSeconds();

    return seconds * speed;
}

/* =========================
   ORBIT PATH
========================= */

function createOrbit(radius, tilt=0){

    const points = [];

    for(let i=0;i<=256;i++){

        const a = (i/256)*Math.PI*2;

        const x = Math.cos(a)*radius;
        const z = Math.sin(a)*radius;
        const y = Math.sin(a)*Math.sin(tilt)*radius*0.12;

        points.push(new THREE.Vector3(x,y,z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
        color:0xffffff,
        transparent:true,
        opacity:0.15
    });

    scene.add(new THREE.Line(geo,mat));
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

    /* INITIAL POSITION (based on current time) */
    const angle = getTimeFactor(speed);

    mesh.position.x = Math.cos(angle)*dist;
    mesh.position.z = Math.sin(angle)*dist;

    mesh.userData = {name,dist,speed,angle};

    orbit.add(mesh);
    planets.push({mesh,orbit,speed});

    const btn = document.createElement("button");
    btn.className = "planetBtn";
    btn.innerText = name;
    btn.onclick = ()=>focusPlanet(mesh);

    planetList.appendChild(btn);

    return mesh;
}

/* =========================
   PLANETS
========================= */

createPlanet("Mercury",1.5,18,"mercury.jpg",0.0000009,0.03);
createPlanet("Venus",2.5,28,"venus.jpg",0.0000006,0.02);

const earth = createPlanet("Earth",2.8,40,"earth.jpg",0.0000005,0.01);

createPlanet("Mars",2,55,"mars.jpg",0.0000004,0.04);
createPlanet("Jupiter",6,80,"jupiter.jpg",0.0000002,0.01);

const saturn = createPlanet("Saturn",5,110,"saturn.jpg",0.00000015,0.05);

createPlanet("Uranus",4,145,"uranus.jpg",0.0000001,0.09);
createPlanet("Neptune",4,180,"neptune.jpg",0.00000008,0.03);

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
   FOCUS SYSTEM
========================= */

function focusPlanet(mesh){

    const name = mesh.userData.name;

    if(selectedPlanet===mesh){

        selectedPlanet=null;
        paused=false;

        planetName.innerText="Solar System";
        planetData.innerHTML="Live system active";

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
        <b>Year:</b> ${info.y}<br><br>
        <b>Moons:</b> ${info.m}
    `;

    infoBox.style.borderColor=info.c;

    const pos=mesh.getWorldPosition(new THREE.Vector3());

    camera.position.set(pos.x+25,pos.y+15,pos.z+25);
    controls.target.copy(pos);
}

/* =========================
   LOOP (REAL TIME UPDATE)
========================= */

function animate(){

    requestAnimationFrame(animate);

    if(!paused){

        planets.forEach(p=>{

            const m=p.mesh;
            const d=m.userData.dist;

            const angle=getTimeFactor(p.speed);

            m.position.x=Math.cos(angle)*d;
            m.position.z=Math.sin(angle)*d;

            m.rotation.y+=0.002;
        });

        moonOrbit.rotation.y+=0.01;
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
