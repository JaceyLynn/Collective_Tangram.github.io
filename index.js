import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, renderer, camera;
let angle = 0;
const radius = 40;
const centerY = 20;
const rotationSpeed = 0.005;
let octahedron;
let modelData = null; // Store the single model's data

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#DB7F67");

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(50, 10, 0);

  let controls = new OrbitControls(camera, renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(10, 40, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  let textureLoader = new THREE.TextureLoader();
  let bgtexture = textureLoader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_NorwayForest_2K_hdri_sphere_tone.jpg?v=1739813233155"
  );
  bgtexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgtexture;

  const floorGeometry = new THREE.CylinderGeometry(50, 50, 5, 64);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: "#3F292B" });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const shape = new THREE.Shape();
  shape.absarc(0, 0, 50, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 30, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const extrudeSettings = { depth: 2, bevelEnabled: false, curveSegments: 64 };
  const extrudedGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#DBBEA1" });
  const ceiling = new THREE.Mesh(extrudedGeometry, ceilingMaterial);
  ceiling.rotateX(-Math.PI / 2);
  ceiling.position.set(0, 20, 0);
  ceiling.castShadow = true;
  scene.add(ceiling);

  const columnCount = 7;
  const columnHeight = 20;
  const columnRadius = 45;

  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const x = columnRadius * Math.cos(angle);
    const z = columnRadius * Math.sin(angle);

    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: "#A37B73" });

    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2, z);
    column.castShadow = true;
    scene.add(column);
  }

  // Add octahedron
  const octahedronGeometry = new THREE.OctahedronGeometry(10, 5);
  const octahedronMaterial = new THREE.MeshStandardMaterial({
    color: "#D34F73",
    wireframe: true,
  });

  octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
  octahedron.position.set(0, centerY, 0);
  scene.add(octahedron);

  placeModelInsideFloor();
  animate();
}

function placeModelInsideFloor() {
  const loader = new GLTFLoader();
  
  loader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/girl_g.glb?v=1739812235439",
    function (gltf) {
      let model = gltf.scene;

      // Random initial position inside the floor cylinder (radius 35)
      let angle = Math.random() * Math.PI * 2;
      let radius = Math.random() * 35; // Stay within radius 35
      let x = radius * Math.cos(angle);
      let z = radius * Math.sin(angle);

      model.position.set(x, 5, z);
      model.scale.set(10, 10, 10);
      scene.add(model);

      modelData = {
        mesh: model,
        speedX: (Math.random() - 0.5) * 0.2, // Random X speed
        speedZ: (Math.random() - 0.5) * 0.2, // Random Z speed
      };
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}

function animateModel() {
  if (!modelData) return; // If model isn't loaded yet, skip

  let model = modelData.mesh;

  // Update position with its speed
  model.position.x += modelData.speedX;
  model.position.z += modelData.speedZ;

  // Check boundaries (keep inside the floor cylinder area)
  let distance = Math.sqrt(model.position.x ** 2 + model.position.z ** 2);
  if (distance > 35) {
    let angle = Math.atan2(model.position.z, model.position.x);
    model.position.x = 35 * Math.cos(angle);
    model.position.z = 35 * Math.sin(angle);

    // Change direction after hitting boundary
    modelData.speedX *= -1;
    modelData.speedZ *= -1;
  }
}

let time = 0; // Time variable to control the animation speed

function animate() {
  time += 0.01; // Adjust speed of pulsation

  // Animate octahedron scale
  let scaleFactor = 1 + 0.3 * Math.sin(time); // Scale varies between 0.7 and 1.3
  octahedron.scale.set(scaleFactor, scaleFactor, scaleFactor);

  angle += rotationSpeed;
  camera.position.x = radius * Math.cos(angle);
  camera.position.z = radius * Math.sin(angle);
  camera.lookAt(0, 0, 0);

  animateModel(); // Move model every frame

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();



