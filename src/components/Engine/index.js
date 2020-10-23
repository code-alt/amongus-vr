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
import { database } from 'utils/firebase';
import './index.css';

const supportsVR = 'xr' in navigator;

const PLAYER_SPEED = 1;
const PLAYER_VISION = 1;

const World = ({ id, map, ...rest }) => {
  const { username } = useAppContext();
  const [loaded, setLoaded] = useState(false);
  const [mapModelData, setMapModelData] = useState();
  const mapModels = useRef();
  const playerModels = useRef([]);
  const players = useRef([]);
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

    mapModels.current = new Group();

    const mapConfigPromises = createMap(map, mapModels.current);

    setMapModelData(mapConfigPromises);

    return () => {
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
  }, [map]);

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
    const loadPlayer = async (playerData) => {
      const playerConfigPromise = createPlayers(playerData, scene.current);

      const loadedPlayer = await Promise.resolve(playerConfigPromise);
      playerModels.current[loadedPlayer.username] = loadedPlayer;

      if (loadedPlayer.username === username) loadedPlayer.visible = false;

      return loadedPlayer;
    };

    const updatePlayer = (snap) => {
      const data = snap.val();

      if (data) {
        const { username, position, rotation, moving } = data;
        const playerModel = scene.current.getObjectByName(username);

        if (playerModel) {
          playerModel.position.x = position.x;
          playerModel.position.y = position.y;
          playerModel.position.z = position.z;

          playerModel.rotation.y = rotation.y;

          const delta = clock.current.getDelta();
          if (moving) playerModel.mixer.update(delta);
        }
      }
    };

    const ref = database.ref(`lobbies/${id}`);

    ref.child('players').on('child_added', snap => {
      const data = snap.val();

      if (data) {
        if (data.username !== username) {
          if (!players.current[username]) {
            loadPlayer(data);
            ref.child(`players/${data.username}`).on('value', updatePlayer);
          }
        }
      }
    });

    ref.child('players').on('child_removed', snap => {
      const data = snap.val();

      if (data) {
        ref.child(`players/${data.username}`).off('value', updatePlayer);
        scene.current.remove(scene.current.getObjectByName(data.username));

        const playerEntry = players.current.filter(player => player.username === username);
        const playerIndex = players.current.indexOf(playerEntry);
        players.current.slice(playerIndex, 1);
      }
    });

    return () => {
      ref.child(`players/${username}`).remove();
    };
  }, [id, username]);

  useEffect(() => {
    if (!mapModelData) return;

    scene.current.add(mapModels.current);

    const loadScene = async () => {
      await Promise.all(mapModelData);

      navMesh.current = scene.current.getObjectByName('nav-mesh');

      player.current = new Object3D();
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

      const position = new Vector3(0, 0, 4);
      const rotation = new Vector3(0, Math.PI, 0);

      const ref = database.ref(`/lobbies/${id}`);
      ref.child(`players/${username}`).set({
        color: 'red',
        username,
        moving: false,
        position,
        rotation,
      });

      player.current.position.set(...position.toArray());
      player.current.rotation.set(...rotation.toArray());

      setLoaded(true);
    };

    loadScene();
  }, [mapModelData, username, id]);

  useEffect(() => {
    const animate = () => {
      oldPosition.current.copy(player.current.position);

      controls.current.update();

      const diffX = oldPosition.current.x - player.current.position.x;
      const diffZ = oldPosition.current.z - player.current.position.z;

      const origin = player.current.position;
      const direction = raycasterDirection.current.normalize();
      raycaster.current.set(origin, direction);

      const collisions = raycaster.current.intersectObject(navMesh.current);

      if (collisions.length === 0) {
        player.current.position.x += diffX;
        player.current.position.z += diffZ;
      };

      const ref = database.ref(`lobbies/${id}`);
      ref.child(`players/${username}`).update({
        position: {
          x: player.current.position.x,
          y: player.current.position.y,
          z: player.current.position.z,
        },
        rotation: {
          y: player.current.rotation.y,
        },
        moving: Boolean(diffX || diffZ),
      });

      renderer.current.render(scene.current, camera.current);
    };

    if (loaded) renderer.current.setAnimationLoop(animate);

    return () => {
      renderer.current.setAnimationLoop(null);
    };
  }, [username, id, loaded]);

  return (
    <canvas
      aria-hidden
      className="world"
      ref={canvasRef}
      {...rest}
    />
  );
};

export default World;
