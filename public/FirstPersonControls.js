// public/FirstPersonControls.js
import * as THREE from "three";

export class FirstPersonControls {
  constructor(scene, camera, renderer, instantiateCb, rotateCb) {
    this.scene         = scene;
    this.camera        = camera;
    this.renderer      = renderer;
    this.instantiateCb = instantiateCb;
    this.rotateCb      = rotateCb;

    // Movement flags
    this.moveForward  = false;
    this.moveBackward = false;
    this.moveLeft     = false;
    this.moveRight    = false;

    // Motion state
    this.velocity  = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.prevTime  = performance.now();

    // Look state
    this.lat       = 0;        // pitch in degrees
    this.lon       = 0;        // yaw in degrees
    this.lookSpeed = 0.3;      // deg per pixel
    this.euler     = new THREE.Euler(0, 0, 0, "YXZ");
    this.isLocked  = false;

    // Height for collisions
    this.cameraHeight = camera.position.y;

    // For pushing pieces
    this.raycaster = new THREE.Raycaster();
    this.onPush    = null;

    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard
    window.addEventListener("keydown", this._onKeyDown.bind(this));
    window.addEventListener("keyup",   this._onKeyUp.bind(this));

    // Pointer-lock
    const dom = this.renderer.domElement;
    dom.addEventListener("click", () => dom.requestPointerLock());
    document.addEventListener("pointerlockchange", () => {
      this.isLocked = document.pointerLockElement === dom;
    });

    // Mouse look when locked
    document.addEventListener("mousemove", this._onMouseMove.bind(this));
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

  _onMouseMove(e) {
    if (!this.isLocked) return;  // only rotate when locked
    // update yaw (lon) and pitch (lat)
    this.lon  -= e.movementX * this.lookSpeed;
    this.lat  -= e.movementY * this.lookSpeed;
    // clamp pitch to [-85,85]
    this.lat = Math.max(-85, Math.min(85, this.lat));
  }

  update(nowMs) {
    const delta = (nowMs - this.prevTime) / 1000;
    this.prevTime = nowMs;

    // —— Apply look every frame via Euler YXZ —— 
    this.euler.set(
      THREE.MathUtils.degToRad(this.lat),
      THREE.MathUtils.degToRad(this.lon),
      0
    );
    this.camera.quaternion.setFromEuler(this.euler);

    // —— Movement —— 
    // Dampen
    this.velocity.x -= this.velocity.x * 10 * delta;
    this.velocity.z -= this.velocity.z * 10 * delta;

    // Get input direction
    this.direction.z = (this.moveForward  ? 1 : 0) - (this.moveBackward ? 1 : 0);
    this.direction.x = (this.moveRight    ? 1 : 0) - (this.moveLeft     ? 1 : 0);
    this.direction.normalize();

    const speed = 1000;
    if (this.direction.z) this.velocity.z -= this.direction.z * speed * delta;
    if (this.direction.x) this.velocity.x -= this.direction.x * speed * delta;

    // Save old position for collision rollback
    const oldPos = this.camera.position.clone();

    // Strafe & forward/back
    this.camera.translateX(-this.velocity.x * delta);
    this.camera.position.add(this._getForwardDir().multiplyScalar(-this.velocity.z * delta));

    // Handle collisions & pushing
    this._handleCollisions(oldPos);
  }

  _getForwardDir() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    dir.y = 0;
    return dir.normalize();
  }

  _handleCollisions(oldPos) {
    // Block very‑close walls
    const origin = this.camera.position.clone();
    origin.y -= this.cameraHeight;
    this.raycaster.set(origin, this._getForwardDir());
    const wallHits = this.raycaster.intersectObjects(
      this.scene.children.filter(o => o.userData.static),
      true
    );
    if (wallHits.length && wallHits[0].distance < 10) {
      this.camera.position.copy(oldPos);
    }

    // Pushable pieces
    const pushRadius = 15, forward = this._getForwardDir();
    this.scene.children.forEach(obj => {
      if (obj.type === "Group" && obj.userData.static === false) {
        const box     = new THREE.Box3().setFromObject(obj);
        const closest = box.clampPoint(this.camera.position, new THREE.Vector3());
        const dist    = closest.distanceTo(this.camera.position);
        if (dist < pushRadius) {
          obj.position.add(forward.clone().multiplyScalar(pushRadius - dist));
          if (this.onPush) this.onPush(obj.name, obj.position);
        }
      }
    });
  }

  setPushCallback(cb) {
    this.onPush = cb;
  }
}




