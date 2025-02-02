import * as THREE from "three";

let scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(255,200,255)");

let camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
 camera.position.set(0, 0, 30); // Position camera on the positive Z-axis, looking towards the origin
 camera.lookAt(0, 0, 0); // Ensure the camera is looking directly at the scene center

let renderer = new THREE.WebGLRenderer();
renderer.setSize(400, 400);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Cone Geometry (Speckled)
const coneGeometry = new THREE.ConeGeometry(2,8, 32);
const coneMaterial = new THREE.MeshStandardMaterial({
  color: 0x90caf9,
  roughness: 0.7,
});
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(-2, 2, 0);
cone.castShadow = true;
coneGeometry.rotateX(-2);
coneGeometry.rotateZ(7);
scene.add(cone);

// Large Sphere (Textured)
const sphereGeometry = new THREE.SphereGeometry(8, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(5, -1, -10);
sphere.castShadow = true;
scene.add(sphere);

// Wooden Cylinder
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5,30, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d6e63,
  roughness: 1,
});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(5, 0, -20);
cylinder.rotation.z = Math.PI / 4;
cylinder.castShadow = true;
cylinderGeometry.rotateX(0);
cylinderGeometry.rotateZ(-30);
scene.add(cylinder);

// Wooden Cylinder
const cylinderGeometry2 = new THREE.CylinderGeometry(1.5, 1.5,0.5, 32);
const cylinderMaterial2 = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4,
  roughness: 0.1,
});
const cylinder2 = new THREE.Mesh(cylinderGeometry2, cylinderMaterial2);
cylinder2.position.set(0, -5, 15);
cylinder2.rotation.z = Math.PI / 4;
cylinder2.castShadow = true;
cylinderGeometry2.rotateX(1);
cylinderGeometry2.rotateZ(-4);
scene.add(cylinder2);

// Transparent Glass Sphere
const glassGeometry = new THREE.SphereGeometry(1, 32, 32);
const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 1,
  roughness: 0.2,
});
const glassSphere = new THREE.Mesh(glassGeometry, glassMaterial);
glassSphere.position.set(-5, -1, -3);
glassSphere.castShadow = true;
scene.add(glassSphere);

const geometry = new THREE.TorusGeometry(5,0.2, 16, 100 ); 
const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 1,
  roughness: 0.2,
});
const torus = new THREE.Mesh( geometry, ringMaterial ); 
geometry.rotateX(-2);
geometry.rotateZ(10);
torus.position.set(1, -2, 10);
scene.add( torus );

// Define Vertices and Indices for a Tetrahedron (or custom shape)
const vertices = [
  1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1 // Example vertices
];

const indices = [
  2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1 // Example faces
];

// Create PolyhedronGeometry
const polyhedronGeometry = new THREE.PolyhedronGeometry(vertices, indices, 1.5, 2);
const polyhedronMaterial = new THREE.MeshStandardMaterial({
  color: 0xffb74d,
  metalness: 0.3,
  roughness: 0.7,
});
const polyhedron = new THREE.Mesh(polyhedronGeometry, polyhedronMaterial);
polyhedron.position.set(7, 10, -2);
polyhedron.castShadow = true;
scene.add(polyhedron);


// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
