import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

let scene, renderer, camera;
let angle = 0;
const radius = 40; // Match column radius
const centerY = 20; // Adjust height if needed
const speed = 0.01; // Speed of rotation

function init() {
  // Create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(200,100,200)");

  // Create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create the Perspective Camera (Fix: Remove `const`)
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(30, 10, 30); // Start at radius with some height

  // Add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);

  // Add ambient lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(-5, 10, 7);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

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
  shape.absarc(0, 0, 50, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 30, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const extrudeSettings = {
    depth: 2,
    bevelEnabled: false,
    curveSegments: 64,
  };
  const extrudedGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const material = new THREE.MeshLambertMaterial({
    color: "#FFFFFF",
    emissive: "#8A8A8A",
  });
  const extrudedRing = new THREE.Mesh(extrudedGeometry, material);
  extrudedRing.rotateX(-Math.PI / 2);
  extrudedRing.position.set(0, 20, 0);
  scene.add(extrudedRing);

  // Add smoother columns
  const columnCount = 8;
  const columnHeight = 20;
  const columnradius = 45;

  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const x = columnradius * Math.cos(angle);
    const z = columnradius * Math.sin(angle);

    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64);
    const columnMaterial = new THREE.MeshStandardMaterial({
      color: "#FFD700",
      roughness: 0.3,
    });

    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2, z);
    column.castShadow = true;
    column.receiveShadow = true;

    scene.add(column);
  }

  // Start Animation
  animateCamera();
}

// Function to animate camera movement in a circular path
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

// Start the scene
init();

