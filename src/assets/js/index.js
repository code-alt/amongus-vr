import {
  Clock,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  Fog,
  HemisphereLight,
  DirectionalLight,
  AnimationMixer,
  Texture,
  SpriteMaterial,
  Sprite,
  TextureLoader,
  MeshBasicMaterial,
  Group,
} from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'https://unpkg.com/three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'https://unpkg.com/three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';

const PLAYER_SPEED = 1;
const PLAYER_VISION = 1;

let renderer, camera, controls, scene;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let username, skeld, mixer, astronaut, player;

const clock = new Clock();
const cameraVector = new Vector3();
const prevGamePads = new Map();

init();
animate();

function init() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true;
  renderer.xr.setFramebufferScaleFactor(2.0);
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 1.6, 3);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.update();

  scene = new Scene();
  scene.fog = new Fog(0x000000, 1, 30 * PLAYER_VISION);

  scene.add(new HemisphereLight(0x000000, 0xffffff));

  const light = new DirectionalLight(0xffffff);
  light.position.set(0, 200, 0);
  light.castShadow = true;
  light.shadow.camera.top = 200;
  light.shadow.camera.bottom = -200;
  light.shadow.camera.right = 200;
  light.shadow.camera.left = -200;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  controller1 = renderer.xr.getController(0);
  controller1.name = 'left';
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.name = 'right';
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.font = '48px Arial';
  context.fillText('Red', size / 2, size / 2);

  const texture = new Texture(canvas);
  texture.needsUpdate = true;

  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
  });

  username = new Sprite(material);
  username.position.y = 1.7;
  scene.add(username);

  const modelLoader = new GLTFLoader();

  modelLoader.load('/assets/models/skeld.glb', (model) => {
    skeld = model.scene;

    skeld.traverse(node => {
      if (node.isMesh) {
        node.frustumCulled = false;

        if (node.name === 'mesh_0_79_79') {
          node.material.transparent = true;
        };
      }
    });

    skeld.position.set(-67.5, -8.9, 13);
    skeld.scale.set(24, 24, 24);
    scene.add(skeld);
  });

  modelLoader.load('/assets/models/red.glb', (model) => {
    astronaut = model.scene;

    const textureLoader = new TextureLoader();

    astronaut.traverse(node => {
      if (node.isMesh && node.material.name === 'Astronaut') {
        const texture = textureLoader.load('/assets/textures/red1.png');
        texture.encoding = sRGBEncoding;
        const material = new MeshBasicMaterial({ map: texture });
        material.skinning = true;

        node.material = material;
      } else if (node.isMesh && node.material.name === 'Astronaut_backpack') {
        const texture = textureLoader.load('/assets/textures/red2.png');
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

    mixer = new AnimationMixer(astronaut);
    mixer.clipAction(model.animations[0]).play();

    astronaut.scale.set(0.32, 0.32, 0.32);
    scene.add(astronaut);

    player = new Group();
    player.position.set(0, 0, 0);
    player.name = 'player';
    scene.add(player);
    player.add(username);
    player.add(astronaut);
    player.add(camera);
    player.add(controller1);
    player.add(controller2);
    player.add(controllerGrip1);
    player.add(controllerGrip2);
  });

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  rotatePlayer();
  movePlayer();

  renderer.render(scene, camera);
}

function rotatePlayer() {
  if (astronaut) {
    const session = renderer.xr.getSession();
    const cameraRef = session ? renderer.xr.getCamera(camera) : camera;

    const diffX = camera.position.x - astronaut.position.x;
    const diffZ = camera.position.z - astronaut.position.z;

    astronaut.rotation.y = Math.atan2(diffX, diffZ) + Math.PI;
  }
}

function movePlayer() {
  let handedness = 'unknown';

  const session = renderer.xr.getSession();

  if (session) {
    const xrCamera = renderer.xr.getCamera(camera);
    xrCamera.getWorldDirection(cameraVector);

    if (isIterable(session.inputSources)) {
      for (const source of session.inputSources) {
        if (source && source.handedness) {
          // left or right controllers
          handedness = source.handedness;
        }
        if (!source.gamepad) continue;

        const old = prevGamePads.get(source);
        const data = {
          handedness,
          axes: source.gamepad.axes.slice(0),
        };

        if (old) {
          const movementSpeed = PLAYER_SPEED * 0.1;

          if (mixer) {
            const delta = clock.getDelta();
            mixer.update(delta);
          }

          data.axes.forEach((value, i) => {
            if (i === 2) {
              // left and right axis on thumbsticks
              if (data.handedness === 'left') {
                player.position.x -= cameraVector.z * movementSpeed * data.axes[2];
                player.position.z += cameraVector.x * movementSpeed * data.axes[2];
              }

              controls.update();
            }

            if (i === 3) {
              // up and down axis on thumbsticks
              if (data.handedness === 'left') {
                player.position.y -= movementSpeed * data.axes[3];
              } else {
                player.position.x -= cameraVector.x * movementSpeed * data.axes[3];
                player.position.z -= cameraVector.z * movementSpeed * data.axes[3];
              }

              controls.update();
            }
          });
        }

        prevGamePads.set(source, data);
      }
    }
  }
}

function isIterable(obj) {
  // checks for null and undefined
  if (obj === null) return false;

  return typeof obj[Symbol.iterator] === 'function';
}
