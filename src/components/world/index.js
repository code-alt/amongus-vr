import React, { useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  Vector3,
  Raycaster,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  Fog,
  DirectionalLight,
  HemisphereLight,
  AnimationMixer,
  Texture,
  SpriteMaterial,
  Sprite,
  TextureLoader,
  MeshBasicMaterial,
  Group,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import innerHeight from 'ios-inner-height';
import { useAppContext } from 'hooks';
import { renderPixelRatio, cleanScene, removeLights, cleanRenderer } from 'utils/three';
import skeldModelPath from 'assets/models/skeld.glb';
import astronautModelPath from 'assets/models/astronaut.glb';
import textures from './textures';
import './index.css';

function isIterable(obj) {
  // checks for null and undefined
  if (obj === null) return false;

  return typeof obj[Symbol.iterator] === 'function';
}

const PLAYER_SPEED = 1;
const PLAYER_VISION = 1;

const World = (props) => {
  const { username, color } = useAppContext();
  const width = useRef(window.innerWidth);
  const height = useRef(window.innerHeight);
  const clock = useRef(new Clock());
  const canvasRef = useRef();
  const renderer = useRef();
  const camera = useRef();
  const controls = useRef();
  const scene = useRef();
  const lights = useRef();
  const controller1 = useRef();
  const controller2 = useRef();
  const controllerGrip1 = useRef();
  const controllerGrip2 = useRef();
  const playerLabel = useRef();
  const skeld = useRef();
  const mixer = useRef();
  const astronaut = useRef();
  const player = useRef();
  const cameraVector = useRef(new Vector3());
  const prevGamePads = useRef(new Map());
  const wallNodes = useRef([]);
  const raycaster = useRef(new Raycaster());

  const rotatePlayer = () => {
    if (astronaut.current) {
      const session = renderer.current.xr.getSession();
      const cameraRef = session ? renderer.current.xr.getCamera(camera.current) : camera.current;

      const diffX = cameraRef.position.x - astronaut.current.position.x;
      const diffZ = cameraRef.position.z - astronaut.current.position.z;

      astronaut.current.rotation.y = Math.atan2(diffX, diffZ) + Math.PI;
    }
  };

  const movePlayer = useCallback(() => {
    let handedness = 'unknown';

    const session = renderer.current.xr.getSession();

    if (session) {
      const xrCamera = renderer.current.xr.getCamera(camera.current);
      xrCamera.getWorldDirection(cameraVector.current);

      if (isIterable(session.inputSources)) {
        for (const source of session.inputSources) {
          if (source && source.handedness) {
            // left or right controllers
            handedness = source.handedness;
          }
          if (!source.gamepad) continue;

          const old = prevGamePads.current.get(source);
          const data = {
            handedness,
            axes: source.gamepad.axes.slice(0),
          };

          if (old) {
            const movementSpeed = PLAYER_SPEED * 0.1;

            if (mixer) {
              const delta = clock.current.getDelta();
              mixer.current.update(delta);
            }

            data.axes.forEach((value, i) => {
              if (i === 2) {
                // left and right axis on thumbsticks
                if (data.handedness === 'left') {
                  player.current.position.x -= cameraVector.current.z * movementSpeed * data.axes[2];
                  player.current.position.z += cameraVector.current.x * movementSpeed * data.axes[2];
                }

                controls.current.update();
              }

              if (i === 3) {
                // up and down axis on thumbsticks
                if (data.handedness === 'right') {
                  player.current.position.x -= cameraVector.current.x * movementSpeed * data.axes[3];
                  player.current.position.z -= cameraVector.current.z * movementSpeed * data.axes[3];
                }

                controls.current.update();
              }

              const cameraRef = session ? renderer.current.xr.getCamera(camera.current) : camera.current;

              const origin = player.current.position;
              const direction = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), cameraRef.rotation.y);
              raycaster.current.set(origin, direction);

              const collisions = raycaster.current.intersectObjects(wallNodes.current);
              if (collisions.length > 0 && collisions[0].distance <= 1) {
                if (data.handedness === 'left') {
                  player.current.position.x += cameraVector.current.z * movementSpeed * data.axes[2];
                  player.current.position.z -= cameraVector.current.x * movementSpeed * data.axes[2];
                }

                if (data.handedness === 'right') {
                  player.current.position.x += cameraVector.current.x * movementSpeed * data.axes[3];
                  player.current.position.z += cameraVector.current.z * movementSpeed * data.axes[3];
                }

                controls.current.update();
              };
            });
          }

          prevGamePads.current.set(source, data);
        }
      }
    }
  }, []);

  useEffect(() => {
    renderer.current = new WebGLRenderer({
      canvas: canvasRef.current,
      powerPreference: 'high-performance',
      antialias: true,
    });
    renderer.current.setSize(width.current, height.current);
    renderer.current.setPixelRatio(renderPixelRatio);
    renderer.current.outputEncoding = sRGBEncoding;
    renderer.current.shadowMap.enabled = true;
    renderer.current.xr.enabled = true;
    renderer.current.xr.setFramebufferScaleFactor(2.0);
    if ('xr' in navigator) document.body.appendChild(VRButton.createButton(renderer.current));

    camera.current = new PerspectiveCamera(50, width.current / height.current, 0.1, 500);
    camera.current.position.set(0, 1.6, 3);

    controls.current = new OrbitControls(camera.current, renderer.current.domElement);
    controls.current.target.set(0, 1.6, 0);
    controls.current.update();

    scene.current = new Scene();
    scene.current.fog = new Fog(0x000000, 1, 30 * PLAYER_VISION);

    controller1.current = renderer.current.xr.getController(0);
    controller1.current.name = 'left';
    scene.current.add(controller1.current);

    controller2.current = renderer.current.xr.getController(1);
    controller2.current.name = 'right';
    scene.current.add(controller2.current);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1.current = renderer.current.xr.getControllerGrip(0);
    controllerGrip1.current.add(controllerModelFactory.createControllerModel(controllerGrip1.current));
    scene.current.add(controllerGrip1.current);

    controllerGrip2.current = renderer.current.xr.getControllerGrip(1);
    controllerGrip2.current.add(controllerModelFactory.createControllerModel(controllerGrip2.current));
    scene.current.add(controllerGrip2.current);

    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.font = '48px Arial';
    context.fillText(username, size / 2, size / 2);

    const playerLabelTexture = new Texture(canvas);
    playerLabelTexture.needsUpdate = true;

    const playerLabelMaterial = new SpriteMaterial({
      map: playerLabelTexture,
      transparent: true,
    });

    playerLabel.current = new Sprite(playerLabelMaterial);
    playerLabel.current.position.y = 1.7;
    scene.current.add(playerLabel.current);

    const modelLoader = new GLTFLoader();

    modelLoader.load(skeldModelPath, (model) => {
      skeld.current = model.scene;

      skeld.current.traverse(node => {
        if (node.isMesh) {
          node.frustumCulled = false;
          node.material.transparent = true;

          wallNodes.current.push(node);
        }
      });

      scene.current.add(skeld.current);
    });

    modelLoader.load(astronautModelPath, (model) => {
      astronaut.current = model.scene;

      const textureLoader = new TextureLoader();

      astronaut.current.traverse(node => {
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

      mixer.current = new AnimationMixer(astronaut.current);
      mixer.current.clipAction(model.animations[0]).play();

      astronaut.current.scale.set(0.32, 0.32, 0.32);
      scene.current.add(astronaut.current);

      player.current = new Group();
      player.current.position.set(0, 0, 0);
      player.current.name = 'player';
      scene.current.add(player.current);
      player.current.add(playerLabel.current);
      player.current.add(astronaut.current);
      player.current.add(camera.current);
      player.current.add(controller1.current);
      player.current.add(controller2.current);
      player.current.add(controllerGrip1.current);
      player.current.add(controllerGrip2.current);
    });

    return () => {
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
  }, [username, color]);

  useEffect(() => {
    const spotLight = new DirectionalLight(0xFFFFFF);
    const ambientLight = new HemisphereLight(0x000000, 0xffffff);

    spotLight.position.set(0, 200, 0);
    spotLight.castShadow = true;
    spotLight.shadow.camera.top = 200;
    spotLight.shadow.camera.bottom = -200;
    spotLight.shadow.camera.right = 200;
    spotLight.shadow.camera.left = -200;
    spotLight.shadow.mapSize.set(4096, 4096);

    lights.current = [spotLight, ambientLight];
    lights.current.forEach(light => scene.current.add(light));

    return () => {
      removeLights(lights.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvasHeight = innerHeight();
      const windowWidth = window.innerWidth;
      canvasRef.current.style.height = canvasHeight;
      renderer.current.setSize(windowWidth, canvasHeight);
      camera.current.aspect = windowWidth / canvasHeight;
      camera.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      rotatePlayer();
      movePlayer();

      renderer.current.render(scene.current, camera.current);
    };

    renderer.current.setAnimationLoop(animate);

    return () => {
      renderer.current.setAnimationLoop(null);
    };
  }, [movePlayer]);

  return (
    <canvas
      aria-hidden
      className="world"
      ref={canvasRef}
      {...props}
    />
  );
};

export default World;
