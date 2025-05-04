import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FirstPersonControls } from "/FirstPersonControls.js";

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

// Load PLANE texture
const textureLoader = new THREE.TextureLoader();
const customTexture = textureLoader.load(
  "https://cdn.glitch.global/9e349498-62d1-4bcc-bd1c-bbf3a5b4ac51/tangram%20pattern%20wood.png?v=1746398807476"
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
  camera.position.set(100, 100, 200);
  camera.lookAt(0, 0, 0);

  //renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
// color: white, intensity: 0.4 (tweak up/down as needed)
scene.add(ambientLight);
  // Set up the light with shadow
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(300, 1000, 100);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 5000;
  scene.add(light);

  //floor plate
  customTexture.wrapS = THREE.RepeatWrapping;
  customTexture.wrapT = THREE.RepeatWrapping;
  customTexture.repeat.set(2, 2);
  const planeGeometry = new THREE.PlaneGeometry(3500, 3500);
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: customTexture,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2; // lay flat
  scene.add(plane);
  plane.name = "floor";

  
  const wallTexture = new THREE.TextureLoader().load(
  "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"
);
// Enable wrapping so it repeats
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
// Tile it along the length (3400 units) and height (400 units)
// You can tweak these repeat values to taste:
wallTexture.repeat.set(4, 1);  
// wall dimensions
const wallLength    = 3500;
const wallHeight    = 400;
const wallThickness =   50;
const halfSize      = wallLength / 2;
const halfThick     = wallThickness / 2;

// shared wall material using the texture
const wallMat = new THREE.MeshStandardMaterial({
  map: wallTexture,
  side: THREE.DoubleSide
});

// ─── North wall ───
const northGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
const northWall = new THREE.Mesh(northGeo, wallMat);
northWall.position.set(0, wallHeight / 2, halfSize + halfThick);
northWall.castShadow = true;
northWall.receiveShadow = true;
scene.add(northWall);

// ─── South wall ───
const southWall = northWall.clone();
southWall.position.set(0, wallHeight / 2, -halfSize - halfThick);
scene.add(southWall);

// ─── East wall ───
const eastGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
const eastWall = new THREE.Mesh(eastGeo, wallMat);
eastWall.position.set(halfSize + halfThick, wallHeight / 2, 0);
eastWall.castShadow = true;
eastWall.receiveShadow = true;
scene.add(eastWall);

// ─── West wall ───
const westWall = eastWall.clone();
westWall.position.set(-halfSize - halfThick, wallHeight / 2, 0);
scene.add(westWall);



  // // Add orbit controls
  // let controls = new OrbitControls(camera, renderer.domElement);
let controls = new FirstPersonControls(scene, camera, renderer);
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
    pieces.forEach(createOrUpdatePiece);
  });

  socket.on("newPiece", (newPiece) => {
    if (!pieces.find((p) => p.id === newPiece.id)) {
      pieces.push(newPiece);
      createOrUpdatePiece(newPiece);
    }
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
  // If it’s already in the scene, just update its transform
  let existing = scene.getObjectByName(piece.id);
  if (existing) {
    existing.position.set(piece.position.x, piece.position.y, piece.position.z);
    existing.rotation.set(piece.rotation.x, piece.rotation.y, piece.rotation.z);
    return;
  }

  // Otherwise, load it for the first time
  const loader = new GLTFLoader();
  loader.load(modelLinks[piece.modelIndex], (gltf) => {
    const model = gltf.scene;
    model.name = piece.id;

    // Apply position & rotation
    model.position.set(piece.position.x, piece.position.y, piece.position.z);
    model.rotation.set(piece.rotation.x, piece.rotation.y, piece.rotation.z);

    // Colorize
    model.traverse((c) => {
      if (c.isMesh) {
        c.material = new THREE.MeshStandardMaterial({ color: piece.color });
      }
    });

    // Mark as static or draggable
    model.userData.static = Boolean(piece.static);
    if (piece.static) {
      myModels.set(model, "static");
    } else {
      myModels.set(model, "draggable");
    }

    scene.add(model);
  });
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
  // 1) update mouse coords
  mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (!dragging || !pickedObject || isRotating) return;

  // 2) raycast down on the floor
  raycaster.setFromCamera(mouse, camera);
  const floor = scene.getObjectByName("floor");
  const hits  = raycaster.intersectObject(floor, true);
  if (!hits.length) return;
  const point = hits[0].point;

  // 3) compute the new position
  const newPos = new THREE.Vector3(
    point.x + pickedObject.userData.offset.x,
    pickedObject.position.y,
    point.z + pickedObject.userData.offset.z
  );

  // 4) test collision with a shrunken bounding‐box
  const margin = 7;  // adjust to taste
  const originalPos = pickedObject.position.clone();
  pickedObject.position.copy(newPos);

  // build & inset your test box
  const testBox = new THREE.Box3().setFromObject(pickedObject);
  testBox.expandByScalar(-margin);

  // check against every other piece
  let collision = false;
  pieces.forEach(p => {
    if (p.id === pickedObject.name) return;
    const otherMesh = scene.getObjectByName(p.id);
    if (!otherMesh) return;

    const otherBox = new THREE.Box3().setFromObject(otherMesh);
    otherBox.expandByScalar(-margin);

    if (testBox.intersectsBox(otherBox)) {
      collision = true;
    }
  });

  // 5) revert or commit
  if (collision) {
    pickedObject.position.copy(originalPos);
  } else {
    // valid: broadcast & trail
    const action = {
      type:  "move",
      piece: { id: pickedObject.name },
      data:  { position: pickedObject.position },
      userId: socket.id,
      ts:     Date.now()
    };
    socket.emit("pieceAction", action);
    createTrail(pickedObject.position, pickedObject);
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
  // raycast once at the current mouse.x/y
  raycaster.setFromCamera(mouse, camera);
  const floor = scene.getObjectByName("floor");
  const hits = raycaster.intersectObject(floor, true);
  if (!hits.length) return;
  const hit = hits[0].point;

  // generate an id and capture the index you want
  const id = generateUniqueId();
  const chosenIndex = currentModelIndex;

  // build the action with your chosen modelIndex
  const action = {
    type: "add",
    piece: {
      id: id,
      modelIndex: chosenIndex,
      color: rainbowColors[chosenIndex],
    },
    data: {
      position: { x: hit.x, y: hit.y, z: hit.z },
      rotation: { x: 0, y: 0, z: 0 },
    },
    userId: socket.id,
    ts: Date.now(),
  };

  // emit *only* — don’t render locally!
  socket.emit("pieceAction", action);

  // advance your local counter just for the *next* selection
  currentModelIndex = (chosenIndex + 1) % modelLinks.length;
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
  if (!pickedObject || rotationInProgress) return;
  rotationInProgress = true;

  // Compute start & end angles
  const startAngle = pickedObject.rotation.y;
  rotationAngle += rotationStep;                       // your accumulated angle
  const endAngle   = THREE.MathUtils.degToRad(rotationAngle);

  const duration    = 300;     // ms
  const startTime   = performance.now();

  function animateRotation(now) {
    const elapsed = now - startTime;
    const t       = Math.min(elapsed / duration, 1);
    // ease in/out (optional)
    const easeT   = t < 0.5 
      ? 2*t*t 
      : -1 + (4 - 2*t)*t;

    // lerp between start & end
    pickedObject.rotation.y = THREE.MathUtils.lerp(startAngle, endAngle, easeT);

    if (t < 1) {
      requestAnimationFrame(animateRotation);
    } else {
      rotationInProgress = false;
      // after the rotation is done, emit the final rotation to the server:
      const action = {
        type:  "rotate",
        piece: { id: pickedObject.name },
        data:  { rotation: {
                    x: pickedObject.rotation.x,
                    y: pickedObject.rotation.y,
                    z: pickedObject.rotation.z
                  }
              },
        userId: socket.id,
        ts:     Date.now()
      };
      socket.emit("pieceAction", action);
    }
  }

  requestAnimationFrame(animateRotation);
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
