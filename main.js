import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================
   SCENE SETUP
========================= */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 60, 140);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* =========================
   LIGHTS
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 1.4));

const sunLight = new THREE.PointLight(0xffffff, 5000, 5000);
scene.add(sunLight);

/* =========================
   TEXTURE LOADER
========================= */

const loader = new THREE.TextureLoader();

function tex(file){
    return loader.load(file);
}

/* =========================
   UI ELEMENTS
========================= */

const planetList = document.getElementById("planetList");
const planetName = document.getElementById("planetName");
const planetData = document.getElementById("planetData");

/* =========================
   CONTROL FLAGS
========================= */

let paused = false;
let selectedPlanet = null;

/* =========================
   PLANET INFO
========================= */

const planetInfo = {
    Mercury: {color:"#9e9e9e", discovered:"Ancient times", temp:"167°C", year:"88 days", moons:0},
    Venus:   {color:"#d4a373", discovered:"Ancient times", temp:"464°C", year:"225 days", moons:0},
    Earth:   {color:"#2196f3", discovered:"Home planet", temp:"15°C", year:"365 days", moons:1},
    Mars:    {color:"#ff5722", discovered:"Ancient times", temp:"-63°C", year:"687 days", moons:2},
    Jupiter: {color:"#ff9800", discovered:"Ancient times", temp:"-145°C", year:"11.86 years", moons:95},
    Saturn:  {color:"#ffd54f", discovered:"Ancient times", temp:"-178°C", year:"29.4 years", moons:146},
    Uranus:  {color:"#80deea", discovered:"1781", temp:"-224°C", year:"84 years", moons:27},
    Neptune: {color:"#3f51b5", discovered:"1846", temp:"-214°C", year:"165 years", moons:14}
};

/* =========================
   SUN
========================= */

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(10,64,64),
    new THREE.MeshBasicMaterial({ map: tex("sun.jpg") })
);

scene.add(sun);

/* =========================
   PLANETS
========================= */

const planets = [];

function createPlanet(name, size, distance, texture, speed){

    const orbit = new THREE.Object3D();
    scene.add(orbit);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size,64,64),
        new THREE.MeshStandardMaterial({
            map: tex(texture)
        })
    );

    mesh.position.x = distance;
    mesh.userData = {name, distance, speed};

    orbit.add(mesh);
    planets.push({mesh, orbit, speed});

    /* BUTTON */
    const btn = document.createElement("button");
    btn.className = "planetBtn";
    btn.innerText = name;

    btn.onclick = () => focusPlanet(mesh);

    planetList.appendChild(btn);

    return mesh;
}

/* =========================
   CREATE PLANETS
========================= */

createPlanet("Mercury",1.5,18,"mercury.jpg",0.04);
createPlanet("Venus",2.5,28,"venus.jpg",0.02);

const earth = createPlanet("Earth",2.8,40,"earth.jpg",0.01);

createPlanet("Mars",2,55,"mars.jpg",0.008);
createPlanet("Jupiter",6,80,"jupiter.jpg",0.004);
const saturn = createPlanet("Saturn",5,110,"saturn.jpg",0.003);
createPlanet("Uranus",4,145,"uranus.jpg",0.002);
createPlanet("Neptune",4,180,"neptune.jpg",0.001);

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

ring.rotation.x = Math.PI / 2;
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

    mouse.x = (e.clientX/window.innerWidth)*2-1;
    mouse.y = -(e.clientY/window.innerHeight)*2+1;

    raycaster.setFromCamera(mouse,camera);

    const hits = raycaster.intersectObjects(planets.map(p=>p.mesh));

    if(hits.length) focusPlanet(hits[0].object);
});

/* =========================
   FOCUS + TOGGLE SYSTEM
========================= */

function focusPlanet(mesh){

    const name = mesh.userData.name;

    /* TOGGLE OFF */
    if(selectedPlanet === mesh){

        selectedPlanet = null;
        paused = false;

        planetName.innerText = "Solar System";
        planetData.innerHTML = "Click a planet to view details";

        document.getElementById("infoBox").style.borderColor =
        "rgba(255,255,255,0.15)";

        return;
    }

    /* SELECT PLANET */
    selectedPlanet = mesh;
    paused = true;

    const info = planetInfo[name];

    planetName.innerText = name;

    planetData.innerHTML = `
        <b>Discovered:</b> ${info.discovered}<br><br>
        <b>Temperature:</b> ${info.temp}<br><br>
        <b>Year Length:</b> ${info.year}<br><br>
        <b>Natural Satellites:</b> ${info.moons}
    `;

    document.getElementById("infoBox").style.borderColor =
    info.color;

    const pos = mesh.getWorldPosition(new THREE.Vector3());

    camera.position.set(pos.x+20,pos.y+10,pos.z+20);
    controls.target.copy(pos);
}

/* =========================
   ANIMATION LOOP
========================= */

function animate(){

    requestAnimationFrame(animate);

    if(!paused){

        planets.forEach(p=>{
            p.orbit.rotation.y += p.speed;
            p.mesh.rotation.y += 0.01;
        });

        moonOrbit.rotation.y += 0.03;
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
