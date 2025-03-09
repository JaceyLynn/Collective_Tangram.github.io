import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer;
let myModels = new Map(); // Stores models with their original positions and materials
let mouse = new THREE.Vector2(); // Stores normalized mouse coordinates
let raycaster = new THREE.Raycaster(); // Raycaster for detecting clicks

let pickedObject = null; // Stores the object being moved

// Load texture for Model 1
const textureLoader = new THREE.TextureLoader();
const customTexture = textureLoader.load(
  "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"
); // Replace with your actual texture link
// Define rainbow colors for Models
const rainbowColors = [
  '#D4A29C', '#E8B298', '#FDE8B3', '#BDE1B3', '#B0E1E3', '#97ADF6', '#C6A0D4',
];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#404040');
  // Set up the camera
  let aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(50, 500, 50); // Position the camera
  camera.lookAt(0, 0, 0); // Make the camera look at the origin

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
  directionalLight.position.set(400, 400, 400);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  directionalLight.shadow.mapSize.width = 4000;
  directionalLight.shadow.mapSize.height = 4000;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  //defines the boundaries of the shadow camera’s frustum (viewing box of shadows).
  directionalLight.shadow.camera.left = -1000;
  directionalLight.shadow.camera.right = 1000;
  directionalLight.shadow.camera.top = 1000;
  directionalLight.shadow.camera.bottom = -1000;
  // Add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);
  const geometry1 = new THREE.PlaneGeometry(4000, 4000);
  const material1 = new THREE.MeshBasicMaterial({
    color: '#404040',
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geometry1, material1);
  geometry1.rotateX(Math.PI/2);
  plane.position.set(1000,-10,1000);
  plane.receiveShadow = true;
  scene.add(plane);
  // load model
  const modelLinks = [
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_0.glb?v=1740980628332", // Model 1 (Texture)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_1.glb?v=1740980622181", // Model 2 (Red)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_2.glb?v=1740980636308", // Model 3 (Orange)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_3.glb?v=1740980639282", // Model 4 (Yellow)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_4.glb?v=1740980647077", // Model 5 (Green)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_5.glb?v=1740980651906", // Model 6 (Blue)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_6.glb?v=1740980654436", // Model 7 (Indigo)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_7.glb?v=1740980657856", // Model 8 (Purple)
  ];

  // add model to scene
  const loader = new GLTFLoader();
  modelLinks.forEach((link, index) => {
    loader.load(link, (gltf) => {
      let model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.castShadow = true;
      scene.add(model);

      let originalMaterial;

      model.traverse((child) => {
        if (child.isMesh) {
          if (index === 0) {
            // Apply custom texture
            child.material = new THREE.MeshBasicMaterial({
              map: customTexture,
            });
          } else {
            // Apply rainbow colors
            child.material = new THREE.MeshBasicMaterial({
              color: rainbowColors[index - 1],
            });
          }

          if (!originalMaterial) originalMaterial = child.material.clone(); // Save original material
        }
      });

      // Store model data (original position & material)
      myModels.set(model, {
        position: model.position.clone(),
        material: originalMaterial,
      });
    });
  });

  // Attach event listeners
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("click", onMouseClick);

  animate();
}

// Updates mouse position
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

//toggles color & raises/lowers object
function onMouseClick() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  //Checking for Intersections
  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;

    // Finding the Parent Model, moves up the hierarchy until it finds the topmost parent
    while (clickedObject.parent && clickedObject.parent !== scene) {
      clickedObject = clickedObject.parent;
    }
    //Checking if the Object is in myModels
    if (myModels.has(clickedObject)) {
      //Retrieving Stored Model Data
      let modelData = myModels.get(clickedObject);
      let defaultMaterial = modelData.material;
      let isRaised = clickedObject.position.y > modelData.position.y;

      // Toggle object color
      clickedObject.traverse((child) => {
        if (child.isMesh) {
          let currentColor = child.material.color.getHexString(); // Get color as a string
          let isPink = currentColor.toLowerCase() === "ff7fa3"; // Compare without "#"

          // Toggle between pink and default
          if (isPink) {
            child.material = defaultMaterial;
          } else {
            child.material = new THREE.MeshBasicMaterial({ color: 0xff7fa3 });
          }
        }
      });

      // Toggle Y position (raise or lower)
      if (isRaised) {
        clickedObject.position.y = modelData.position.y;
      } else {
        clickedObject.position.y = modelData.position.y + 100;
      }
    }
  }
}

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
