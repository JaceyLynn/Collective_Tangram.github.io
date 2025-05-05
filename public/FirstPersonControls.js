// public/FirstPersonControls.js
import * as THREE from "three";

export class FirstPersonControls {
  constructor(scene, camera, renderer, instantiateCb, rotateCb) {
    this.scene         = scene;
    this.camera        = camera;
    this.renderer      = renderer;
    this.instantiateCb = instantiateCb;
    this.rotateCb      = rotateCb;

    // movement state
    this.moveForward  = false;
    this.moveBackward = false;
    this.moveLeft     = false;
    this.moveRight    = false;

    this.velocity     = new THREE.Vector3();
    this.direction    = new THREE.Vector3();
    this.prevTime     = performance.now();

    // look‑around state (lon/lat)
    this.lon                 = 0;
    this.lat                 = 0;
    this.phi                 = 0;
    this.theta               = 0;
    this.onPointerDownPointerX = 0;
    this.onPointerDownPointerY = 0;
    this.onPointerDownLon    = 0;
    this.onPointerDownLat    = 0;
    this.isUserInteracting   = false;

    // Height for collision origin
    this.cameraHeight = camera.position.y;

    // For pushing pieces
    this.raycaster = new THREE.Raycaster();
    this.onPush    = null;

    this._bindEvents();
  }

  _bindEvents() {
    // keyboard
    window.addEventListener("keydown", this._onKeyDown.bind(this));
    window.addEventListener("keyup",   this._onKeyUp.bind(this));

    // pointer‑lock on click
    this.renderer.domElement.addEventListener("click", () => {
      this.renderer.domElement.requestPointerLock();
    });

    // mouse‑drag to look
    const dom = this.renderer.domElement;
    dom.addEventListener("mousedown", this._onPointerDown.bind(this), false);
    dom.addEventListener("mousemove", this._onPointerMove.bind(this), false);
    dom.addEventListener("mouseup",   this._onPointerUp.bind(this),   false);
  }

  _onKeyDown(e) {
    switch (e.code) {
      case "KeyW": this.moveForward  = true; break;
      case "KeyS": this.moveBackward = true; break;
      case "KeyA": this.moveLeft     = true; break;
      case "KeyD": this.moveRight    = true; break;
      case "Space": this.instantiateCb(); break;
      case "KeyR":   this.rotateCb();      break;
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

  _onPointerDown(event) {
    // only start if pointer is locked (optional)
    this.isUserInteracting = true;
    this.onPointerDownPointerX = event.clientX;
    this.onPointerDownPointerY = event.clientY;
    this.onPointerDownLon = this.lon;
    this.onPointerDownLat = this.lat;
  }

  _onPointerMove(event) {
    if (!this.isUserInteracting) return;
    // scale these to taste
    const movementSpeed = 0.5;
    this.lon = (this.onPointerDownPointerX - event.clientX) * movementSpeed + this.onPointerDownLon;
    this.lat = (event.clientY - this.onPointerDownPointerY) * movementSpeed + this.onPointerDownLat;
    this.computeCameraOrientation();
  }

  _onPointerUp(/*event*/) {
    this.isUserInteracting = false;
  }

  computeCameraOrientation() {
    // clamp lat so we don't flip
    this.lat = Math.max(-85, Math.min(85, this.lat));
    this.phi   = THREE.MathUtils.degToRad(90 - this.lat);
    this.theta = THREE.MathUtils.degToRad(this.lon);

    // project a point in front of the camera
    this.camera.target = new THREE.Vector3(
      500 * Math.sin(this.phi) * Math.cos(this.theta),
      500 * Math.cos(this.phi),
      500 * Math.sin(this.phi) * Math.sin(this.theta)
    );
    this.camera.lookAt(this.camera.target);
  }

  update(nowMs) {
    const delta = (nowMs - this.prevTime) / 1000;
    this.prevTime = nowMs;

    // damp velocity
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // movement direction
    this.direction.z = (this.moveForward  ? 1 : 0) - (this.moveBackward  ? 1 : 0);
    this.direction.x = (this.moveRight    ? 1 : 0) - (this.moveLeft      ? 1 : 0);
    this.direction.normalize();

    const speed = 1000;
    if (this.moveForward  || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
    if (this.moveLeft     || this.moveRight)    this.velocity.x -= this.direction.x * speed * delta;

    const oldPos = this.camera.position.clone();

    // apply movement
    this.camera.translateX(-this.velocity.x * delta);
    this.camera.position.add(this._getForwardDir().multiplyScalar(-this.velocity.z * delta));

    // collisions / pushing
    this._handleCollisions(oldPos);
  }

  _getForwardDir() {
    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    return forward.normalize();
  }

_handleCollisions(oldPos) {
  // 1) Block walking through walls (static only)
  const origin = this.camera.position.clone();
  origin.y -= this.cameraHeight;
  this.raycaster.set(origin, this._getForwardDir());
  const wallHits = this.raycaster.intersectObjects(
    this.scene.children.filter(o => o.userData.static),
    true
  );
  if (wallHits.length) {
    this.camera.position.copy(oldPos);
  }

  // 2) Push dynamic pieces (root groups) via sphere‐box test
  const pushRadius = 15;              // how far your “hand” reaches
  const forward   = this._getForwardDir();

  this.scene.children.forEach((obj) => {
    // only non‑static root groups
    if (obj.userData.static === false && obj.type === "Group") {
      const box     = new THREE.Box3().setFromObject(obj);
      const closest = box.clampPoint(this.camera.position, new THREE.Vector3());
      const dist    = closest.distanceTo(this.camera.position);

      if (dist < pushRadius) {
        const pushAmt = pushRadius - dist;
        obj.position.add(forward.clone().multiplyScalar(pushAmt));
        if (this.onPush) this.onPush(obj.name, obj.position);
      }
    }
  });
}



  setPushCallback(cb) {
    this.onPush = cb;
  }
}



