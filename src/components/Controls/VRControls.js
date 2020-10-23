import { Vector3 } from 'three';

class VRControls {
  constructor(target, camera, renderer) {
    this.target = target;
    this.camera = camera;
    this.renderer = renderer;
    this.cameraVector = new Vector3();
    this.prevGamePads = new Map();
  }

  isIterable(obj) {
    // checks for null and undefined
    if (obj === null) return false;

    return typeof obj[Symbol.iterator] === 'function';
  }

  update() {
    let handedness = 'unknown';

    const session = this.renderer.xr.getSession();

    if (session) {
      const xrCamera = this.renderer.xr.getCamera(this.camera);
      xrCamera.getWorldDirection(this.cameraVector);

      if (this.isIterable(session.inputSources)) {
        for (const source of session.inputSources) {
          if (source && source.handedness) {
            // left or right controllers
            handedness = source.handedness;
          }
          if (!source.gamepad) continue;

          const old = this.prevGamePads.get(source);
          const data = {
            handedness,
            axes: source.gamepad.axes.slice(0),
          };

          if (old) {
            const movementSpeed = this.target.speed * 0.1;

            data.axes.forEach((value, i) => {
              if (i === 2) {
                // left and right axis on thumbsticks
                if (data.handedness === 'left') {
                  this.target.position.x -= this.cameraVector.z * movementSpeed * data.axes[2];
                  this.target.position.z += this.cameraVector.x * movementSpeed * data.axes[2];
                }
              }

              if (i === 3) {
                // up and down axis on thumbsticks
                if (data.handedness === 'right') {
                  this.target.position.x -= this.cameraVector.x * movementSpeed * data.axes[3];
                  this.target.position.z -= this.cameraVector.z * movementSpeed * data.axes[3];
                }
              }
            });
          }

          this.prevGamePads.set(source, data);
        }
      }
    }
  }
}

export default VRControls;
