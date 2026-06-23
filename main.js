import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================
   BASIC SETUP
========================= */

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0016);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 70, 170);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* =========================
   LIGHTS
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
scene.add(new THREE.PointLight(0xffffff, 4, 1000));

/* =========================
   TEXTURE LOADER
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
let selected = null;

/* =========================
   REAL ORBIT DATA (SIMPLIFIED NASA MODEL)
========================= */

const planetsData = [
{ name:"Mercury", a:0.39, e:0.206, P:88, size:1.5, tilt:0.03, color:"#aaa" },
{ name:"Venus",   a:0.72, e:0.007, P:225, size:2.5, tilt:0.02, color:"#d4a373" },
{ name:"Earth",   a:1.0,  e:0.017, P:365, size:2.8, tilt:0.01, color:"#4dabf7" },
{ name:"Mars",    a:1.52, e:0.093, P:687, size:2,   tilt:0.04, color:"#ff6b4a" },
{ name:"Jupiter", a:5.2,  e:0.048, P:4333,size:6,   tilt:0.01, color:"#f4a261" },
{ name:"Saturn",  a:9.5,  e:0.054, P:10759,size:5,  tilt:0.05, color:"#ffd166" },
{ name:"Uranus",  a:19.2, e:0.047, P:30687,size:4,  tilt:0.09, color:"#90e0ef" },
{ name:"Neptune", a:30.1, e:0.009, P:60190,size:4,  tilt:0.03, color:"#4361ee" }
];

/* =========================
   SUN
========================= */

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(12,64,64),
    new THREE.MeshBasicMaterial({ map: tex("sun.jpg") })
);

scene.add(sun);

/* =========================
   ORBIT PATH
========================= */

function createOrbit(radius, tilt){

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
        opacity:0.12
    });

    scene.add(new THREE.Line(geo,mat));
}

/* =========================
   REAL TIME KEPLER SNAPSHOT
========================= */

function positionAtDate(p){

    const now = new Date();
    const days = now.getTime() / (1000*60*60*24);

    const meanMotion = (2*Math.PI)/p.P;

    const M = (meanMotion * days) % (2*Math.PI);

    const E = M; // simplified solver

    const x = p.a * Math.cos(E) - p.e;
    const z = p.a * Math.sin(E) * Math.sqrt(1 - p.e*p.e);

    return { x, z };
}

/* =========================
   PLANETS
========================= */

const planets = [];

function createPlanet(p){

    const orbitRadius = p.a * 40;

    createOrbit(orbitRadius, p.tilt);

    const orbit = new THREE.Object3D();
    scene.add(orbit);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.size,64,64),
        new THREE.MeshStandardMaterial({
            map: tex(p.name.toLowerCase()+".jpg")
        })
    );

    /* TODAY SNAPSHOT POSITION */
    const pos = positionAtDate(p);

    mesh.position.x = pos.x * 40;
    mesh.position.z = pos.z * 40;

    mesh.userData = p;

    orbit.add(mesh);
    planets.push({mesh,orbit,p});

    const btn = document.createElement("button");
    btn.className = "planetBtn";
    btn.innerText = p.name;
    btn.onclick = ()=>focusPlanet(mesh);

    planetList.appendChild(btn);
}

/* =========================
   BUILD SYSTEM
========================= */

planetsData.forEach(createPlanet);

/* =========================
   CLICK SYSTEM
========================= */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click",(e)=>{

    mouse.x = (e.clientX/window.innerWidth)*2-1;
    mouse.y = -(e.clientY/window.innerHeight)*2+1;

    raycaster.setFromCamera(mouse,camera);

    const hits = raycaster.intersectObjects(planets.map(p=>p.mesh));

    if(hits.length) focusPlanet(hits[0].object);
});

/* =========================
   FOCUS SYSTEM
========================= */

function focusPlanet(mesh){

    const p = mesh.userData;

    if(selected === mesh){
        selected = null;
        paused = false;

        planetName.innerText = "Solar System";
        planetData.innerHTML = "Live system running";
        infoBox.style.borderColor = "rgba(255,255,255,0.2)";
        return;
    }

    selected = mesh;
    paused = true;

    planetName.innerText = p.name;

    planetData.innerHTML = `
        <b>Planet:</b> ${p.name}<br>
        <b>Orbit Period:</b> ${p.P} days<br>
        <b>Size:</b> ${p.size}
    `;

    infoBox.style.borderColor = p.color;

    const pos = mesh.getWorldPosition(new THREE.Vector3());

    camera.position.set(pos.x+30,pos.y+20,pos.z+30);
    controls.target.copy(pos);
}

/* =========================
   ANIMATION LOOP
========================= */

function animate(){

    requestAnimationFrame(animate);

    if(!paused){

        planets.forEach(obj=>{

            const p = obj.p;
            const mesh = obj.mesh;

            const orbitR = p.a * 40;

            const now = new Date().getTime()/100000000;
            const angle = now*(1/p.P)*10;

            mesh.position.x = Math.cos(angle)*orbitR;
            mesh.position.z = Math.sin(angle)*orbitR;
        });
    }

    controls.update();
    renderer.render(scene,camera);
}

animate();

/* =========================
   RESIZE
========================= */

window.addEventListener("resize",()=>{

    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth,innerHeight);
});
