import { Clock } from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

class FPSControls {
  constructor(target, renderer, speed) {
    this.target = target;
    this.renderer = renderer;
    this.clock = new Clock();

    this.controls = new FirstPersonControls(this.target, this.renderer.domElement);
    this.controls.lookSpeed = 0.1;
    this.controls.movementSpeed = 5 * speed;
    this.controls.lookVertical = false;
  }

  update() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }
}

export default FPSControls;
