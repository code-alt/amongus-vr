import {
  Object3D,
  Texture,
  SpriteMaterial,
  Sprite,
  TextureLoader,
  MeshBasicMaterial,
  sRGBEncoding,
  AnimationMixer,
  Vector3,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import astronautModelPath from 'assets/models/astronaut.glb';
import textures from './textures';

function createPlayers(playerData, parent) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  dracoLoader.setDecoderConfig({ type: 'js' });

  const modelLoader = new GLTFLoader();
  modelLoader.setDRACOLoader(dracoLoader);

  const playerConfigPromises = [playerData].map(async ({
    color,
    username,
    position,
    rotation,
  }) => {
    const playerGroup = new Object3D();
    playerGroup.name = username;

    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    context.fillStyle = '#FFFFFF';
    context.textAlign = 'center';
    context.font = '48px Arial';
    context.fillText(username, size / 2, size / 2);

    const labelTexture = new Texture(canvas);
    labelTexture.needsUpdate = true;

    const labelMaterial = new SpriteMaterial({
      map: labelTexture,
      transparent: true,
    });

    const label = new Sprite(labelMaterial);
    label.position.y = 1.7;
    playerGroup.add(label);

    const model = await modelLoader.loadAsync(astronautModelPath);
    const textureLoader = new TextureLoader();

    model.scene.traverse(node => {
      if (node.isMesh && node.material.name === 'Astronaut') {
        const texture = textureLoader.load(textures[`${color}1`]);
        texture.encoding = sRGBEncoding;
        const material = new MeshBasicMaterial({ map: texture });
        material.skinning = true;

        node.material = material;
      } else if (node.isMesh && node.material.name === 'Astronaut_backpack') {
        const texture = textureLoader.load(textures[`${color}2`]);
        texture.encoding = sRGBEncoding;
        const material = new MeshBasicMaterial({ map: texture });
        material.skinning = true;

        node.material = material;
      } else if (node.isMesh) {
        const material = new MeshBasicMaterial({ color: 0x000000 });
        material.skinning = true;

        node.material = material;
      }
    });

    const mixer = new AnimationMixer(model.scene);
    mixer.clipAction(model.animations[0]).play();
    playerGroup.mixer = mixer;

    model.scene.scale.set(0.32, 0.32, 0.32);
    model.scene.rotation.y = Math.PI;
    playerGroup.add(model.scene);

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

    playerGroup.position.set(...positionVector.toArray());
    playerGroup.rotation.set(...rotationVector.toArray());

    parent.add(playerGroup);

    return {
      color,
      username,
      position,
      label,
      model,
      mixer,
    };
  });

  return playerConfigPromises;
}

export default createPlayers;
