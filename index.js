import * as THREE from "three";
import { getArt } from "./getart.js";
import { FirstPersonControls } from "./firstperson.js";

let scene, renderer, camera;
let angle = 0;
const radius = 40;
const centerY = 20;
const rotationSpeed = 0.002;
let controls;
let imageMeshes = [];
let frameCount = 0;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#C4D6B0");

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // create our camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(20, 0, 20);
  camera.lookAt(0, 0, 0);

  // add orbit controls so we can navigate our scene while testing
  // controls = new OrbitControls(camera, myRenderer.domElement);
  controls = new FirstPersonControls(scene, camera, renderer);
  // add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(10, 70, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  //defines the boundaries of the shadow camera’s frustum (viewing box of shadows).
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;

  // addArtwork();
  addArtworkToSpace();

  // texture loader
  let textureLoader = new THREE.TextureLoader();
  // Load background textures
  // let bgtexture = textureLoader.load(
  //   "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_NorwayForest_2K_hdri_sphere_tone.jpg?v=1739813233155"
  // );
  // bgtexture.mapping = THREE.EquirectangularReflectionMapping;
  // scene.background = bgtexture;
  // Load floor textures
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
  // Set floor texture properties
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  heightMap.wrapS = heightMap.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(5, 5);
  normalMap.repeat.set(5, 5);
  roughnessMap.repeat.set(5, 5);
  heightMap.repeat.set(5, 5);

  //create floor
  const floorGeometry = new THREE.CylinderGeometry(50, 50, 5, 64);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: "#DBBEA1",
    map: floorTexture,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    displacementMap: heightMap,
    displacementScale: 2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -5, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  //create ceiling
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 50, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 30, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const extrudeSettings = { depth: 2, bevelEnabled: false, curveSegments: 64 };
  const extrudedGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#FF993A" });
  const ceiling = new THREE.Mesh(extrudedGeometry, ceilingMaterial);
  ceiling.rotateX(-Math.PI / 2);
  ceiling.position.set(0, 15, 0);
  ceiling.castShadow = true;
  scene.add(ceiling);
  const columnCount = 7;
  const columnHeight = 20;
  const columnRadius = 45;
  let columns = [];

  // Create columns
  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const x = columnRadius * Math.cos(angle);
    const z = columnRadius * Math.sin(angle);

    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: "#FF993A" });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2 - 5, z);
    column.castShadow = true;
    scene.add(column);

    columns.push({ x, z }); // Store column positions
  }

  // Add ceiling lights between columns
  for (let i = 0; i < columnCount; i++) {
    const nextIndex = (i + 1) % columnCount;

    // Compute the midpoint between two adjacent columns
    const midX = (columns[i].x + columns[nextIndex].x) / 2;
    const midZ = (columns[i].z + columns[nextIndex].z) / 2;
    const lightHeight = 18; // Adjust light height

    const ceilingLight = new THREE.DirectionalLight(0xffffff, 1);
    ceilingLight.position.set(midX, lightHeight, midZ);
    ceilingLight.target.position.set(midX, 0, midZ); // Point towards the center
    ceilingLight.castShadow = true;

    // Improve shadow quality
    ceilingLight.shadow.mapSize.width = 2048;
    ceilingLight.shadow.mapSize.height = 2048;
    ceilingLight.shadow.camera.near = 0.5;
    ceilingLight.shadow.camera.far = 100;

    scene.add(ceilingLight);
    scene.add(ceilingLight.target);
  }

  draw();
}

let artworkGroup = new THREE.Group(); // Create a group for rotating the artworks

async function addArtworkToSpace() {
  let artData = await getArt("horse", 7); // Get 7 images (one per midpoint)

  const columnCount = 7;
  const columnRadius = 40;
  const sphereRadius = 5; // Adjust as needed

  for (let i = 0; i < columnCount; i++) {
    let angle1 = (i / columnCount) * Math.PI * 2;
    let angle2 = ((i + 1) / columnCount) * Math.PI * 2; // Next column angle

    // Calculate midpoints between columns
    let midX =
      (columnRadius * Math.cos(angle1) + columnRadius * Math.cos(angle2)) / 2;
    let midZ =
      (columnRadius * Math.sin(angle1) + columnRadius * Math.sin(angle2)) / 2;

    let imageData = artData[i]; // Get corresponding image data
    let myImageTex = new THREE.TextureLoader().load(imageData.imageUrl);
    let myMat = new THREE.MeshBasicMaterial({ map: myImageTex });
    let geo = new THREE.SphereGeometry(sphereRadius, 32, 16);
    let sphere = new THREE.Mesh(geo, myMat);

    sphere.position.set(midX, 5, midZ); // Adjust height as needed
    artworkGroup.add(sphere); // Add the sphere to the group
  }

  scene.add(artworkGroup); // Add the group to the scene
}

function draw() {
  controls.update();
  frameCount++;

  // Rotate the whole group of artworks around the Y-axis
  artworkGroup.rotation.y += rotationSpeed;

  renderer.render(scene, camera);
  window.requestAnimationFrame(draw);
}

init();
