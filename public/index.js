import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FirstPersonControls } from "./FirstPersonControls.js";
import { getArt } from "./getArt.js";

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
let floatingBoxes = [];
let miniMapCamera, miniMapDot;

// At the top of your file
let savedCamLat = null;
let savedCamLon = null;

// Load PLANE texture
const textureLoader = new THREE.TextureLoader();
const customTexture = textureLoader.load(
  "https://cdn.glitch.global/9e349498-62d1-4bcc-bd1c-bbf3a5b4ac51/tangram%20pattern%20wood.png?v=1746398807476"
);
let bghue;
// puzzle colors
const rainbowColors = [
  "#CD2E55",
  "#E9473A",
  "#F4971B",
  "#FCC010",
  "#BDC04E",
  "#13955F",
  "#088EA7",
  "#1EB8D1",
  "#438ECC",
  "#4153A1",
  "#F6BCD0",
  "#DEDCDD",
];
let modelIndex = 0;
let colorIndex = 0;

function init() {
  // ─── Basic three.js setup ───────────────────────────────────────────────
  scene = new THREE.Scene();
  // scene.background = new THREE.Color("#404040");

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
    () => instantiateNewPiece(), // SPACE → add piece
    () => rotateClosestPieceBy45() // R     → rotate nearest
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
  // white ambient for overall brightness
  const ambient = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambient);

  // helper to create a directional light
  function makeDirLight(colorHex, x, y, z, intensity = 1) {
    const light = new THREE.DirectionalLight(colorHex, intensity);
    light.position.set(x, y, z);
    light.castShadow = true;
    // optional: tweak shadow map size/range per light if needed
    light.shadow.mapSize.set(1024, 1024);
    scene.add(light);
    return light;
  }

  const d = 2000; // distance from center
  const h = 500; // height above ground

  // Cyan light from +X (East)
  makeDirLight(0x00ffff, d, h, 0, 2);

  // Magenta light from -X (West)
  makeDirLight(0xff00ff, -d, h, 0, 1.0);

  // Yellow light from +Z (South)
  makeDirLight(0xffff00, 0, h, d, 2);

  // Green light from -Z (North)
  makeDirLight(0x00ff00, 0, h, -d, 1.5);

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
  let bgtexture = textureLoader.load(
    "https://cdn.glitch.global/95ee0769-1fe7-4f34-ae5f-4ad5dededbeb/Screenshot%202025-05-06%20at%208.38.36%E2%80%AFPM.png?v=1746579406867"
  );
  bgtexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bgtexture;;


  // ─── Floating torus‑knots ──────────────────────────────────────────────────
  // clear any old
  floatingBoxes = [];

  // floor dimensions (must match your PlaneGeometry)
  const floorSize = 3500;

  const knotCount = 100;
  for (let i = 0; i < knotCount; i++) {
    // random p & q
    const p = THREE.MathUtils.randInt(2, 10);
    const q = THREE.MathUtils.randInt(2, 10);

    // random size
    const radius = THREE.MathUtils.randFloat(60, 300);
    const tube = radius * 0.3;
    const geometry = new THREE.TorusKnotGeometry(radius, tube, 100, 16, p, q);
    const material = new THREE.MeshStandardMaterial({ color: "#FFCC33" });
    const knot = new THREE.Mesh(geometry, material);

    // place outside the walls
    const spawnRadius = 3000 + 200 + Math.random() * 800;
    const angle = Math.random() * Math.PI * 2;
    knot.position.set(
      Math.cos(angle) * spawnRadius,
      THREE.MathUtils.randFloat(200, 5000), // height range
      Math.sin(angle) * spawnRadius
    );

    // for bobbing
    knot.userData.baseY = knot.position.y;
    knot.userData.phase = Math.random() * Math.PI * 2;
    // 1) Random initial rotation:
    knot.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    // 2) Assign a tiny random rotation speed (radians per second):
    knot.userData.rotVelocity = new THREE.Vector3(
      THREE.MathUtils.randFloat(-0.5, 0.5),
      THREE.MathUtils.randFloat(-0.5, 0.5),
      THREE.MathUtils.randFloat(-0.5, 0.5)
    );
    floatingBoxes.push(knot);
    scene.add(knot);
  }

  // 1) Query the AIC API for exactly as many images as boxes
  getArt("Color blocking", floatingBoxes.length)
    .then((arts) => {
      // 2) For each result, load the texture and apply it to that box
      const count = Math.min(arts.length, floatingBoxes.length);
      for (let i = 0; i < count; i++) {
        const { imageUrl, title, artist } = arts[i];
        const box = floatingBoxes[i];

        // swap its material to use the fetched image
        const tex = new THREE.TextureLoader().load(imageUrl);
        box.material = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.8,
          metalness: 0.2,
        });

        // optional: store the metadata on the box for hover/tooltips later
        box.userData.artInfo = { title, artist };
      }
    })
    .catch((err) => console.error("Failed to load art:", err));
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
  socket.on("playerCount", (count) => {
    const el = document.getElementById("player-count");
    if (el) el.textContent = `Players: ${count}`;
  });
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
  // ─── Minimap setup ────────────────────────────────────────────────────────

  // 1) create an orthographic camera that covers the full floor
  const mapSize = 3500; // must match your PlaneGeometry width/height
  const halfMap = mapSize / 2;
  miniMapCamera = new THREE.OrthographicCamera(
    -halfMap,
    halfMap,
    halfMap,
    -halfMap,
    0.1,
    5000
  );
  miniMapCamera.position.set(0, 2000, 0); // very high above
  miniMapCamera.up.set(0, 0, -1); // orient so +Z is up on the map
  miniMapCamera.lookAt(0, 0, 0);

  // 2) a small sprite/dot that shows your player position
  const dotGeo = new THREE.CircleGeometry(40, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  miniMapDot = new THREE.Mesh(dotGeo, dotMat);
  miniMapDot.rotation.x = -Math.PI / 2; // face up
  scene.add(miniMapDot);

  // ─── “Bird’s‑eye” V‑key handlers ────────────────────────────────────────
  // Bird’s‑eye handlers:
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyV" && savedCamPosition === null) {
      // 1) save the old camera position & look state
      savedCamPosition = camera.position.clone();
      savedCamLat = controls.lat;
      savedCamLon = controls.lon;

      // 2) move the camera up
      camera.position.set(0, 3000, 0);

      // 3) point straight down
      controls.lat = -90; // pitch straight down
      controls.lon = 0; // yaw doesn't matter
      controls.euler.set(
        THREE.MathUtils.degToRad(controls.lat),
        THREE.MathUtils.degToRad(controls.lon),
        0
      );
      camera.quaternion.setFromEuler(controls.euler);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyV" && savedCamPosition !== null) {
      // restore old position
      camera.position.copy(savedCamPosition);

      // restore old orientation
      controls.lat = savedCamLat;
      controls.lon = savedCamLon;
      controls.euler.set(
        THREE.MathUtils.degToRad(controls.lat),
        THREE.MathUtils.degToRad(controls.lon),
        0
      );
      camera.quaternion.setFromEuler(controls.euler);

      // clear the saved state
      savedCamPosition = savedCamLat = savedCamLon = null;
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
  const rawXZ = camera.position
    .clone()
    .add(forward.multiplyScalar(spawnDistance));

  // 2) Ray down from high above that X/Z to find the floor
  const downOrigin = new THREE.Vector3(rawXZ.x, 1000, rawXZ.z);
  raycaster.set(downOrigin, new THREE.Vector3(0, -1, 0));
  const floor = scene.getObjectByName("floor");
  const hits = raycaster.intersectObject(floor, true);
  if (!hits.length) {
    console.warn("instantiateNewPiece: no floor hit at", rawXZ.x, rawXZ.z);
    return;
  }
  const spawnPos = hits[0].point; // { x, y=0, z }

  // 3) Build the piece data at that ground position
  const id = generateUniqueId();

  // on Space press:
  modelIndex = (modelIndex + 1) % modelLinks.length;
  colorIndex = (colorIndex + 1) % rainbowColors.length;
  const pieceData = {
    id,
    modelIndex: modelIndex,
    color: rainbowColors[colorIndex],
    position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
    rotation: { x: 0, y: 0, z: 0 },
  };

  // 4) Emit the add event
  socket.emit("pieceAction", {
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
  // 1) Find the nearest dynamic piece *group* (root has .type === 'Group' and .name === piece.id)
  let closest = null;
  let minDist = Infinity;

  scene.children.forEach((obj) => {
    if (obj.type === "Group" && obj.userData.static === false) {
      const d = obj.position.distanceTo(camera.position);
      if (d < minDist) {
        minDist = d;
        closest = obj;
      }
    }
  });

  if (!closest) return;

  // 2) Compute start & end angles on the group's Y rotation
  const startY = closest.rotation.y;
  const endY = startY + THREE.MathUtils.degToRad(45);
  const duration = 300; // ms
  const t0 = performance.now();

  function tick(now) {
    const t = Math.min((now - t0) / duration, 1);
    // simple ease‑in‑out
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    closest.rotation.y = THREE.MathUtils.lerp(startY, endY, eased);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // 3) Once done, notify everyone of the new rotation
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
function hueColor(h) {
  return new THREE.Color().setHSL(h % 1, 0.5, 0.5);
}

function animate() {
  requestAnimationFrame(animate);

  // 1) Drag / rotate debug (optional)
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

  // 2) Update controls & get delta time
  const now = performance.now();
  const delta = (now - controls.prevTime) / 1000;
  controls.update(now);

  // 3) Float & spin knots
  const t = now * 0.002;
  floatingBoxes.forEach((knot) => {
    // bob up/down
    knot.position.y =
      knot.userData.baseY + Math.sin(t + knot.userData.phase) * 20;
    // spin
    const rv = knot.userData.rotVelocity;
    knot.rotation.x += rv.x * delta;
    knot.rotation.y += rv.y * delta;
    knot.rotation.z += rv.z * delta;
  });

  // // 4) Dynamic background hue
  // const timeHue = (now * 0.00005) % 1;
  // const posHue = (camera.position.x + camera.position.z) * 0.0002;
  // const hue = (timeHue + posHue) * 0.5;
  // scene.background = hueColor(hue);

  // 5) Main full‑screen render
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.render(scene, camera);

  // 6) Update minimap dot position
  miniMapDot.position.set(camera.position.x, 2, camera.position.z);

  // 7) Render minimap in top‑right
  const mapSize = 200;
  const margin = 10;
  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setScissor(
    window.innerWidth - mapSize - margin,
    window.innerHeight - mapSize - margin,
    mapSize,
    mapSize
  );
  renderer.setViewport(
    window.innerWidth - mapSize - margin,
    window.innerHeight - mapSize - margin,
    mapSize,
    mapSize
  );
  renderer.render(scene, miniMapCamera);
  renderer.setScissorTest(false);

  // 8) Prepare for next frame
  controls.prevTime = now;
}

init();
