import { Object3D, DoubleSide } from 'three';
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
      }

      if (node.isMesh) {
        node.material.side = DoubleSide;
        node.frustumCulled = false;
        node.material.transparent = true;
      }
    });

    if (name === 'lobby') {
      model.scene.scale.set(0.5, 0.5, 0.5);
    }

    return model.scene;
  }
}

export default Stage;
