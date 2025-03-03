import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer;
let myModels = new Map();
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let pickedObject = null; // Stores the object being moved
let plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Ground plane for positioning
let intersection = new THREE.Vector3(); // Stores intersection point

// Load the texture for Model 1
const textureLoader = new THREE.TextureLoader();
const customTexture = textureLoader.load("https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"); // 🔄 Replace with your actual texture link

// Rainbow colors for models 2-8
const rainbowColors = [
  "red",     // Model 2
  "orange",  // Model 3
  "yellow",  // Model 4
  "green",   // Model 5
  "blue",    // Model 6
  "indigo",  // Model 7
  "purple",  // Model 8
];


function init() {
  scene = new THREE.Scene();

  let aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(200, 600, 300);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let controls = new OrbitControls(camera, renderer.domElement);
  
  // Array of model URLs
  const modelLinks = [
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_0.glb?v=1740980628332",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_1.glb?v=1740980622181",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_2.glb?v=1740980636308",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_3.glb?v=1740980639282",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_4.glb?v=1740980647077",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_5.glb?v=1740980651906",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_6.glb?v=1740980654436",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_7.glb?v=1740980657856",
  ];

  const loader = new GLTFLoader();
  modelLinks.forEach((link, index) => {
    loader.load(link, (gltf) => {
      let model = gltf.scene;
      model.position.set(index * 3, 0, 0);
      model.scale.set(1, 1, 1);
      scene.add(model);

      myModels.set(model, model.position.clone()); // Store initial positions

      model.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({ color: "white" });
        }
      });
    });
  });

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("click", onMouseClick);

  loop();
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (pickedObject) {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersection);
    pickedObject.position.copy(intersection);
  }
}

function onMouseClick() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;

    while (clickedObject.parent && clickedObject.parent !== scene) {
      clickedObject = clickedObject.parent;
    }

    if (!pickedObject) {
      pickedObject = clickedObject;
    } else {
      pickedObject = null; // Drop the object
    }
  }
}

function loop() {
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

init();