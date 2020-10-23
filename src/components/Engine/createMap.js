import { DoubleSide } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import lobbyModelPath from 'assets/models/lobby.glb';
import skeldModelPath from 'assets/models/skeld.glb';

const maps = {
  lobby: lobbyModelPath,
  skeld: skeldModelPath,
}

function createMap(mapData, parent) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  dracoLoader.setDecoderConfig({ type: 'js' });

  const modelLoader = new GLTFLoader();
  modelLoader.setDRACOLoader(dracoLoader);

  const mapConfigPromises = [mapData].map(async name => {
    const model = await modelLoader.loadAsync(maps[name]);

    model.scene.name = name;

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

    model.scene.scale.set(0.5, 0.5, 0.5);

    parent.add(model.scene);

    return {
      name,
      model,
    };
  });

  return mapConfigPromises;
}

export default createMap;
