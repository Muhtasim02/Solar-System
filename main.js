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
let selected = null;

/* =========================
   REAL PLANET DATA
========================= */

const planetsData = [
{ name:"Mercury", a:0.39, P:88, size:1.5, tilt:0.03 },
{ name:"Venus",   a:0.72, P:225, size:2.5, tilt:0.02 },
{ name:"Earth",   a:1.0,  P:365, size:2.8, tilt:0.01 },
{ name:"Mars",    a:1.52, P:687, size:2,   tilt:0.04 },
{ name:"Jupiter", a:5.2,  P:4333,size:6,   tilt:0.01 },
{ name:"Saturn",  a:9.5,  P:10759,size:5,  tilt:0.05 },
{ name:"Uranus",  a:19.2, P:30687,size:4,  tilt:0.09 },
{ name:"Neptune", a:30.1, P:60190,size:4,  tilt:0.03 }
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

        points.push(new THREE.Vector3(
            Math.cos(a)*radius,
            Math.sin(a)*Math.sin(tilt)*radius*0.12,
            Math.sin(a)*radius
        ));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
        color:0xffffff,
        opacity:0.15,
        transparent:true
    });

    scene.add(new THREE.Line(geo,mat));
}

/* =========================
   REALISTIC TIME SYSTEM (FIXED)
========================= */

const clock = new THREE.Clock();

/* THIS is the key fix */
const timeScale = 0.00005;

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

    /* initial angle */
    p.angle = Math.random() * Math.PI * 2;

    mesh.position.x = Math.cos(p.angle) * orbitRadius;
    mesh.position.z = Math.sin(p.angle) * orbitRadius;

    mesh.userData = p;

    orbit.add(mesh);
    planets.push({mesh, orbit, p});

    const btn = document.createElement("button");
    btn.innerText = p.name;
    btn.className = "planetBtn";
    btn.onclick = () => focusPlanet(mesh);

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
        planetData.innerHTML = "Running smoothly";
        return;
    }

    selected = mesh;
    paused = true;

    planetName.innerText = p.name;
    planetData.innerHTML = `
        Planet: ${p.name}<br>
        Orbit Period: ${p.P} days
    `;

    const pos = mesh.getWorldPosition(new THREE.Vector3());

    camera.position.set(pos.x+30,pos.y+20,pos.z+30);
    controls.target.copy(pos);
}

/* =========================
   ANIMATION LOOP (FIXED MOTION)
========================= */

function animate(){

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if(!paused){

        planets.forEach(obj=>{

            const p = obj.p;
            const mesh = obj.mesh;
            const r = p.a * 40;

            /* REAL MOTION FIX */
            p.angle += timeScale * delta * (365 / p.P);

            mesh.position.x = Math.cos(p.angle) * r;
            mesh.position.z = Math.sin(p.angle) * r;

            mesh.rotation.y += 0.002;
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
