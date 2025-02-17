import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, renderer, camera;
let angle = 0;
const radius = 40;
const centerY = 20;
const speed = 0.01;

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

  const loader = new GLTFLoader();
  let model;

  function loadModel(position) {
    loader.load('https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/Cute%20Cartoon%20Character.glb?v=1739771521285', function (gltf) {
      model = gltf.scene;
      model.position.set(position.x, position.y, position.z);
      model.scale.set(2, 2, 2);
      scene.add(model);
    }, undefined, function (error) {
      console.error(error);
    });
  }

  let textureLoader = new THREE.TextureLoader();
  let bgtexture = textureLoader.load('https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_HDRPanorama061_Forest_A_2K_hdri_sphere_tone.jpg?v=1739769817729');
  bgtexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgtexture;

  const floorGeometry = new THREE.CylinderGeometry(50, 50, 5, 64);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: "#3F292B" });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  
    // Create the ceiling that casts shadows
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
  ceiling.castShadow = true; // ✅ Ceiling casts shadows
  scene.add(ceiling);

  const columnCount = 10;
  const columnHeight = 20;
  const columnradius = 45;

  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const x = columnradius * Math.cos(angle);
    const z = columnradius * Math.sin(angle);

    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: "#A37B73" });

    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2, z);
    column.castShadow = true;
    scene.add(column);
  }

  function placeModelsNearColumns() {
    const placedIndices = new Set();
    while (placedIndices.size < 2) {
      let randomIndex = Math.floor(Math.random() * 10);
      if (!placedIndices.has(randomIndex)) {
        placedIndices.add(randomIndex);
      }
    }

    placedIndices.forEach(index => {
      const angle = (index / 10) * Math.PI * 2;
      const columnX = 40 * Math.cos(angle);
      const columnZ = 40 * Math.sin(angle);
      const offsetX = (Math.random() - 0.5) * 5;
      const offsetZ = (Math.random() - 0.5) * 5;

      const modelPosition = {
        x: columnX + offsetX,
        y: 5,
        z: columnZ + offsetZ
      };

      loadModel(modelPosition);
    });
  }

  placeModelsNearColumns();
  animate();
}

function animate() {
  angle += speed;
  camera.position.x = radius * Math.cos(angle);
  camera.position.z = radius * Math.sin(angle);
  camera.lookAt(0, centerY, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();


