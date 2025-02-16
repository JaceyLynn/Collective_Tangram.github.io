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

  // create our camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);

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

// Add a scaled-up floor
const cylinderGeometry3 = new THREE.CylinderGeometry(50, 50, 5, 20);
const cylinderMaterial3 = new THREE.MeshStandardMaterial({
  color: "#27187E",
  roughness: 0,
});
const cylinder3 = new THREE.Mesh(cylinderGeometry3, cylinderMaterial3);
cylinder3.position.set(0, 0, 0);
cylinder3.castShadow = true;

scene.add(cylinder3);

// Add a scaled-up ceiling
const shape = new THREE.Shape();

// Create outer ring shape
shape.absarc(0, 0, 50, 0, Math.PI * 2, false);

// Create inner hole
const hole = new THREE.Path();
hole.absarc(0, 0, 30, 0, Math.PI * 2, true);
shape.holes.push(hole);

// Define extrusion settings
const extrudeSettings = {
  depth: 2, // Adjust this for thickness
  bevelEnabled: false,
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
extrudedRing.position.set(0, 20, 0); // Move higher due to 10x scale

// Add to scene
scene.add(extrudedRing);

// Add scaled-up columns
const columnCount = 10;
const columnHeight = 20; // Scale height up
const radius = 40; // Move columns outward

for (let i = 0; i < columnCount; i++) {
  const angle = (i / columnCount) * Math.PI * 2; // Distribute evenly around circle
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);

  const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 16); // Scale up radius
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

  const x = 0, y = 0;

const heartShape = new THREE.Shape();

heartShape.moveTo( x + 5, y + 5 );
heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

const heartgeometry = new THREE.ShapeGeometry( heartShape );
const heartmaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const heartmesh = new THREE.Mesh( heartgeometry, heartmaterial ) ;
scene.add( heartmesh );

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

function draw() {
  renderer.render(scene, camera);

  // ask the browser to render another frame when it is ready
  window.requestAnimationFrame(draw);
}
// get everything going by calling init
init();
