import { Clock, Vector3, Euler } from 'three';

class FPSControls {
  /**
   * Constructor
   * @param  {object} object     Object
   * @param  {object} domElement Dom element
   */
  constructor(object, camera, renderer) {
    this.object = object;
    this.camera = camera;
    this.target = new Vector3(0, 0, 0);

    this.domElement = renderer.domElement;

    this.enabled = true;

    this.movementSpeed = 5.0 * (this.object?.speed || 1);
    this.lookSpeed = 0.002;

    this.clock = new Clock();
    this.euler = new Euler(0, 0, 0, 'YXZ');

    this.locked = false;

    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    this.domElement.setAttribute('tabindex', - 1);

    this._contextMenu = this.contextMenu.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);

    this.handleResize();
    this.bindEvents();
  }

  /**
   * HandleResize function
   */
  handleResize() {
    this.viewHalfX = this.domElement.offsetWidth / 2;
    this.viewHalfY = this.domElement.offsetHeight / 2;
  }

  /**
   * BindEvents function
   */
  bindEvents() {
    this.domElement.addEventListener('contextmenu', this._contextmenu, false);
    this.domElement.addEventListener('mousemove', this._onMouseMove, false);
    this.domElement.addEventListener('mousedown', this._onMouseDown, false);

    window.addEventListener('keydown', this._onKeyDown, false);
    window.addEventListener('keyup', this._onKeyUp, false);
  }

  /**
   * OnMouseDown function
   * @param  {object} event Event
   */
  onMouseDown(event) {
    this.domElement.focus();

    event.preventDefault();
    event.stopPropagation();

    this.lock();
  }

  /**
   * OnMouseMove function
   * @param  {object} event Event
   */
  onMouseMove(event) {
    if (!this.locked) return;

		const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		this.euler.setFromQuaternion(this.camera.quaternion);
		this.euler.x -= movementY * this.lookSpeed;
		this.euler.x = Math.max((Math.PI / 2) - this.verticalMax, Math.min((Math.PI / 2) - this.verticalMin, this.euler.x));
		this.camera.quaternion.setFromEuler(this.euler);

    this.euler.setFromQuaternion(this.object.quaternion);
    this.euler.y -= movementX * this.lookSpeed;
    this.object.quaternion.setFromEuler(this.euler);
  }

  /**
   * OnKeyDown function
   * @param  {object} event Event
   */
  onKeyDown(event) {
    switch (event.keyCode) {
      case 27: /*esc*/ this.unlock(); break;

      case 38: /*up*/
      case 87: /*W*/ this.moveForward = true; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = true; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = true; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = true; break;

      default: break;
    }
  }

  /**
   * OnKeyUp function
   * @param  {object} event Event
   */
  onKeyUp(event) {
    switch (event.keyCode) {
      case 38: /*up*/
      case 87: /*W*/ this.moveForward = false; break;

      case 37: /*left*/
      case 65: /*A*/ this.moveLeft = false; break;

      case 40: /*down*/
      case 83: /*S*/ this.moveBackward = false; break;

      case 39: /*right*/
      case 68: /*D*/ this.moveRight = false; break;

      default: break;
    }
  }

  /**
   * Update function
   */
  update() {
    if (this.enabled === false) return;

    const delta = this.clock.getDelta();
    const actualMoveSpeed = delta * this.movementSpeed;

    if (this.moveForward || (this.autoForward && ! this.moveBackward)) this.object.translateZ(-actualMoveSpeed);
    if (this.moveBackward) this.object.translateZ(actualMoveSpeed);

    if (this.moveLeft) this.object.translateX(-actualMoveSpeed);
    if (this.moveRight) this.object.translateX(actualMoveSpeed);
  }

  lock() {
    this.domElement.requestPointerLock = this.domElement.requestPointerLock || this.domElement.mozRequestPointerLock || this.domElement.webkitRequestPointerLock;
    this.domElement.requestPointerLock();

    this.locked = true;
  }

  unlock() {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    document.exitPointerLock();

    this.locked = false;
  }

  /**
   * ContextMenu function
   * @param  {object} event Event
   */
  contextMenu(event) {
    event.preventDefault();
  }

  /**
   * Dispose function
   */
  dispose() {
    this.domElement.removeEventListener('contextmenu', this._contextmenu, false);
    this.domElement.removeEventListener('mousemove', this._onMouseMove, false);

    window.removeEventListener('keydown', this._onKeyDown, false);
    window.removeEventListener('keyup', this._onKeyUp, false);

    this.unlock();
  }
}

export default FPSControls;
