import FPSControls from './FPSControls';
import VRControls from './VRControls';
import vr from 'utils/vr';

class Controls {
  constructor(target, camera, renderer, speed) {
    const isVR = vr(renderer);

    this.controls = isVR
      ? new VRControls(target, camera, renderer, speed)
      : new FPSControls(target, renderer, speed);
  }

  update() {
    this.controls.update();
  }
}

export default Controls;
