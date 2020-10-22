import React, { useState, useRef, useEffect } from 'react';
import {
  Raycaster,
  Vector3,
  Clock,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  Fog,
  DirectionalLight,
  HemisphereLight,
  Object3D,
  Group,
} from 'three';
import Controls from 'components/Controls';
import VRControllers from 'components/VRControllers';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import innerHeight from 'ios-inner-height';
import { useAppContext } from 'hooks';
import createPlayers from './createPlayers';
import createMap from './createMap';
import { cleanScene, removeLights, cleanRenderer } from 'utils/three';
import './index.css';

const supportsVR = 'xr' in navigator;

const players = [
  {
    color: 'red',
    username: 'Red',
    position: {
      x: 0,
      y: 0,
      z: 4,
    },
    rotation: {
      x: 0,
      y: Math.PI,
      z: 0,
    },
  },
  {
    color: 'blue',
    username: 'Blue',
    position: {
      x: 0,
      y: 0,
      z: -4,
    },
    rotation: {
      x: 0,
      y: -Math.PI,
      z: 0,
    },
  },
  {
    color: 'green',
    username: 'Green',
    position: {
      x: -4,
      y: 0,
      z: 0,
    },
    rotation: {
      x: 0,
      y: Math.PI / -2,
      z: 0,
    },
  },
  {
    color: 'yellow',
    username: 'Yellow',
    position: {
      x: 4,
      y: 0,
      z: 0,
    },
    rotation: {
      x: 0,
      y: Math.PI / 2,
      z: 0,
    },
  },
];

const map = [{
  name: 'skeld',
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  rotation: {
    x: 0,
    y: 0,
    z: 0,
  },
}];

const PLAYER_SPEED = 1;
const PLAYER_VISION = 1;

const World = (props) => {
  const { username } = useAppContext();
  const [loaded, setLoaded] = useState(false);
  const [playerModelData, setPlayerModelData] = useState();
  const [mapModelData, setMapModelData] = useState();
  const playerModels = useRef();
  const mapModels = useRef();
  const animations = useRef([]);
  const canvasRef = useRef();
  const renderer = useRef();
  const camera = useRef();
  const controls = useRef();
  const scene = useRef();
  const lights = useRef();
  const controllers = useRef();
  const navMesh = useRef();
  const player = useRef();
  const raycaster = useRef(new Raycaster());
  const raycasterDirection = useRef(new Vector3(0, -1, 0));
  const oldPosition = useRef(new Vector3());
  const clock = useRef(new Clock());

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
      controllers.current = new VRControllers(renderer.current);
      scene.current.add(controllers.current);
    }

    playerModels.current = new Group();
    mapModels.current = new Group();

    const playerConfigPromises = createPlayers(players, playerModels.current);

    setPlayerModelData(playerConfigPromises);

    const mapConfigPromises = createMap(map, mapModels.current);

    setMapModelData(mapConfigPromises);

    return () => {
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
  }, []);

  useEffect(() => {
    const spotLight = new DirectionalLight(0xFFFFFF);
    const ambientLight = new HemisphereLight(0x000000, 0xFFFFFF);

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
    if (!playerModelData || !mapModelData) return;

    scene.current.add(playerModels.current);
    scene.current.add(mapModels.current);

    const loadScene = async () => {
      const loadedPlayers = await Promise.all(playerModelData);
      await Promise.all(mapModelData);

      loadedPlayers.forEach(model => {
        if (model.mixer) {
          animations.current.push(model.mixer);
        }
      });

      navMesh.current = scene.current.getObjectByName('nav-mesh');

      const playerModel = scene.current.getObjectByName(username);
      playerModel.visible = false;

      player.current = new Object3D();
      player.current.position.set(...playerModel.position.toArray());
      player.current.rotation.set(...playerModel.rotation.toArray());
      player.current.name = 'player';
      scene.current.add(player.current);
      player.current.add(camera.current);
      if (supportsVR) {
        player.current.add(controllers.current);
      }

      controls.current = new Controls(
        player.current,
        camera.current,
        renderer.current,
        PLAYER_SPEED,
      );

      setLoaded(true);
    };

    loadScene();
  }, [playerModelData, mapModelData, username]);

  useEffect(() => {
    const updatePlayers = (delta) => {
      players.forEach(({
        username,
        position,
        rotation,
        moving,
      }, index) => {
        const playerModel = scene.current.getObjectByName(username);

        playerModel.position.x = position.x;
        playerModel.position.y = position.y;
        playerModel.position.z = position.z;

        if (moving) animations.current[index].update(delta);
      });
    };

    const animate = () => {
      oldPosition.current.copy(player.current.position);

      controls.current.update();

      const origin = player.current.position;
      const direction = raycasterDirection.current.normalize();
      raycaster.current.set(origin, direction);

      const collisions = raycaster.current.intersectObject(navMesh.current);
      const diffX = oldPosition.current.x - player.current.position.x;
      const diffZ = oldPosition.current.z - player.current.position.z;

      if (collisions.length === 0) {
        player.current.position.x += diffX;
        player.current.position.z += diffZ;
      };

      const [playerModel] = players.filter(player => player.username === username);
      playerModel.position = player.current.position;
      playerModel.rotation = player.current.rotation;
      playerModel.moving = diffX || diffZ;

      const delta = clock.current.getDelta();
      updatePlayers(delta);

      renderer.current.render(scene.current, camera.current);
    };

    if (loaded) renderer.current.setAnimationLoop(animate);

    return () => {
      renderer.current.setAnimationLoop(null);
    };
  }, [username, loaded]);

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
