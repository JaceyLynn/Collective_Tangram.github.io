import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
let currentModelIndex = 0; // Start with the first model
let modelLinks = [];

// // Load texture
// const textureLoader = new THREE.TextureLoader();
// const customTexture = textureLoader.load(
//   "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"
// );

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
  camera.position.set(0, 500, 100);
  camera.lookAt(0, 0, 0);

  //renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);
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
  modelLinks = [
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
          child.material = new THREE.MeshStandardMaterial({
            color: rainbowColors[index],
          });
        }
      });

      scene.add(model);
      myModels.set(model, index === -1 ? "static" : "draggable");
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
    if (
      clickedObject.type === "Object3D" &&
      clickedObject.parent?.type === "TransformControls"
    ) {
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

let rotationStep = 45; // 45 degrees per shift press
let rotationAngle = 0; // Track current rotation angle
let rotationInProgress = false; // Prevent continuous rotation while shift is held

// Listen for shift key presses
document.addEventListener('keydown', onKeyDown);

function onKeyDown(event) {
  if (event.key === 'Shift' && pickedObject) {
    // Only rotate if the Shift key is pressed and an object is selected
    rotateObjectBy45Degrees();
  }
  if (event.key === ' ' && !dragging) {  // Space bar press and not dragging
    instantiateNewPiece();
  }
}

// Instantiate a new piece from the model list in sequence at the mouse position
function instantiateNewPiece() {
  const loader = new GLTFLoader();
  const modelLink = modelLinks[currentModelIndex]; // Get the model link from the list

  // Raycast from the camera through the mouse position
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(scene.children[1], true); // Intersect the floor plane (scene.children[1] is the plane)

  if (intersects.length > 0) {
    const intersectionPoint = intersects[0].point; // Get the point where the mouse intersects the floor

    loader.load(modelLink, (gltf) => {
      let model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({
            color: rainbowColors[currentModelIndex], // Assign colors in sequence
          });
        }
      });

      // Add the model to the scene at the intersection point
      model.position.set(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);
      scene.add(model);

      // Mark the model as draggable
      myModels.set(model, "draggable");

      // Track the index for the next piece
      currentModelIndex = (currentModelIndex + 1) % modelLinks.length; // Cycle through models
    });
  }
}
// Function to rotate the object by 45 degrees
function rotateObjectBy45Degrees() {
  if (!pickedObject || rotationInProgress) return; // Prevent rotation if already in progress

  rotationInProgress = true;

  // Increment the rotation angle by 45 degrees (convert to radians for Three.js)
  rotationAngle += rotationStep;

  // Apply the rotation around the Y-axis (you can change the axis if needed)
  let axis = new THREE.Vector3(0, 1, 0); // Y-axis for horizontal rotation
  let angleInRadians = THREE.MathUtils.degToRad(rotationAngle); // Convert to radians

  pickedObject.rotation.set(0, angleInRadians, 0); // Apply the new rotation

  // Allow the rotation to complete before another key press
  setTimeout(() => {
    rotationInProgress = false;
  }, 200); // You can adjust this timeout duration as needed
}

// The rest of your existing code remains unchanged


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

      // pickedObject.position.copy(tempPosition);
//       pickedObject.rotateOnAxis(axis, angle);

//       console.log("Rotating around:", center);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
