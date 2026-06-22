import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ======================
   BASIC SETUP
====================== */

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

/* ======================
   LIGHTING (IMPORTANT)
====================== */

scene.add(new THREE.AmbientLight(0xffffff, 1.3));

const sunLight = new THREE.PointLight(0xffffff, 5000, 5000);
scene.add(sunLight);

/* ======================
   TEXTURE LOADER
====================== */

const loader = new THREE.TextureLoader();

function loadTexture(path) {
    const tex = loader.load(
        path,
        () => console.log("Loaded:", path),
        undefined,
        () => console.log("FAILED:", path)
    );
    return tex;
}

/* ======================
   UI ELEMENTS
====================== */

const planetList = document.getElementById("planetList");
const planetName = document.getElementById("planetName");
const planetData = document.getElementById("planetData");

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* ======================
   PLANET INFO
====================== */

const planetInfo = {
    Mercury: 0,
    Venus: 0,
    Earth: 1,
    Mars: 2,
    Jupiter: 95,
    Saturn: 146,
    Uranus: 27,
    Neptune: 14
};

/* ======================
   SUN
====================== */

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(10, 64, 64),
    new THREE.MeshBasicMaterial({
        map: loadTexture("textures/sun.jpg")
    })
);

scene.add(sun);

/* ======================
   PLANETS ARRAY
====================== */

const planets = [];

/* ======================
   CREATE PLANET FUNCTION
====================== */

function createPlanet(name, size, distance, texture, speed) {

    const orbit = new THREE.Object3D();
    scene.add(orbit);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 64, 64),
        new THREE.MeshStandardMaterial({
            map: loadTexture(texture)
        })
    );

    mesh.position.x = distance;

    mesh.userData = { name, distance, speed };

    orbit.add(mesh);

    planets.push({ mesh, orbit, speed });

    /* UI BUTTON */
    const btn = document.createElement("button");
    btn.className = "planetBtn";
    btn.innerText = name;
    btn.onclick = () => focusPlanet(mesh);

    planetList.appendChild(btn);

    return mesh;
}

/* ======================
   PLANETS
====================== */

createPlanet("Mercury", 1.5, 18, "textures/mercury.jpg", 0.04);
createPlanet("Venus", 2.5, 28, "textures/venus.jpg", 0.02);

const earth = createPlanet("Earth", 2.8, 40, "textures/earth.jpg", 0.01);

createPlanet("Mars", 2, 55, "textures/mars.jpg", 0.008);
createPlanet("Jupiter", 6, 80, "textures/jupiter.jpg", 0.004);

/* ======================
   SATURN + RING (FIXED)
====================== */

const saturn = createPlanet(
    "Saturn",
    5,
    110,
    "textures/saturn.jpg",
    0.003
);

const saturnRingGeo = new THREE.RingGeometry(7, 12, 64);

const saturnRingMat = new THREE.MeshBasicMaterial({
    map: loadTexture("textures/saturn_ring.png"),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
});

const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);

saturnRing.rotation.x = Math.PI / 2;
saturn.add(saturnRing);

/* ======================
   URANUS & NEPTUNE
====================== */

createPlanet("Uranus", 4, 145, "textures/uranus.jpg", 0.002);
createPlanet("Neptune", 4, 180, "textures/neptune.jpg", 0.001);

/* ======================
   MOON (EARTH)
====================== */

const moonOrbit = new THREE.Object3D();
earth.add(moonOrbit);

const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({
        map: loadTexture("textures/moon.jpg")
    })
);

moon.position.x = 6;
moonOrbit.add(moon);

/* ======================
   STAR FIELD
====================== */

const starGeo = new THREE.BufferGeometry();
const starPos = [];

for (let i = 0; i < 12000; i++) {
    starPos.push(
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000
    );
}

starGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPos, 3)
);

scene.add(new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 1 })
));

/* ======================
   CLICK SYSTEM
====================== */

window.addEventListener("click", (e) => {

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (hits.length) {
        focusPlanet(hits[0].object);
    }
});

/* ======================
   FOCUS PLANET
====================== */

function focusPlanet(mesh) {

    const name = mesh.userData.name;

    planetName.innerText = name;

    planetData.innerHTML = `
        Distance: ${mesh.userData.distance}<br>
        Orbit Speed: ${mesh.userData.speed}<br>
        Natural Satellites: ${planetInfo[name] || 0}
    `;

    const pos = mesh.getWorldPosition(new THREE.Vector3());

    camera.position.set(pos.x + 20, pos.y + 10, pos.z + 20);
    controls.target.copy(pos);
}

/* ======================
   ANIMATION LOOP
====================== */

function animate() {

    requestAnimationFrame(animate);

    planets.forEach(p => {
        p.orbit.rotation.y += p.speed;
        p.mesh.rotation.y += 0.01;
    });

    moonOrbit.rotation.y += 0.03;

    controls.update();
    renderer.render(scene, camera);
}

animate();

/* ======================
   RESIZE
====================== */

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});