import { Object3D } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import stages from './stages';

class Stage {
  constructor(name) {
    this.mesh = new Object3D();

    this.init(name);
  }

  async init(name) {
    this.mesh.name = name;

    const stage = await Promise.resolve(this.loadStage(name));

    this.mesh.add(stage);

    return this.mesh;
  }

  async loadStage(name) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const modelLoader = new GLTFLoader();
    modelLoader.setDRACOLoader(dracoLoader);

    const model = await modelLoader.loadAsync(stages[name]);

    model.scene.traverse(node => {
      if (node.name === 'nav-mesh') {
        node.visible = false;
        node.position.y -= 1;
        this.navMesh = node;
      } else if (node.isMesh) {
        node.material.depthWrite = !node.material.transparent;
      }
    });

    return model.scene;
  }
}

export default Stage;
