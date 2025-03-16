import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { EditableCameraPathTool } from "./EditableCameraPathTool.js";

let scene, camera, renderer;
let myModels = new Map();
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let pickedObject = null;
let dragging = false;
let isRotating = false;
let trails = [];
let clickX = 0;
let clickY = 0;
let clickZ = 0;

// Load texture
const textureLoader = new THREE.TextureLoader();
const customTexture = textureLoader.load(
  "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"
);
// puzzle colors
const rainbowColors = [
  "#D4A29C",
  "#E8B298",
  "#FDE8B3",
  "#BDE1B3",
  "#B0E1E3",
  "#97ADF6",
  "#C6A0D4",
];

function init() {
  //canvas
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#404040");
  //camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(300, 300, 300);
  camera.position.z += 30;
  camera.position.x += -30;
  camera.position.y += 20;
  
  
  //renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);

// let cameraPathPoints = [new THREE.Vector3(200, 300,0),
// new THREE.Vector3(0, 400, 200),
// new THREE.Vector3(100, 500,500),
// new THREE.Vector3(0, 300,100),
// ]; 
  
//   let cameraTargetPosition = new THREE.Vector3(-1.334887755641518, 23.787482740077042, -0.18381425004689622);
//   new EditableCameraPathTool(camera, scene, renderer, cameraPathPoints, cameraTargetPosition);
  // Set up the light with shadow
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(100, 300, 200);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 5000;
  scene.add(light);
  //floor plate
  const geometry1 = new THREE.PlaneGeometry(4000, 4000);
  const material1 = new THREE.MeshStandardMaterial({
    color: "#404040",
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geometry1, material1);
  geometry1.rotateX(Math.PI / 2);
  plane.position.set(0, 0, 1000);
  plane.receiveShadow = true;
  scene.add(plane);

  // Add orbit controls
  // let controls = new OrbitControls(camera, renderer.domElement);

  // Load models
  const modelLinks = [
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_0.glb?v=1740980628332", // Model 1 (Texture)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_1.glb?v=1740980622181", // Model 2 (Red)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_2.glb?v=1740980636308", // Model 3 (Orange)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_3.glb?v=1740980639282", // Model 4 (Yellow)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_4.glb?v=1740980647077", // Model 5 (Green)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_5.glb?v=1740980651906", // Model 6 (Blue)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_6.glb?v=1740980654436", // Model 7 (Indigo)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_7.glb?v=1740980657856", // Model 8 (Purple)
  ];
  //setup model
  const loader = new GLTFLoader();
  
  modelLinks.forEach((link, index) => {
    loader.load(link, (gltf) => {
      let model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (index === 0) {
            //box don't interact with click
            child.material = new THREE.MeshStandardMaterial({
              map: customTexture,
            });
          } else {
            child.material = new THREE.MeshStandardMaterial({
              color: rainbowColors[index - 1],
            });
          }
        }
      });

      scene.add(model);
      myModels.set(model, index === 0 ? "static" : "draggable");
    });
  });
  //setup mouse interaction
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  animate();
}
//initiate drag and rotate
function onMouseDown(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  console.log("Mouse down detected!");
  console.log("Intersections:", intersects.length, intersects);

  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;

    // Ignore TransformControls if clicked
    if (clickedObject.type === "Object3D" && clickedObject.parent?.type === "TransformControls") {
      console.log("Clicked on TransformControls, ignoring...");
      return;
    }

    // Traverse up to the parent if necessary
    while (clickedObject.parent && clickedObject.parent !== scene) {
      clickedObject = clickedObject.parent;
    }

    console.log("Clicked Object:", clickedObject.name || clickedObject);

    if (myModels.get(clickedObject) === "draggable") {
      pickedObject = clickedObject;
      let clickedPoint = intersects[0].point.clone();

      console.log("Picked Object:", pickedObject.name || pickedObject);

      // Store rotation center
      pickedObject.userData.rotationCenter = clickedPoint.clone();

      // Store offset for dragging
      pickedObject.userData.offset = new THREE.Vector3().subVectors(
        pickedObject.position,
        clickedPoint
      );

      dragging = true;
      isRotating = event.shiftKey; // Hold shift to rotate

      console.log("Dragging started:", dragging);
      console.log("Rotation Mode:", isRotating);
    } else {
      console.log("Object is not draggable.");
    }
  } else {
    console.log("No object clicked.");
  }
}





//move with mouse
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (dragging && pickedObject && !isRotating) {
    console.log("Mouse moving while dragging...");
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(scene.children[1], true); // Floor

    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log("Intersected with ground at:", point);

      pickedObject.position.set(
        point.x + pickedObject.userData.offset.x,
        pickedObject.position.y, // Keep Y height constant
        point.z + pickedObject.userData.offset.z
      );

      console.log("Updated position:", pickedObject.position);
      createTrail(pickedObject.position, pickedObject);
    }
  }
}




//stop moving when mouse release
function onMouseUp() {
  console.log("Mouse up, stopping dragging.");
  dragging = false;
  pickedObject = null;
  fadeOutTrail();
}


//add cute trail of triangles
function createTrail(position, object) {
  const geometry = new THREE.CircleGeometry(Math.random() * 20 + 5, 3);
  const material = new THREE.MeshBasicMaterial({
    color: getObjectColor(object),
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const trail = new THREE.Mesh(geometry, material);
  trail.position.set(position.x, 2, position.z);
  trail.rotation.x = -Math.PI / 2;
  trail.rotation.z = Math.random() * Math.PI * 2;

  scene.add(trail);
  trails.push(trail);
}
//make the trail color change according to piece color
function getObjectColor(object) {
  let color = new THREE.Color(0xffffff);
  object.traverse(function (child) {
    if (child.isMesh) {
      color = child.material.color;
    }
  });
  return color;
}
//trail fades when mouse release
function fadeOutTrail() {
  trails.forEach(function (trail, index) {
    let interval = setInterval(function () {
      trail.material.opacity -= 0.02;
      if (trail.material.opacity <= 0) {
        scene.remove(trail);
        clearInterval(interval);
      }
    }, 50);
  });
  trails = [];
}

function animate() {
  if (dragging) {
    console.log("Dragging is active! Object should be moving.");
  }
  
  if (isRotating && pickedObject) {
    let center = pickedObject.userData.rotationCenter;

    if (center) {
      let axis = new THREE.Vector3(0, 1, 0);
      let angle = 0.02;

      let tempPosition = new THREE.Vector3().copy(pickedObject.position);
      tempPosition.sub(center);
      tempPosition.applyAxisAngle(axis, angle);
      tempPosition.add(center);

      pickedObject.position.copy(tempPosition);
      pickedObject.rotateOnAxis(axis, angle);
      
      console.log("Rotating around:", center);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}




init();
