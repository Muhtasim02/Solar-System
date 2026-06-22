import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ======================
   SETUP
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
   LIGHTS
====================== */

scene.add(new THREE.AmbientLight(0xffffff, 1.4));

const sunLight = new THREE.PointLight(0xffffff, 4000, 5000);
scene.add(sunLight);

/* ======================
   LOADER
====================== */

const loader = new THREE.TextureLoader();

function tex(file) {
    return loader.load(
        file,
        () => console.log("Loaded:", file),
        undefined,
        () => console.log("FAILED:", file)
    );
}

/* ======================
   UI
====================== */

const planetList = document.getElementById("planetList");
const planetName = document.getElementById("planetName");
const planetData = document.getElementById("planetData");

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
        map: tex("sun.jpg")
    })
);

scene.add(sun);

/* ======================
   PLANETS ARRAY
====================== */

const planets = [];

/* ======================
   CREATE PLANET
====================== */

function createPlanet(name, size, distance, texture, speed) {

    const orbit = new THREE.Object3D();
    scene.add(orbit);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 64, 64),
        new THREE.MeshStandardMaterial({
            map: tex(texture)
        })
    );

    mesh.position.x = distance;

    mesh.userData = { name, distance, speed };

    orbit.add(mesh);

    planets.push({ mesh, orbit, speed });

    /* BUTTON */
    const btn = document.createElement("button");
    btn.innerText = name;
    btn.className = "planetBtn";
    btn.onclick = () => focusPlanet(mesh);

    planetList.appendChild(btn);

    return mesh;
}

/* ======================
   PLANETS
====================== */

createPlanet("Mercury", 1.5, 18, "mercury.jpg", 0.04);
createPlanet("Venus", 2.5, 28, "venus.jpg", 0.02);

const earth = createPlanet("Earth", 2.8, 40, "earth.jpg", 0.01);

createPlanet("Mars", 2, 55, "mars.jpg", 0.008);
createPlanet("Jupiter", 6, 80, "jupiter.jpg", 0.004);

/* ======================
   SATURN + RING
====================== */

const saturn = createPlanet("Saturn", 5, 110, "saturn.jpg", 0.003);

const ringGeo = new THREE.RingGeometry(7, 12, 64);

const ringMat = new THREE.MeshBasicMaterial({
    map: tex("saturn_ring.png"),
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.9
});

const saturnRing = new THREE.Mesh(ringGeo, ringMat);
saturnRing.rotation.x = Math.PI / 2;

saturn.add(saturnRing);

/* ======================
   OUTER PLANETS
====================== */

createPlanet("Uranus", 4, 145, "uranus.jpg", 0.002);
createPlanet("Neptune", 4, 180, "neptune.jpg", 0.001);

/* ======================
   MOON
====================== */

const moonOrbit = new THREE.Object3D();
earth.add(moonOrbit);

const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({
        map: tex("moon.jpg")
    })
);

moon.position.x = 6;
moonOrbit.add(moon);

/* ======================
   STAR FIELD
====================== */

const starGeo = new THREE.BufferGeometry();
const pos = [];

for (let i = 0; i < 12000; i++) {
    pos.push(
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000
    );
}

starGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(pos, 3)
);

scene.add(
    new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ size: 1 })
    )
);

/* ======================
   CLICK SYSTEM
====================== */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (e) => {

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (hits.length) focusPlanet(hits[0].object);
});

/* ======================
   FOCUS PLANET
====================== */

function focusPlanet(mesh) {

    const name = mesh.userData.name;

    planetName.innerText = name;

    planetData.innerHTML = `
        Distance: ${mesh.userData.distance}<br>
        Speed: ${mesh.userData.speed}<br>
        Moons: ${planetInfo[name] || 0}
    `;

    const pos = mesh.getWorldPosition(new THREE.Vector3());

    camera.position.set(pos.x + 20, pos.y + 10, pos.z + 20);
    controls.target.copy(pos);
}

/* ======================
   LOOP
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
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
