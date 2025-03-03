import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer;
let myModels = []; // Store models instead of individual meshes
let inactiveMat, activeMat;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

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

  // Materials
  activeMat = new THREE.MeshBasicMaterial({ color: "red" });
  inactiveMat = new THREE.MeshBasicMaterial({ color: "gray" });

  // Array of model URLs
  const modelLinks = [
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_0.glb?v=1740980628332",
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_0.glb?v=1740980628332",
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
      model.position.set(index * 3, 0, 0); // Spread models out along x-axis
      model.scale.set(1, 1, 1);
      scene.add(model);
      myModels.push(model);

      // Apply the inactive material to all meshes inside the model
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = inactiveMat.clone(); // Clone material for independence
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

      if (myModels.includes(clickedObject)) {
        // Reset all models to inactive
        myModels.forEach((model) => {
          model.traverse((child) => {
            if (child.isMesh) {
              child.material.color.set("gray");
            }
          });
        });

        // Set clicked model to active
        clickedObject.traverse((child) => {
          if (child.isMesh) {
            child.material.color.set("red");
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

