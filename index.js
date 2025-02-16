import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
let scene, renderer, camera;
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

function init() {
  // create a scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(200,100,200)");
  

  // create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  


  // create our camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,0,10);
  
  
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

const circlegeometry = new THREE.CircleGeometry( 5, 32 ); 
const circlematerial = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const floor = new THREE.Mesh( circlegeometry, circlematerial ); 
  floor.rotateX(-3.14/2);
  floor.position.set(0,0, 0);
  scene.add( floor );

  // Add a short solid cylinder
  const cylinderGeometry3 = new THREE.CylinderGeometry(0.5, 0.5, 4, 32);
  const cylinderMaterial3 = new THREE.MeshStandardMaterial({
    color: "#27187E",
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
    color: "#758BFD",
    metalness: 0.2,
    roughness: 0,
  });
  const glassSphere = new THREE.Mesh(glassGeometry, glassMaterial);
  glassSphere.position.set(-5, -1, -3); // Position the sphere
  glassSphere.castShadow = true;
  scene.add(glassSphere);

  // Add ceiling
  const ringgeometry = new THREE.RingGeometry( 1, 5, 32 ); 
  const ringMaterial = new THREE.MeshLambertMaterial({
    color: "#FFFFFF",
    emissive: "#8A8A8A",
  });
  const ceiling = new THREE.Mesh(ringgeometry, ringMaterial);
  ceiling.rotateX(-3.14/2);
  ceiling.position.set(0,3, 0);
  scene.add(ceiling);

 
  
  draw();
}

function draw(){
  renderer.render(scene,camera);
  
  // ask the browser to render another frame when it is ready
  window.requestAnimationFrame(draw);
}
// get everything going by calling init
init();