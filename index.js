import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene, camera, renderer;
let myModels = new Map();
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let pickedObject = null;
let dragging = false;

// Load texture for Model 1
const textureLoader = new THREE.TextureLoader();
const customTexture = textureLoader.load(
  "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"
);

const rainbowColors = ['#D4A29C', '#E8B298', '#FDE8B3', '#BDE1B3', '#B0E1E3', '#97ADF6', '#C6A0D4'];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#404040');

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(50, 500, 50);
  camera.lookAt(0,0,0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 5);
  light.position.set(100, 200, 100);
  light.castShadow = true;
  scene.add(light);

  const geometry1 = new THREE.PlaneGeometry(4000, 4000);
  const material1 = new THREE.MeshBasicMaterial({
    color: '#404040',
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geometry1, material1);
  geometry1.rotateX(Math.PI/2);
  plane.position.set(1000,-30,1000);
  plane.receiveShadow = true;
  scene.add(plane);

    // Add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);
  // Load models
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

  const loader = new GLTFLoader();
  modelLinks.forEach((link, index) => {
    loader.load(link, (gltf) => {
      let model = gltf.scene;
      model.castShadow = true;
      model.traverse((child) => {
        if (child.isMesh) {
          if (index === 0) {
            child.material = new THREE.MeshStandardMaterial({ map: customTexture });
          } else {
            child.material = new THREE.MeshStandardMaterial({ color: rainbowColors[index - 1] });
          }
        }
      });

      scene.add(model);
      myModels.set(model, index === 0 ? 'static' : 'draggable');
    });
  });

  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  animate();
}

function onMouseDown(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    while (clickedObject.parent && clickedObject.parent !== scene) {
      clickedObject = clickedObject.parent;
    }

    if (myModels.get(clickedObject) === 'draggable') {
      pickedObject = clickedObject;
      dragging = true;
    }
  }
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (dragging && pickedObject) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene.children[1], true);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      pickedObject.position.set(point.x, 0, point.z);
    }
  }
}

function onMouseUp() {
  dragging = false;
  pickedObject = null;
}

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
