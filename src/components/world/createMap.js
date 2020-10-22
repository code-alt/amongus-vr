import { DoubleSide, Vector3 } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import skeldModelPath from 'assets/models/skeld.glb';

function createMap(mapData, parent) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  dracoLoader.setDecoderConfig({ type: 'js' });

  const modelLoader = new GLTFLoader();
  modelLoader.setDRACOLoader(dracoLoader);

  const mapConfigPromises = mapData.map(async ({
    name,
    position,
    rotation,
  }) => {
    const model = await modelLoader.loadAsync(skeldModelPath);

    model.scene.name = 'skeld';

    model.scene.traverse(node => {
      if (node.name === 'nav-mesh') {
        node.visible = false;
        node.position.y -= 1;
      }

      if (node.isMesh) {
        node.material.side = DoubleSide;
        node.frustumCulled = false;
        node.material.transparent = true;
      }
    });

    const positionVector = new Vector3(
      position.x,
      position.y,
      position.z,
    );

    const rotationVector = new Vector3(
      rotation.x,
      rotation.y,
      rotation.z,
    );

    model.scene.position.set(...positionVector.toArray());
    model.scene.rotation.set(...rotationVector.toArray());

    parent.add(model.scene);

    return {
      name,
      position,
      rotation,
      model,
    };
  });

  return mapConfigPromises;
}

export default createMap;
