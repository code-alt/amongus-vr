import FPSControls from './FPSControls';
import VRControls from './VRControls';
import vr from 'utils/vr';

class Controls {
  constructor(target, camera, renderer) {
    const isVR = vr(renderer);

    this.controls = isVR
      ? new VRControls(target, camera, renderer)
      : new FPSControls(target, camera, renderer);
  }

  update() {
    this.controls.update();
  }
}

export default Controls;
