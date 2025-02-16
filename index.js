import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene, renderer, camera;
let angle = 0;
const radius = 40;
const centerY = 20;
const speed = 0.01;
let octahedron, detailLevel;

function init() {
  // Create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#DB7F67");

  // Create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
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

  // Add ambient lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional lighting
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight1.position.set(0, 10, 0);
  directionalLight1.castShadow = true;
  scene.add(directionalLight1);
  // Add directional lighting
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight2.position.set(20, 5, 10);
  directionalLight2.castShadow = true;
  scene.add(directionalLight2);
  const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight3.position.set(10, 5, 20);
  directionalLight3.castShadow = true;
  scene.add(directionalLight3);

  // Add a smoother floor
  const cylinderGeometry3 = new THREE.CylinderGeometry(50, 50, 5, 64);
  const cylinderMaterial3 = new THREE.MeshStandardMaterial({
    color: "#3F292B",
    roughness: 0,
  });
  const cylinder3 = new THREE.Mesh(cylinderGeometry3, cylinderMaterial3);
  cylinder3.position.set(0, 0, 0);
  cylinder3.castShadow = true;
  cylinder3.receiveShadow = true;
  scene.add(cylinder3);

  // Add a smoother ceiling
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 50, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 30, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const extrudeSettings = { depth: 2, bevelEnabled: false, curveSegments: 64 };
  const extrudedGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const material = new THREE.MeshLambertMaterial({
    color: "#DBBEA1",
    emissive: "#DBBEA1",
  });
  const extrudedRing = new THREE.Mesh(extrudedGeometry, material);
  extrudedRing.rotateX(-Math.PI / 2);
  extrudedRing.position.set(0, 20, 0);
  extrudedRing.castShadow = true; //default is false
  extrudedRing.receiveShadow = false; //default
  scene.add(extrudedRing);

  // Add smoother columns
  const columnCount = 10;
  const columnHeight = 20;
  const columnradius = 45;

  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const x = columnradius * Math.cos(angle);
    const z = columnradius * Math.sin(angle);

    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64);
    const columnMaterial = new THREE.MeshStandardMaterial({
      color: "#A37B73",
      roughness: 0.3,
    });

    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2, z);
    column.castShadow = true;
    column.receiveShadow = true;

    scene.add(column);
  }

  const octahedronGeometry = new THREE.OctahedronGeometry(10, 5);
  const octahedronMaterial = new THREE.MeshStandardMaterial({
    color: "#D34F73",
    wireframe: true,
  });

  octahedron = new THREE.Mesh(octahedronGeometry, octahedronMaterial);
  octahedron.position.set(0, centerY, 0);

  scene.add(octahedron);
  // Start Animation
  animate();
  placeOctahedronsNearColumns();
}
// Animation loop

function createOctahedronMesh(position) {
  const octahedronGeometry = new THREE.OctahedronGeometry(5, 0); // Size 5, Detail 0
  const octahedronMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5733,
  });
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

  placedIndices.forEach((index) => {
    const angle = (index / 10) * Math.PI * 2; // Calculate angle based on index
    const columnX = 40 * Math.cos(angle); // Column position (same radius)
    const columnZ = 40 * Math.sin(angle);

    // Slightly offset octahedron position from the column
    const offsetX = (Math.random() - 0.5) * 5; // Small random offset
    const offsetZ = (Math.random() - 0.5) * 5;

    const octahedronPosition = {
      x: columnX + offsetX,
      y: 10, // Adjust height to be visible
      z: columnZ + offsetZ,
    };

    createOctahedronMesh(octahedronPosition);
  });
}

// Call function after scene initialization

function animate() {
  // Update camera position in a circular motion
  angle += speed;
  camera.position.x = radius * Math.cos(angle);
  camera.position.z = radius * Math.sin(angle);
  camera.lookAt(0, centerY, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Start the scene
init();
