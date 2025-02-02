import * as THREE from "three";

// Create the scene and set the background color
let scene = new THREE.Scene();
scene.background = new THREE.Color("#FFB35C");

// Set up the camera
let camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
camera.position.set(0, 0, 24); 
camera.lookAt(2.5, -2.5, 0); 

// Set up the renderer
let renderer = new THREE.WebGLRenderer();
renderer.setSize(600, 600);
document.body.appendChild(renderer.domElement);

// Add ambient lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Add directional lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(-5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Add a cone to the scene
const coneGeometry = new THREE.ConeGeometry(2, 8, 32);
const coneMaterial = new THREE.MeshStandardMaterial({
  color: '#FF8600',
  roughness: 0.7, 
});
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(-2, 2, 0); 
cone.castShadow = true;
coneGeometry.rotateX(-2);
coneGeometry.rotateZ(7);
scene.add(cone);

// Add a large sphere
const sphereGeometry = new THREE.SphereGeometry(9, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: '#AEB8FE', 
  roughness: 1, 
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(5, -2, -10); 
sphere.castShadow = true;
scene.add(sphere);

// Add a long cylinder
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 38, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({
  color: '#27187E', 
  roughness: 1, 
});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(4, -1, -20);
cylinder.rotation.z = Math.PI / 4; 
cylinder.castShadow = true;
cylinderGeometry.rotateX(0);
cylinderGeometry.rotateZ(-30);
scene.add(cylinder);

// Add a small transparent glass cylinder
const cylinderGeometry2 = new THREE.CylinderGeometry(1, 1, 0.2, 32);
const cylinderMaterial2 = new THREE.MeshStandardMaterial({
  color: '#FFFFFF', 
  transparent: true,
  opacity: 0.4,
  roughness: 0.1, 
});
const cylinder2 = new THREE.Mesh(cylinderGeometry2, cylinderMaterial2);
cylinder2.position.set(0, -3.5, 15);
cylinder2.rotation.z = Math.PI / 4;
cylinder2.castShadow = true;
cylinderGeometry2.rotateX(1);
cylinderGeometry2.rotateZ(-4);
scene.add(cylinder2);

// Add a short solid cylinder
const cylinderGeometry3 = new THREE.CylinderGeometry(0.5, 0.5, 4, 32);
const cylinderMaterial3 = new THREE.MeshStandardMaterial({
  color: '#27187E', 
  roughness: 0,
});
const cylinder3 = new THREE.Mesh(cylinderGeometry3, cylinderMaterial3);
cylinder3.position.set(4, -3, 10); 
cylinder3.rotation.z = Math.PI / 4;
cylinder3.castShadow = true;
cylinderGeometry3.rotateX(6);
cylinderGeometry3.rotateY(7);
cylinderGeometry3.rotateZ(9);
scene.add(cylinder3);

// Add a transparent glass sphere
const glassGeometry = new THREE.SphereGeometry(1, 32, 32);
const glassMaterial = new THREE.MeshStandardMaterial({
  color: '#758BFD',
  metalness: 0.2,
  roughness: 0, 
});
const glassSphere = new THREE.Mesh(glassGeometry, glassMaterial);
glassSphere.position.set(-5, -1, -3); // Position the sphere
glassSphere.castShadow = true;
scene.add(glassSphere);

// Add a torus ring
const geometry = new THREE.TorusGeometry(5, 0.1, 16, 100);
const ringMaterial = new THREE.MeshStandardMaterial({
  color: '#FFFFFF', 
  metalness: 0.4, 
  roughness: 0, 
});
const torus = new THREE.Mesh(geometry, ringMaterial);
geometry.rotateX(-2);
geometry.rotateZ(10);
torus.position.set(1, -2, 8);
scene.add(torus);

// Add a polyhedron
const vertices = [
  1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1 // Vertex positions
];
const indices = [
  2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1 // Face definitions
];
const polyhedronGeometry = new THREE.PolyhedronGeometry(vertices, indices, 1.5, 2);
const polyhedronMaterial = new THREE.MeshStandardMaterial({
  color: '#FFFFFF', 
  transparent: true,
  opacity: 0.4,
  roughness: 0.1, 
});
const polyhedron = new THREE.Mesh(polyhedronGeometry, polyhedronMaterial);
polyhedron.position.set(7, 8, -2); 
polyhedron.castShadow = true;
scene.add(polyhedron);

// Render the scene
renderer.render(scene, camera);
