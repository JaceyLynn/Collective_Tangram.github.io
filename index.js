import * as THREE from 'three';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
 camera.position.set(0, 0, 10); // Position camera on the positive Z-axis, looking towards the origin
 camera.lookAt(0, 0, 0); // Ensure the camera is looking directly at the scene center
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Cone Geometry (Speckled)
const coneGeometry = new THREE.ConeGeometry(1, 3, 32);
const coneMaterial = new THREE.MeshStandardMaterial({
  color: 0x90caf9,
  roughness: 0.7,
});
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(-2, 2, 0);
cone.castShadow = true;
scene.add(cone);

// Large Sphere (Textured)
const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1,
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(2, 1, -1);
sphere.castShadow = true;
scene.add(sphere);

// Metallic Ring
const ringGeometry = new THREE.RingGeometry(1, 1.5, 32);
const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 1,
  roughness: 0.2,
});
const ring = new THREE.Mesh(ringGeometry, ringMaterial);
ring.position.set(0, 0, 0);
ring.rotation.x = Math.PI / 2;
ring.castShadow = true;
scene.add(ring);

// Wooden Cylinder
const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 12, 32);
const cylinderMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d6e63,
  roughness: 1,
});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
cylinder.position.set(1, -3, -1);
cylinder.rotation.z = Math.PI / 4;
cylinder.castShadow = true;
cylinderGeometry.rotateX(0);
cylinderGeometry.rotateZ(-30);
scene.add(cylinder);

// Transparent Glass Sphere
const glassGeometry = new THREE.SphereGeometry(1.2, 32, 32);
const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4,
  roughness: 0.1,
});
const glassSphere = new THREE.Mesh(glassGeometry, glassMaterial);
glassSphere.position.set(-3, -1, 1);
glassSphere.castShadow = true;
scene.add(glassSphere);

const geometry = new THREE.TorusGeometry(4,0.2, 16, 100 ); 
const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 1,
  roughness: 0.2,
});
const torus = new THREE.Mesh( geometry, ringMaterial ); 
geometry.rotateX(-2);
geometry.rotateZ(10);
torus.position.set(1, -2, 0);
scene.add( torus );

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
