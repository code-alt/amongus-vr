import React, { useEffect, useRef } from 'react';
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
  DoubleSide,
  Group,
} from 'three';
import Controls from 'components/Controls';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import innerHeight from 'ios-inner-height';
import { useAppContext } from 'hooks';
import { cleanScene, removeLights, cleanRenderer } from 'utils/three';
import skeldModelPath from 'assets/models/skeld.glb';
import astronautModelPath from 'assets/models/astronaut.glb';
import textures from './textures';
import './index.css';

const PLAYER_SPEED = 1;
const PLAYER_VISION = 1;

const World = (props) => {
  const supportsVR = 'xr' in navigator;
  const { username, color } = useAppContext();
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
  const nav = useRef();
  const mixer = useRef();
  const astronaut = useRef();
  const player = useRef();
  const raycaster = useRef(new Raycaster());
  const raycasterDirection = useRef(new Vector3(0, -1, 0));
  const oldPosition = useRef(new Vector3());

  useEffect(() => {
    const { innerWidth, innerHeight } = window;
    renderer.current = new WebGLRenderer({
      canvas: canvasRef.current,
      powerPreference: 'high-performance',
      antialias: true,
    });
    renderer.current.setSize(innerWidth, innerHeight);
    renderer.current.setPixelRatio(2);
    renderer.current.outputEncoding = sRGBEncoding;
    renderer.current.shadowMap.enabled = true;
    renderer.current.xr.enabled = true;
    renderer.current.xr.setFramebufferScaleFactor(2.0);
    if (supportsVR) document.body.appendChild(VRButton.createButton(renderer.current));

    camera.current = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
    camera.current.position.set(0, 1.6, 0);

    scene.current = new Scene();
    scene.current.fog = new Fog(0x000000, 1, 30 * PLAYER_VISION);

    if (supportsVR) {
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
    }

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

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const modelLoader = new GLTFLoader();
    modelLoader.setDRACOLoader(dracoLoader);

    modelLoader.load(skeldModelPath, (model) => {
      skeld.current = model.scene;

      skeld.current.traverse(node => {
        if (node.isMesh) {
          if (node.name === 'nav-mesh') {
            node.visible = false;
            node.position.y -= 1;
            nav.current = node;
          }

          node.material.side = DoubleSide;
          node.frustumCulled = false;
          node.material.transparent = true;
        }
      });

      skeld.current.position.z = -4;

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
      if (supportsVR) {
        player.current.add(controller1.current);
        player.current.add(controller2.current);
        player.current.add(controllerGrip1.current);
        player.current.add(controllerGrip2.current);
      }

      controls.current = new Controls(
        player.current,
        camera.current,
        renderer.current,
        PLAYER_SPEED,
      );
    });

    return () => {
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
  }, [supportsVR, username, color]);

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
      if (player.current && nav.current) {
        oldPosition.current.copy(player.current.position);

        if (astronaut.current) {
          const session = renderer.current.xr.getSession();
          const cameraRef = session ? renderer.current.xr.getCamera(camera.current) : camera.current;

          const diffX = cameraRef.position.x - astronaut.current.position.x;
          const diffZ = cameraRef.position.z - astronaut.current.position.z;

          astronaut.current.rotation.y = Math.atan2(diffX, diffZ);
        }

        controls.current.update();

        const origin = player.current.position;
        const direction = raycasterDirection.current.normalize();
        raycaster.current.set(origin, direction);

        const collisions = raycaster.current.intersectObject(nav.current);

        const diffX = oldPosition.current.x - player.current.position.x;
        const diffZ = oldPosition.current.z - player.current.position.z;

        if ((diffX || diffZ) && mixer.current) {
          const delta = clock.current.getDelta();
          mixer.current.update(delta);
        }

        if (collisions.length === 0) {
          player.current.position.x += diffX;
          player.current.position.z += diffZ;
        };
      }

      renderer.current.render(scene.current, camera.current);
    };

    renderer.current.setAnimationLoop(animate);

    return () => {
      renderer.current.setAnimationLoop(null);
    };
  }, []);

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
