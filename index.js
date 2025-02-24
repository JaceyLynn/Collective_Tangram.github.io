import * as THREE from "three";
import { getArt } from "./getart.js";
import { FirstPersonControls } from "./firstperson.js";

let scene, renderer, camera;
let angle = 0;
const radius = 40;
const centerY = 20;
const rotationSpeed = 0.005;
let controls;
let imageMeshes = [];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#DB7F67");

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
  camera.position.set(20, 20, 20);
  camera.lookAt(0,0,0)

  // add orbit controls so we can navigate our scene while testing
  // controls = new OrbitControls(camera, myRenderer.domElement);
  controls = new FirstPersonControls(scene, camera, renderer);
  // add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
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
  let bgtexture = textureLoader.load(
    "https://cdn.glitch.global/094f10a3-743b-4134-bdd8-59335ac7f8ed/TCom_NorwayForest_2K_hdri_sphere_tone.jpg?v=1739813233155"
  );
  bgtexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgtexture;
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
  floor.position.set(0, 0, 0);
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
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#F2E863" });
  const ceiling = new THREE.Mesh(extrudedGeometry, ceilingMaterial);
  ceiling.rotateX(-Math.PI / 2);
  ceiling.position.set(0, 20, 0);
  ceiling.castShadow = true;
  scene.add(ceiling);

  //add columns
  const columnCount = 7;
  const columnHeight = 20;
  const columnRadius = 45;
  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const x = columnRadius * Math.cos(angle);
    const z = columnRadius * Math.sin(angle);
    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 64);
    const columnMaterial = new THREE.MeshStandardMaterial({ color: "#F7A072" });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2, z);
    column.castShadow = true;
    scene.add(column);
  }

  animate();
}

async function addArtworkToSpace(){
  let artData = await getArt("horse", 10);
  
  // we should have access to the artData from the API
  console.log(artData,length);
  let count =0;
  //
  for (let i = 0; i < 3; i++){
    for (let j = 0; j < 3; j++){
    count +=1;
      
    let info = artData[count];
     
    let url = info.imageUrl;
    let title = info.title;
    
    console.log(url);
    console.log(title);
      
    // create our image texture
    let myImageTex = new THREE.TextureLoader().load(url);
    let myMat = new THREE.MeshBasicMaterial({map: myImageTex});
    let geo = new THREE.BoxGeometry(1,1,1);
    let mesh = new THREE.Mesh(geo,myMat);
    mesh.position.set(i * 2, j*2, 3);
    scene.add(mesh);
    }
  }
}

// keep track of which frame we are on
let frameCount = 0;

function animate() {
  // angle += rotationSpeed;
  // camera.position.x = radius * Math.cos(angle);
  // camera.position.z = radius * Math.sin(angle);
  // camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
