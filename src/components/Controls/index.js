import FPSControls from './FPSControls';
import VRControls from './VRControls';

class Controls {
  constructor(target, camera, renderer, speed) {
    const supportsVR = 'xr' in navigator;

    this.controls = supportsVR
      ? new VRControls(target, camera, renderer, speed)
      : new FPSControls(target, renderer, speed);
  }

  update() {
    this.controls.update();
  }
}

export default Controls;
