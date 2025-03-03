import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer;
let myModels = new Map(); // Store models and their default colors
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

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
  camera.position.set(5, 5, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let controls = new OrbitControls(camera, renderer.domElement);
  let gridHelper = new THREE.GridHelper(25, 25);
  scene.add(gridHelper);

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

   // Load each model from the list
  const loader = new GLTFLoader();
  modelLinks.forEach((link, index) => {
    loader.load(link, (gltf) => {
      let model = gltf.scene;
      model.position.set(0, 0, 0); // Spread models out along x-axis
      model.scale.set(1, 1, 1);
      scene.add(model);

      // Assign default colors
      let defaultColor = index === 0 ? "gray" : rainbowColors[index - 1];
      myModels.set(model, defaultColor); // Store model and its default color

      model.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({ color: defaultColor });
        }
      });
    });
  });

  document.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  document.addEventListener("click", () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;

      // Find the highest-level parent (the model itself)
      while (clickedObject.parent && clickedObject.parent !== scene) {
        clickedObject = clickedObject.parent;
      }

      if (myModels.has(clickedObject)) {
        let defaultColor = myModels.get(clickedObject);

        clickedObject.traverse((child) => {
          if (child.isMesh) {
            // Toggle between black and default color
            let currentColor = child.material.color.getHexString();
            child.material.color.set(currentColor === "000000" ? defaultColor : "black");
          }
        });
      }
    }
  });

  loop();
}

function loop() {
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

init();