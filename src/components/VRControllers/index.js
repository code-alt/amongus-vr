import { Group } from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

class VRControllers {
  constructor(renderer) {
    const controllers = new Group();

    const controller1 = renderer.xr.getController(0);
    controller1.name = 'left';
    controllers.add(controller1);

    const controller2 = renderer.xr.getController(1);
    controller2.name = 'right';
    controllers.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    controllers.add(controllerGrip1);

    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    controllers.add(controllerGrip2);
  }
}

export default VRControllers;
