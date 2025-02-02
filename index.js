import * as THREE from 'three';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 10);
light.castShadow = true;
scene.add(light);

// Grid of Shapes
const colors = [0xffe0b2, 0xffcc80, 0x81c784, 0x64b5f6, 0xba68c8];
const gridSize = 6;

for (let i = 0; i < gridSize; i++) {
  for (let j = 0; j < gridSize; j++) {
    const geometry = Math.random() > 0.5
      ? new THREE.CircleGeometry(Math.random() * 0.5 + 0.2, 32)
      : new THREE.PlaneGeometry(Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2);

    const material = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      flatShading: true,
    });

    const shape = new THREE.Mesh(geometry, material);
    shape.position.set(i - gridSize / 2, j - gridSize / 2, 0);
    shape.castShadow = true;
    shape.receiveShadow = true;
    scene.add(shape);
  }
}

// Camera Position
camera.position.z = 10;

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
























































// // Because this is a module script, we can import code from other modules
// // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// import * as THREE from "three";

// let width = 400;
// let height = 400;

// // create a scene container (into which we will add all of the other objects)
// let scene = new THREE.Scene();
// // set a background color for our scene to something other than the default
// scene.background = new THREE.Color(1,0,0.2);

// // create a renderer which will draw the scene onto our HTML <canvas> element
// let renderer = new THREE.WebGLRenderer();
// renderer.setSize(width, height);
// document.body.appendChild(renderer.domElement); // add the renderer to the webpage

// // create a camera which can be moved abouyt the scene
// let fieldOfView = 60; // how wide is our camera view in degrees
// let aspectRatio = width / height;
// let camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, 0.1, 1000);
// camera.position.z = 8; // place the camera in space

// // create an object with a geometry and material
// const geometry = new THREE.TorusKnotGeometry( 2, 0.5, 100, 16 );
// let myColor = new THREE.Color("rgb(0,255,255)"); // we will define our color with three numbers (red, green blue)
// const material = new THREE.MeshBasicMaterial({color: myColor});
// const sphere = new THREE.Mesh( geometry, material );
// scene.add( sphere ); // add it to the scene

// // try adding some lights
// let myLight = new THREE.AmbientLight('0xffffff');
// scene.add(myLight);

// // White directional light at half intensity shining from the top.
// const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
// scene.add( directionalLight );

// // finally, draw our scene to the <canvas> element
// renderer.render(scene, camera);
