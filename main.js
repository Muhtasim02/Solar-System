import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================
   SETUP
========================= */

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 80, 180);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* =========================
   LIGHT
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
scene.add(new THREE.PointLight(0xffffff, 5, 2000));

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

/* =========================
   STATE
========================= */

let paused = false;
let selected = null;

/* =========================
   PLANETS DATA
========================= */

const planetsData = [
{ name:"Mercury", a:0.39, P:88, size:1.5 },
{ name:"Venus", a:0.72, P:225, size:2.5 },
{ name:"Earth", a:1, P:365, size:2.8 },
{ name:"Mars", a:1.52, P:687, size:2 },
{ name:"Jupiter", a:5.2, P:4333, size:6 },
{ name:"Saturn", a:9.5, P:10759, size:5 },
{ name:"Uranus", a:19.2, P:30687, size:4 },
{ name:"Neptune", a:30.1, P:60190, size:4 }
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
   ORBIT LINES
========================= */

function orbitLine(r){

    const pts = [];

    for(let i=0;i<128;i++){

        const a = (i/128)*Math.PI*2;

        pts.push(new THREE.Vector3(
            Math.cos(a)*r,
            0,
            Math.sin(a)*r
        ));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);

    const mat = new THREE.LineBasicMaterial({
        color:0xffffff,
        opacity:0.2,
        transparent:true
    });

    scene.add(new THREE.Line(geo,mat));
}

/* =========================
   PLANETS
========================= */

const planets = [];

function createPlanet(p){

    const orbitR = p.a * 40;

    orbitLine(orbitR);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.size,32,32),
        new THREE.MeshStandardMaterial({
            map: tex(p.name.toLowerCase()+".jpg")
        })
    );

    mesh.userData = p;

    mesh.position.x = orbitR;
    mesh.position.z = 0;

    scene.add(mesh);

    planets.push({
        mesh,
        orbitR,
        angle: Math.random()*Math.PI*2,
        speed: (0.5 / p.P) * 200 // 🔥 FIXED FAST SPEED
    });

    const btn = document.createElement("button");
    btn.innerText = p.name;
    btn.className = "planetBtn";
    btn.onclick = ()=>focus(mesh);

    planetList.appendChild(btn);
}

/* =========================
   BUILD
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

    if(hits.length) focus(hits[0].object);
});

/* =========================
   FOCUS
========================= */

function focus(mesh){

    if(selected === mesh){
        selected = null;
        paused = false;
        return;
    }

    selected = mesh;
    paused = true;

    const pos = mesh.position;

    camera.position.set(pos.x+30, pos.y+20, pos.z+30);
    controls.target.copy(pos);
}

/* =========================
   ANIMATE (FIXED + FAST)
========================= */

function animate(){

    requestAnimationFrame(animate);

    if(!paused){

        planets.forEach(p=>{

            p.angle += p.speed; // 🔥 FAST MOVEMENT FIX
