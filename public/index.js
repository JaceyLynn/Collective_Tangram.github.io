import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
let socket;
// Generate a unique ID for each new piece
function generateUniqueId() {
  return "piece-" + Math.random().toString(36).substr(2, 9);
}

// Track pieces locally
let pieces = [];
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
  plane.name = "floor";

  // Add orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);

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

  //setup mouse interaction
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  socket = io({
    transports: ["websocket"], // <-- no polling, only ws
  });

  // once, at init time:
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  socket.on("connect", () => {
    console.log("Connected over WebSocket, socket id:", socket.id);
  });

  // --- new multiplayer piece handlers ---
  socket.on("initialize", (existingPieces) => {
    pieces = existingPieces;
    existingPieces.forEach((p) => createOrUpdatePiece(p));
  });

  socket.on("newPiece", (newPiece) => {
    if (!pieces.find((p) => p.id === newPiece.id)) {
      pieces.push(newPiece);
      createOrUpdatePiece(newPiece);
    }
    socket.on("pieceUpdated", createOrUpdatePiece);
  });

  socket.on("pieceUpdated", (updated) => {
    const idx = pieces.findIndex((p) => p.id === updated.id);
    if (idx !== -1) {
      pieces[idx] = updated;
      createOrUpdatePiece(updated);
    }
  });

  socket.on("limitReached", () => {
    alert("You've reached your 7-piece limit!");
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !dragging) {
      console.log("Space pressed! dragging:", dragging);
      e.preventDefault();
      instantiateNewPiece();
    }
    if (e.key === "Shift" && pickedObject) {
      rotateObjectBy45Degrees();
    }
  });
  animate();
}

// Function to create or update pieces in the scene
function createOrUpdatePiece(piece) {
  // Check if the piece already exists by ID
  let existingPiece = scene.getObjectByName(piece.id);

  if (existingPiece) {
    // Update existing piece's position and rotation
    existingPiece.position.set(
      piece.position.x,
      piece.position.y,
      piece.position.z
    );
    existingPiece.rotation.set(
      piece.rotation.x,
      piece.rotation.y,
      piece.rotation.z
    );
  } else {
    // Create a new piece if it doesn't exist
    const loader = new GLTFLoader();

    loader.load(modelLinks[piece.modelIndex], (gltf) => {
      let model = gltf.scene;
      model.name = piece.id; // Ensure the piece has a unique ID
      model.position.set(piece.position.x, piece.position.y, piece.position.z);
      model.rotation.set(piece.rotation.x, piece.rotation.y, piece.rotation.z);

      // Apply color to the piece
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: piece.color || "#FFFFFF", // Default to white if no color is provided
          });
        }
      });

      // Add the new piece to the scene
      scene.add(model);
      // ← make it draggable!
      const isDraggable = !piece.static;
      myModels.set(model, isDraggable ? "draggable" : "static");
    });
  }
}

//initiate drag and rotate
function onMouseDown(event) {
  // update normalized device coords from this event
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
  // store last pointer coords globally
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

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

      // tell server / peers about it
      const action = {
        type: "move",
        piece: { id: pickedObject.name },
        data: {
          position: {
            x: pickedObject.position.x,
            y: pickedObject.position.y,
            z: pickedObject.position.z,
          },
        },
        userId: socket.id,
        ts: Date.now(),
      };
      socket.emit("pieceAction", action);
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

function instantiateNewPiece() {
  // 1) Raycast at the last mouse.x/y
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(scene.getObjectByName("floor"), true);
  if (!hits.length) return;
  const hit = hits[0].point;

  // 2) Build your pieceData
  const pieceData = {
    id: generateUniqueId(),
    modelIndex: currentModelIndex,
    color: rainbowColors[currentModelIndex],
    position: { x: hit.x, y: hit.y, z: hit.z },
    rotation: { x: 0, y: 0, z: 0 },
  };

  // 3) Show it immediately yourself
  createOrUpdatePiece(pieceData);

  // 4) Build and emit the action just once
  const action = {
    type: "add",
    piece: {
      id: pieceData.id,
      modelIndex: pieceData.modelIndex,
      color: pieceData.color,
    },
    data: {
      position: pieceData.position,
      rotation: pieceData.rotation,
    },
    userId: socket.id,
    ts: Date.now(),
  };
  socket.emit("pieceAction", action);

  // 5) Then advance your index exactly once
  currentModelIndex = (currentModelIndex + 1) % modelLinks.length;
}

function updateScene() {
  // Loop through all pieces to add or update them in the scene
  pieces.forEach((piece) => {
    let existingPiece = scene.getObjectByName(piece.id); // Check if the piece already exists in the scene

    if (existingPiece) {
      // Update the existing piece's position and rotation
      existingPiece.position.set(
        piece.position.x,
        piece.position.y,
        piece.position.z
      );
      existingPiece.rotation.set(
        piece.rotation.x,
        piece.rotation.y,
        piece.rotation.z
      );
    } else {
      // Create a new piece if it doesn't exist
      const loader = new GLTFLoader();

      loader.load(modelLinks[currentModelIndex], (gltf) => {
        let model = gltf.scene;
        model.name = piece.id; // Assign the piece a unique name based on its ID

        model.position.set(
          piece.position.x,
          piece.position.y,
          piece.position.z
        );
        model.rotation.set(
          piece.rotation.x,
          piece.rotation.y,
          piece.rotation.z
        );

        // Set the piece's color (could be based on piece.color)
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: piece.color, // Use the color from the piece data
            });
          }
        });

        // Add the new piece to the scene
        scene.add(model);
      });
    }
  });
}

// Function to rotate the object by 45 degrees around its center
function rotateObjectBy45Degrees() {
  if (!pickedObject || rotationInProgress) return; // Prevent rotation if already in progress

  rotationInProgress = true;

  // Increment the rotation angle by 45 degrees (convert to radians for Three.js)
  rotationAngle += rotationStep;

  // Apply the rotation around the object's center (local rotation)
  let angleInRadians = THREE.MathUtils.degToRad(rotationAngle); // Convert to radians
  pickedObject.rotation.y = angleInRadians; // Rotate around the Y-axis (horizontal)

  const action = {
    type: "rotate",
    piece: { id: pickedObject.name },
    data: {
      rotation: {
        x: pickedObject.rotation.x,
        y: pickedObject.rotation.y,
        z: pickedObject.rotation.z,
      },
    },
    userId: socket.id,
    ts: Date.now(),
  };
  socket.emit("pieceAction", action);

  // Allow the rotation to complete before another key press
  setTimeout(() => {
    rotationInProgress = false;
  }, 200); // You can adjust this timeout duration as needed
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
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

init();
