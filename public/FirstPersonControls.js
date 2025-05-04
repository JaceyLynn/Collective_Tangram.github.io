// public/FirstPersonControls.js
import * as THREE from "three";

export class FirstPersonControls {
  /**
   * @param {THREE.Scene}   scene
   * @param {THREE.Camera}  camera
   * @param {THREE.Renderer} renderer
   * @param {Function}      instantiateCb  // called on Space press
   * @param {Function}      rotateCb       // called on R press
   */
  constructor(scene, camera, renderer, instantiateCb, rotateCb) {
    this.scene         = scene;
    this.camera        = camera;
    this.renderer      = renderer;
    this.instantiateCb = instantiateCb;
    this.rotateCb      = rotateCb;

    // movement state
    this.moveForward   = false;
    this.moveBackward  = false;
    this.moveLeft      = false;
    this.moveRight     = false;

    this.velocity      = new THREE.Vector3();
    this.direction     = new THREE.Vector3();
    this.prevTime      = performance.now();

    // Height at which the camera “floats” above the floor
    this.cameraHeight  = camera.position.y;

    // For pushing pieces out of the way
    this.raycaster     = new THREE.Raycaster();
    this.onPush        = null;  // you can set via setPushCallback()

    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard
    window.addEventListener("keydown", this._onKeyDown.bind(this));
    window.addEventListener("keyup",   this._onKeyUp.bind(this));

    // Pointer‑lock on click
    this.renderer.domElement.addEventListener("click", () => {
      this.renderer.domElement.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", () => {
      // You could show/hide UI here if you like
    });

    // Mouse‐look
    window.addEventListener("mousemove", this._onMouseMove.bind(this));
  }

  _onKeyDown(e) {
    switch (e.code) {
      case "KeyW": this.moveForward  = true; break;
      case "KeyS": this.moveBackward = true; break;
      case "KeyA": this.moveLeft     = true; break;
      case "KeyD": this.moveRight    = true; break;
      case "Space": 
        this.instantiateCb();
        break;
      case "KeyR":
        this.rotateCb();
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case "KeyW": this.moveForward  = false; break;
      case "KeyS": this.moveBackward = false; break;
      case "KeyA": this.moveLeft     = false; break;
      case "KeyD": this.moveRight    = false; break;
    }
  }

  _onMouseMove(e) {
    // only when pointer is locked to the canvas
    if (document.pointerLockElement === this.renderer.domElement) {
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;
      // yaw
      this.camera.rotation.y -= movementX * 0.002;
      // pitch (clamp so you can't flip upside‐down)
      this.camera.rotation.x -= movementY * 0.002;
      this.camera.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.camera.rotation.x)
      );
    }
  }

  /** 
   * Call this from your animation loop.
   * @param {number} nowMs   current performance.now()
   */
  update(nowMs) {
    const delta = (nowMs - this.prevTime) / 1000;
    this.prevTime = nowMs;

    // Dampen velocity
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // Determine movement direction
    this.direction.z = (this.moveForward  ? 1 : 0) - (this.moveBackward  ? 1 : 0);
    this.direction.x = (this.moveRight    ? 1 : 0) - (this.moveLeft      ? 1 : 0);
    this.direction.normalize();

    const speed = 200;
    if (this.moveForward  || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
    if (this.moveLeft     || this.moveRight)    this.velocity.x -= this.direction.x * speed * delta;

    // Save old position in case we collide
    const oldPos = this.camera.position.clone();

    // Strafe and forward/back
    this.camera.translateX(-this.velocity.x * delta);
    this.camera.position.add(this._getForwardDir().multiplyScalar(-this.velocity.z * delta));

    // Check collisions and push pieces
    this._handleCollisions(oldPos);
  }

  _getForwardDir() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    return forward.normalize();
  }

  _handleCollisions(oldPos) {
    // Cast from just below the camera
    const origin = this.camera.position.clone();
    origin.y -= this.cameraHeight;

    this.raycaster.set(origin, this._getForwardDir());
    const hits = this.raycaster.intersectObjects(this.scene.children, true);

    if (hits.length > 0) {
      const hit   = hits[0];
      const mesh  = hit.object.parent || hit.object;

      // If it’s a dynamic piece (user‐added), push it
      if (!mesh.userData.static) {
        const pushAmt = (1 - THREE.MathUtils.clamp(hit.distance, 0, 1)) * 10;
        mesh.position.add(this._getForwardDir().multiplyScalar(pushAmt));
        if (this.onPush) this.onPush(mesh.name, mesh.position);
      }

      // Revert the camera so you don’t walk through
      this.camera.position.copy(oldPos);
    }
  }

  /**
   * Optionally call from main.js to sync pushes to server
   * @param {function(string, THREE.Vector3)} cb 
   */
  setPushCallback(cb) {
    this.onPush = cb;
  }
}


