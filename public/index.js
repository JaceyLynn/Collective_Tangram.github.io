import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FirstPersonControls } from "./FirstPersonControls.js";

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
let savedCamPosition = null;
let frameCounts = 0;
let controls;

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
  // ─── Basic three.js setup ───────────────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#404040");

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(10, 20, 200);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // give the canvas focus so it can grab keyboard events
  renderer.domElement.setAttribute("tabindex", 0);
  renderer.domElement.style.outline = "none";
  document.body.appendChild(renderer.domElement);
  renderer.domElement.focus();

  // ─── FirstPersonControls ────────────────────────────────────────────────
  controls = new FirstPersonControls(
    scene,
    camera,
    renderer,
    () => instantiateNewPiece(),    // SPACE → add piece
    () => rotateClosestPieceBy45()  // R     → rotate nearest
  );
  // initialize its clock
  controls.prevTime = performance.now();
  // whenever it pushes a piece, broadcast move to server
  controls.setPushCallback((id, pos) => {
    socket.emit("pieceAction", {
      type: "move",
      piece: { id },
      data: { position: { x: pos.x, y: pos.y, z: pos.z } },
      userId: socket.id,
      ts: Date.now(),
    });
  });

  // ─── Lighting ───────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dirL = new THREE.DirectionalLight(0xffffff, 4);
  dirL.position.set(300, 1000, 100);
  dirL.castShadow = true;
  dirL.shadow.mapSize.set(2048, 2048);
  scene.add(dirL);


  // --- Floor ---
  customTexture.wrapS = THREE.RepeatWrapping;
  customTexture.wrapT = THREE.RepeatWrapping;
  customTexture.repeat.set(2, 2);
  const planeGeo = new THREE.PlaneGeometry(3500, 3500);
  const planeMat = new THREE.MeshStandardMaterial({
    map: customTexture,
    side: THREE.DoubleSide,
  });
  const floorMesh = new THREE.Mesh(planeGeo, planeMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.name = "floor";
  scene.add(floorMesh);

  // --- Walls ---
  const wallTexture = new THREE.TextureLoader().load(
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/TCom_StrandedBambooPlate_1K_albedo.png?v=1740983774496"
  );
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(4, 1);

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.DoubleSide,
  });
  const L = 3500,
    H = 400,
    T = 50,
    half = L / 2,
    t2 = T / 2;

  // North & South
  [half + t2, -(half + t2)].forEach((z) => {
    const geo = new THREE.BoxGeometry(L, H, T);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(0, H / 2, z);
    wall.userData.static = true;
    scene.add(wall);
  });

  // East & West
  [half + t2, -(half + t2)].forEach((x) => {
    const geo = new THREE.BoxGeometry(T, H, L);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(x, H / 2, 0);
    wall.userData.static = true;
    scene.add(wall);
  });

  // --- Model links array ---
  modelLinks = [
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_1.glb?v=1740980622181", // Model 2 (Red)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_2.glb?v=1740980636308", // Model 3 (Orange)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_3.glb?v=1740980639282", // Model 4 (Yellow)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_4.glb?v=1740980647077", // Model 5 (Green)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_5.glb?v=1740980651906", // Model 6 (Blue)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_6.glb?v=1740980654436", // Model 7 (Indigo)
    "https://cdn.glitch.global/7b5f2fec-1afb-4043-bb5a-0a568ef51f86/tangram_7.glb?v=1740980657856", // Model 8 (Purple)
  ];

  // --- Socket.io setup ---
  socket = io({ transports: ["websocket"] });
  socket.on("connect", () => console.log("Connected, socket id:", socket.id));

  socket.on("initialize", (existing) => {
    pieces = existing;
    pieces.forEach(createOrUpdatePiece);
  });
  socket.on("newPiece", (p) => {
    if (!pieces.find((x) => x.id === p.id)) {
      pieces.push(p);
      createOrUpdatePiece(p);
    }
  });
  socket.on("pieceUpdated", (upd) => {
    const i = pieces.findIndex((x) => x.id === upd.id);
    if (i !== -1) {
      pieces[i] = upd;
      createOrUpdatePiece(upd);
    }
  });
  socket.on("limitReached", () => alert("You've reached your 7-piece limit!"));

  // --- Track raw mouse coords for raycasting if needed ---
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

// ─── “Bird’s‑eye” V‑key handlers ────────────────────────────────────────
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyV" && savedCamPosition === null) {
      savedCamPosition = camera.position.clone();
      camera.position.set(0, 1500, 0);
      camera.lookAt(0, 0, 0);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyV" && savedCamPosition !== null) {
      camera.position.copy(savedCamPosition);
      savedCamPosition = null;
    }
  });

  // ─── Finally kick off the render loop ──────────────────────────────────
  animate();
}

// Function to create or update pieces in the scene
function createOrUpdatePiece(piece) {
  // 1) Validate & pick the correct URL
  const idx =
    Number.isInteger(piece.modelIndex) &&
    piece.modelIndex >= 0 &&
    piece.modelIndex < modelLinks.length
      ? piece.modelIndex
      : 0;
  const url = modelLinks[idx];
  if (!url) {
    console.warn("Bad modelIndex:", piece.modelIndex);
    return;
  }

  // 2) If it’s already in the scene, just update its transform
  let existing = scene.getObjectByName(piece.id);
  if (existing) {
    existing.position.set(piece.position.x, piece.position.y, piece.position.z);
    existing.rotation.set(piece.rotation.x, piece.rotation.y, piece.rotation.z);
    return;
  }

  // 3) Otherwise, load it for the first time
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    const model = gltf.scene;
    model.name = piece.id;

    // 4) Mark static vs. draggable on every node
    model.userData.static = Boolean(piece.static);
    model.traverse((node) => {
      node.userData.static = Boolean(piece.static);
      if (node.isMesh) {
        node.material = new THREE.MeshStandardMaterial({ color: piece.color });
        myModels.set(node, piece.static ? "static" : "draggable");
      }
    });

    // 5) Apply initial transform
    model.position.set(piece.position.x, piece.position.y, piece.position.z);
    model.rotation.set(piece.rotation.x, piece.rotation.y, piece.rotation.z);

    // 6) Add it to the scene
    scene.add(model);
  });
}

function instantiateNewPiece() {
  // 1) Compute a raw spawn X/Z some units in front of the camera
  const forward = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .normalize();
  const spawnDistance = 50; 
  const rawXZ = camera.position.clone()
    .add(forward.multiplyScalar(spawnDistance));

  // 2) Ray down from high above that X/Z to find the floor
  const downOrigin = new THREE.Vector3(rawXZ.x, 1000, rawXZ.z);
  raycaster.set(downOrigin, new THREE.Vector3(0, -1, 0));
  const floor = scene.getObjectByName("floor");
  const hits  = raycaster.intersectObject(floor, true);
  if (!hits.length) {
    console.warn("instantiateNewPiece: no floor hit at", rawXZ.x, rawXZ.z);
    return;
  }
  const spawnPos = hits[0].point;  // { x, y=0, z }

  // 3) Build the piece data at that ground position
  const id = generateUniqueId();
  const idx = currentModelIndex;
  const pieceData = {
    id,
    modelIndex: idx,
    color:      rainbowColors[idx],
    position:   { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
    rotation:   { x: 0, y: 0, z: 0 },
  };

  // 4) Emit the add event
  socket.emit("pieceAction", {
    type:  "add",
    piece: {
      id:         pieceData.id,
      modelIndex: pieceData.modelIndex,
      color:      pieceData.color,
    },
    data: {
      position: pieceData.position,
      rotation: pieceData.rotation,
    },
    userId: socket.id,
    ts:     Date.now(),
  });

  // 5) Cycle to the next model/color for the *next* spawn
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
function rotateClosestPieceBy45() {
  // 1) find the closest dynamic piece
  let closest = null;
  let minDist = Infinity;
  scene.traverse((obj) => {
    if (obj.isMesh && obj.userData.static === false) {
      const d = obj.position.distanceTo(camera.position);
      if (d < minDist) {
        minDist = d;
        closest = obj;
      }
    }
  });
  if (!closest) return;

  // 2) prepare for smooth tween from current to +45°
  const startAngle = closest.rotation.y;
  const endAngle = startAngle + THREE.MathUtils.degToRad(45);
  const duration = 300; // ms
  const t0 = performance.now();

  function tick(now) {
    const t = Math.min((now - t0) / duration, 1);
    // ease‐in‐out
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    closest.rotation.y = THREE.MathUtils.lerp(startAngle, endAngle, eased);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // 3) when done, notify the server of the new rotation
      socket.emit("pieceAction", {
        type: "rotate",
        piece: { id: closest.name },
        data: {
          rotation: {
            x: closest.rotation.x,
            y: closest.rotation.y,
            z: closest.rotation.z,
          },
        },
        userId: socket.id,
        ts: Date.now(),
      });
    }
  }

  requestAnimationFrame(tick);
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
  requestAnimationFrame(animate);
  // use the *global* controls here
  // update first‑person movement
  const now = performance.now();
  controls.update(now);
  renderer.render(scene, camera);
}

init();
