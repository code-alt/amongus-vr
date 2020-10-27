import FPSControls from './FPSControls';
import VRControls from './VRControls';
import isVR from 'utils/isVR';

class Controls {
  constructor(target, camera, renderer) {
    this.controls = isVR
      ? new VRControls(target, camera, renderer)
      : new FPSControls(target, camera, renderer);
  }

  update() {
    this.controls.update();
  }
}

export default Controls;
