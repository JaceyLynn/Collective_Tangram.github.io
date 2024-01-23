import * as THREE from "three";


console.log(THREE);


let scene = new THREE.Scene()















// // Because this is a module script, we can import code from other modules
// // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
// import * as THREE from "three";

// // create a scene container in which all other objects will exist
// let scene = new THREE.Scene();

// // create a camera and position it in space
// let aspect = window.innerWidth / window.innerHeight;
// let camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
// camera.position.z = 8; // place the camera in space

// // the renderer will actually show the camera view within our <canvas>
// let renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // create a sphere
// let geometry = new THREE.SphereGeometry(1, 12, 12);
// let material = new THREE.MeshBasicMaterial({ color: "blue" });
// let myMesh = new THREE.Mesh(geometry, material);

// // and add it to the scene container
// scene.add(myMesh);

// // what else can we do?
// // try placing objects with a for-loop
// // let geo = new THREE.SphereGeometry(0.1, 12, 12);
// // let mat = new THREE.MeshBasicMaterial({ color: "blue" });
// // for (let i = -3; i <= 3; i++) {
// //   for (let j = -3; j <= 3; j++) {
// //     let mesh = new THREE.Mesh(geo, mat);
// //     mesh.position.set(j, i, 0);
// //     mesh.scale.set(Math.abs(i) + 0.1, 1, 1);
// //     scene.add(mesh);
// //     console.log(i * 5);
// //   }
// // }

// // try changing the background color (or add an image)
// // scene.background = new THREE.Color("rgb(255, 10, 100)");

// // set a different camera position
// // camera.position.set(0,-10,10);
// // camera.lookAt(0,0,0);

// // 

// // finally, take a picture of the scene and show it in the <canvas>
// renderer.render(scene, camera);
