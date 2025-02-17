import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, renderer, camera;
let angle = 0;
const radius = 40;
const centerY = 20;
const speed = 0.01;
let octahedron;

function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#DB7F67");

  // Create renderer with shadow support
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // ✅ Enable shadow rendering
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Create the Perspective Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(50, 10, 0);

  // Add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  // Add directional light with shadow properties
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(10, 40, 10);
  directionalLight.castShadow = true; // ✅ Enable shadows

  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;

  scene.add(directionalLight);

    // Create texture loader
  let textureLoader = new THREE.TextureLoader();

  let bgtexture= textureLoader.load('https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_HDRPanorama061_Forest_A_2K_hdri_sphere_tone.jpg?v=1739769817729')
  bgtexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background =bgtexture;
  
  // Load plane textures
  let floorTexture = textureLoader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_Tiles_Floor2_1.6x1.6_1K_albedo.png?v=1739769467095"
  );
  let normalMap = textureLoader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_Tiles_Floor2_1.6x1.6_1K_normal.png?v=1739769474048"
  );
  let roughnessMap = textureLoader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_Tiles_Floor2_1.6x1.6_1K_roughness.png?v=1739769470487"
  );
  let heightMap = textureLoader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_Tiles_Floor2_1.6x1.6_1K_height.png?v=1739769476653"
  );

  // Set texture properties
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  heightMap.wrapS = heightMap.wrapT = THREE.RepeatWrapping;

  floorTexture.repeat.set(10, 10);
  normalMap.repeat.set(10, 10);
  roughnessMap.repeat.set(10, 10);
  heightMap.repeat.set(10, 10);
  
  // Add a floor that receives shadows
  const floorGeometry = new THREE.CylinderGeometry(50, 50, 5, 64);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: "#3F292B",
        map: floorTexture,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    displacementMap: heightMap,
    displacementScale: 2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true; // ✅ Floor receives shadows
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

  // Add columns that cast shadows
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
    column.castShadow = true; // ✅ Columns cast shadows
    column.receiveShadow = true;

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

  placeOctahedronsNearColumns();
  animate();
}

function createOctahedronMesh(position) {
  const octahedronGeometry = new THREE.OctahedronGeometry(5, 0); // Size 5, Detail 0
  const octahedronMaterial = new THREE.MeshStandardMaterial({ color: 0xff5733 });
  const octahedronMesh = new THREE.Mesh(octahedronGeometry, octahedronMaterial);

  octahedronMesh.position.set(position.x, position.y, position.z);

  scene.add(octahedronMesh);
}

// Function to randomly select two columns and place octahedrons nearby
function placeOctahedronsNearColumns() {
  const placedIndices = new Set(); // Ensure unique column selection

  while (placedIndices.size < 2) {
    let randomIndex = Math.floor(Math.random() * 10); // Choose a random column index
    if (!placedIndices.has(randomIndex)) {
      placedIndices.add(randomIndex);
    }
  }

  placedIndices.forEach(index => {
    const angle = (index / 10) * Math.PI * 2; // Calculate angle based on index
    const columnX = 40 * Math.cos(angle); // Column position (same radius)
    const columnZ = 40 * Math.sin(angle);

    // Slightly offset octahedron position from the column
    const offsetX = (Math.random() - 0.5) * 5; // Small random offset
    const offsetZ = (Math.random() - 0.5) * 5;

    const octahedronPosition = {
      x: columnX + offsetX,
      y: 10, // Adjust height to be visible
      z: columnZ + offsetZ
    };

    createOctahedronMesh(octahedronPosition);
  });
}


// Animation loop
function animate() {
  angle += speed;
  camera.position.x = radius * Math.cos(angle);
  camera.position.z = radius * Math.sin(angle);
  camera.lookAt(0, centerY, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Start the scene
init();

