import React, { useRef, useEffect } from 'react';
import {
  Raycaster,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  Fog,
  OrthographicCamera,
  DirectionalLight,
  HemisphereLight,
  Object3D,
} from 'three';
import Controls from 'components/Controls';
import VRControllers from 'components/VRControllers';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import Stage from 'components/Stage';
import Player from 'components/Player';
import innerHeight from 'ios-inner-height';
import { useAppContext } from 'hooks';
import createHud from './createHud';
import { cleanScene, removeLights, cleanRenderer } from 'utils/three';
import { database } from 'utils/firebase';
import './index.css';

const supportsVR = 'xr' in navigator;

const World = ({ id, stage, ...rest }) => {
  const { username } = useAppContext();
  const playerSpeed = useRef(1);
  const players = useRef([]);
  const canvasRef = useRef();
  const renderer = useRef();
  const camera = useRef();
  const hudCamera = useRef();
  const controls = useRef();
  const scene = useRef();
  const hudScene = useRef();
  const hud = useRef();
  const lights = useRef();
  const controllers = useRef();
  const map = useRef();
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
    renderer.current.autoClear = false;
    renderer.current.outputEncoding = sRGBEncoding;
    renderer.current.shadowMap.enabled = true;
    renderer.current.xr.enabled = true;
    renderer.current.xr.setFramebufferScaleFactor(2.0);
    if (supportsVR) document.body.appendChild(VRButton.createButton(renderer.current));

    camera.current = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
    camera.current.position.set(0, 1.6, 0);

    scene.current = new Scene();
    scene.current.fog = new Fog(0x000000, 1, 30);

    hudScene.current = new Scene();
    hudCamera.current = new OrthographicCamera(-innerWidth / 2, innerWidth / 2, innerHeight / 2, -innerHeight / 2, 0, 30);

    if (supportsVR) {
      controllers.current = new VRControllers(renderer.current);
      scene.current.add(controllers.current);
    }

    map.current = new Stage(stage);
    scene.current.add(map.current.mesh);

    player.current = new Object3D();
    player.current.name = 'player';
    player.current.speed = playerSpeed.current;
    scene.current.add(player.current);
    player.current.add(camera.current);

    if (supportsVR) {
      player.current.add(controllers.current);
    }

    controls.current = new Controls(
      player.current,
      camera.current,
      renderer.current,
    );

    return () => {
      cleanScene(scene.current);
      cleanScene(hudScene.current);
      cleanRenderer(renderer.current);
    };
  }, [stage]);

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
      hudCamera.current.aspect = windowWidth / canvasHeight;
      hudCamera.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const createPlayer = (data) => {
      const player = new Player(data);
      players.current[data.username] = player;

      scene.current.add(player.mesh);

      return player;
    };

    const updatePlayer = (snap) => {
      const data = snap.val();
      if (!data) return;

      const player = players.current[data.username];
      if (player.mixer) player.update(data);

      return player;
    };

    const removePlayer = (snap) => {
      const data = snap.val();
      if (!data) return;

      ref.child(`players/${data.username}`).off('value', updatePlayer);

      const player = players.current[data.username];

      scene.current.remove(player.mesh);

      const playerIndex = players.current.indexOf(player);
      players.current.slice(playerIndex, 1);
    };

    const ref = database.ref(`lobbies/${id}`);

    ref.child('players').on('child_added', snap => {
      const data = snap.val();
      if (!data) return;

      if (data.username !== username && !players.current[data.username]) {
        createPlayer(data);

        ref.child(`players/${data.username}`).on('value', updatePlayer);
      }
    });

    ref.child('players').on('child_removed', snap => removePlayer);

    return () => {
      ref.child(`players/${username}`).remove();
    };
  }, [id, username]);

  useEffect(() => {
    const ref = database.ref(`lobbies/${id}`);

    const updateHud = snap => {
      const data = snap.val();
      if (!data) return;

      if (player.current) {
        player.current.speed = data.playerSpeed;
        controls.current = new Controls(
          player.current,
          camera.current,
          renderer.current,
        );
      }

      if (hud.current) {
        hudScene.current.remove(hud.current);
      }

      hud.current = createHud({ data });
      hudScene.current.add(hud.current);
    };

    const handleHudChange = (snap) => {
      const data = snap.val();
      if (!data) return;

      ref.child('settings').once('value', updateHud);
    };

    const isLobby = map === 'lobby';

    if (isLobby) {
      ref.child('settings').once('value', updateHud);
      ref.child('settings').on('child_changed', handleHudChange);
    }

    return () => {
      if (isLobby) {
        ref.child('settings').off('child_changed', handleHudChange);
      }
    };
  }, [id, username, map]);

  useEffect(() => {
    const animate = () => {
      oldPosition.current.copy(player.current.position);

      controls.current.update();

      const origin = player.current.position;
      const direction = raycasterDirection.current.normalize();
      raycaster.current.set(origin, direction);

      const navMesh = map.current.navMesh;

      if (navMesh) {
        const collisions = raycaster.current.intersectObject(navMesh);

        if (collisions.length === 0) {
          player.current.position.x += oldPosition.current.x - player.current.position.x;
          player.current.position.z += oldPosition.current.z - player.current.position.z;
        };
      }

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
      });

      renderer.current.render(scene.current, camera.current);
      renderer.current.render(hudScene.current, hudCamera.current);
    };

    renderer.current.setAnimationLoop(animate);

    return () => {
      renderer.current.setAnimationLoop(null);
    };
  }, [username, id]);

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
