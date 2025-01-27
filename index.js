// what is glitch.com.   how will we use it in class?

// moving from p5.js to 'vanilla' javascript (i.e. outside of the p5.js ecosystem)

// import syntax - how to access three.js / how is it different from p5.js

// how to use the browser console on glitch.com

// what is 'new' keyword and how does it allow us to create new instances of a class?

// x, y, z positions - what is euclidean space / cartesian coordinates?

// looking at a three.js example 

// wrapping everything in an 'init' function

// what is a geometry, material, mesh

// how to position a mesh in 3D space (and set rotation and scale)






















































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
