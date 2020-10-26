import {
  Clock,
  Vector3,
  Object3D,
  Texture,
  SpriteMaterial,
  NormalBlending,
  Sprite,
  TextureLoader,
  MeshBasicMaterial,
  sRGBEncoding,
  AnimationMixer,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cleanMaterial } from 'utils/three';
import astronautModelPath from 'assets/models/astronaut.glb';
import textures from './textures';

class Player {
  constructor({
    username,
    color = 'red',
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    rotation = {
      x: 0,
      y: 0,
      z: 0,
    },
  }) {
    this.mesh = new Object3D();
    this.clock = new Clock();
    this.loaded = false;

    this.createPlayer({ username, color, position, rotation });
  }

  async createPlayer({ username, color, position, rotation }) {
    this.mesh.name = username;

    const label = this.createUsername(username);
    const astronaut = await Promise.resolve(this.createAstronaut(color));

    this.mesh.add(label);
    this.mesh.add(astronaut);

    const positionVector = new Vector3(
      position.x,
      position.y,
      position.z,
    );

    this.mesh.position.set(...positionVector.toArray());
    this.position = position;

    const rotationVector = new Vector3(
      rotation.x,
      rotation.y,
      rotation.z,
    );

    this.mesh.rotation.set(...rotationVector.toArray());
    this.rotation = rotation;

    this.loaded = true;

    return this.mesh;
  }

  createUsername(username) {
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
      blending: NormalBlending,
      depthTest: true,
      transparent: true,
    });

    const label = new Sprite(labelMaterial);
    label.position.y = 1.7;

    return label;
  }

  async createAstronaut(color) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const modelLoader = new GLTFLoader();
    modelLoader.setDRACOLoader(dracoLoader);

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

    this.mixer = mixer;

    model.scene.scale.set(0.32, 0.32, 0.32);
    model.scene.rotation.y = Math.PI;

    return model.scene;
  }

  update({ position, rotation }) {
    if (this.loaded) {
      const diffX = position?.x !== this.position.x;
      const diffZ = position?.z !== this.position.z;

      const diffY = rotation?.y !== this.rotation.y;

      const isMoving = Boolean(diffX || diffZ);
      const isRotating = Boolean(diffY);

      if (isMoving) {
        const positionUpdate = Object.assign(this.position, position);

        const positionVector = new Vector3(
          positionUpdate.x,
          positionUpdate.y,
          positionUpdate.z,
        );

        this.mesh.position.set(...positionVector.toArray());
        this.position = positionUpdate;

        const delta = this.clock.getDelta();
        this.mixer.update(delta);
      } else if (this.mixer.time !== 0.15) {
        this.mixer.setTime(0.15);
      }

      if (isRotating) {
        const rotationUpdate = Object.assign(this.rotation, rotation);

        const rotationVector = new Vector3(
          rotationUpdate.x,
          rotationUpdate.y,
          rotationUpdate.z,
        );

        this.mesh.rotation.set(...rotationVector.toArray());
        this.rotation = rotationUpdate;
      };
    }
  }

  dispose() {
    this.mesh.traverse(node => {
      if (!node.isMesh) return;

      node.geometry.dispose();

      if (node.material.isMaterial) {
        cleanMaterial(node.material);
      } else {
        for (const material of node.material) {
          cleanMaterial(material);
        }
      }
    });
  }
}

export default Player;
