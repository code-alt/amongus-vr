import { Clock } from 'three';
import FirstPersonControls from './FirstPersonControls';

class FPSControls {
  constructor(target, renderer) {
    this.target = target;
    this.renderer = renderer;
    this.clock = new Clock();

    this.controls = new FirstPersonControls(this.target, this.renderer.domElement);
    this.controls.lookSpeed = 0.1;
    this.controls.movementSpeed = 5 * target.speed;
    this.controls.lookVertical = false;
  }

  update() {
    const delta = this.clock.getDelta();
    this.controls.update(delta);
  }
}

export default FPSControls;
