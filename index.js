import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
let scene, renderer, camera;
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

function init() {
  // create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(200,100,200)");

  // create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create a Perspective Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(60, 30, 0); // Start at radius with some height

// Define animation parameters
let angle = 0;
const radius = 40; // Match column radius
const centerY = 20; // Adjust height if needed
const speed = 0.01; // Speed of rotation
  // // create our camera
  // camera = new THREE.PerspectiveCamera(
  //   60,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   1000
  // );
  // camera.position.set(0, 0, 10);

  // add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);

  // Add ambient lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(-5, 10, 7);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  directionalLight.shadow.mapSize.width = 512; // default
  directionalLight.shadow.mapSize.height = 512; // default
  directionalLight.shadow.camera.near = 0.5; // default
  directionalLight.shadow.camera.far = 500; // default

// Add a scaled-up and smoother floor
const cylinderGeometry3 = new THREE.CylinderGeometry(50, 50, 5, 64); // Increased segments
const cylinderMaterial3 = new THREE.MeshStandardMaterial({
  color: "#27187E",
  roughness: 0,
});
const cylinder3 = new THREE.Mesh(cylinderGeometry3, cylinderMaterial3);
cylinder3.position.set(0, 0, 0);
cylinder3.castShadow = true;

scene.add(cylinder3);

// Add a scaled-up and smoother ceiling
const shape = new THREE.Shape();

// Create outer ring shape with more segments
shape.absarc(0, 0, 50, 0, Math.PI * 2, false, 64); // More segments

// Create inner hole with more segments
const hole = new THREE.Path();
hole.absarc(0, 0, 30, 0, Math.PI * 2, true, 64); // More segments
shape.holes.push(hole);

// Define extrusion settings
const extrudeSettings = {
  depth: 2, // Adjust thickness
  bevelEnabled: false,
  curveSegments: 64, // More segments for smoothness
};

// Create extruded geometry
const extrudedGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

// Create material
const material = new THREE.MeshLambertMaterial({
  color: "#FFFFFF",
  emissive: "#8A8A8A",
});

// Create mesh
const extrudedRing = new THREE.Mesh(extrudedGeometry, material);
extrudedRing.rotateX(-Math.PI / 2);
extrudedRing.position.set(0, 20, 0); // Adjust position for scaling

// Add to scene
scene.add(extrudedRing);

// Add smoother columns
const columnCount = 10;
const columnHeight = 20; // Scale height up
const radius = 40; // Move columns outward

for (let i = 0; i < columnCount; i++) {
  const angle = (i / columnCount) * Math.PI * 2; // Distribute evenly around circle
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);

  const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64); // Increased segments for smoothness
  const columnMaterial = new THREE.MeshStandardMaterial({
    color: "#FFD700",
    roughness: 0.3,
  });

  const column = new THREE.Mesh(columnGeometry, columnMaterial);
  column.position.set(x, columnHeight / 2, z); // Adjust height to sit between floor and ceiling
  column.castShadow = true;
  column.receiveShadow = true;

  scene.add(column);
}




  

  //   // Add ceiling
  //   const ringgeometry = new THREE.RingGeometry( 1, 5, 32 );
  //   const ringMaterial = new THREE.MeshLambertMaterial({
  //     color: "#FFFFFF",
  //     emissive: "#8A8A8A",
  //   });
  //   const ceiling = new THREE.Mesh(ringgeometry, ringMaterial);
  //   ceiling.rotateX(-3.14/2);
  //   ceiling.position.set(0,3, 0);
  //   scene.add(ceiling);

  draw();
}

function animateCamera() {
  requestAnimationFrame(animateCamera);

  // Update camera position in a circular path
  angle += speed;
  camera.position.x = radius * Math.cos(angle);
  camera.position.z = radius * Math.sin(angle);

  // Keep the camera looking at the center
  camera.lookAt(0, centerY, 0);

  renderer.render(scene, camera);
}

// Start Animation
animateCamera();
function draw() {
  renderer.render(scene, camera);
requestAnimationFrame(animateCamera);
  // ask the browser to render another frame when it is ready
  window.requestAnimationFrame(draw);
}
// get everything going by calling init
init();
