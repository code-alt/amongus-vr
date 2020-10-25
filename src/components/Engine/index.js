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
import { subscribeToEvent, sendEvent } from 'utils/socket';
import vr from 'utils/vr';
import './index.css';

const World = ({ id, stage, settings, ...rest }) => {
  const { username } = useAppContext();
  const playerSpeed = useRef(1);
  const players = useRef({});
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
  const oldRotation = useRef(new Vector3());

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
    if ('xr' in navigator) document.body.appendChild(VRButton.createButton(renderer.current));

    const isVR = vr(renderer.current);

    camera.current = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
    camera.current.position.set(0, 1.6, 0);

    scene.current = new Scene();
    scene.current.fog = new Fog(0x000000, 1, 30);

    hudScene.current = new Scene();
    hudCamera.current = new OrthographicCamera(-innerWidth / 2, innerWidth / 2, innerHeight / 2, -innerHeight / 2, 0, 30);

    if (isVR) {
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

    if (isVR) {
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

    const deletePlayer = (data) => {
      const player = players.current[data.username];

      scene.current.remove(player.mesh);

      delete players.current[data.username];

      return player;
    };

    const updatePlayer = (data) => {
      if (!data) return;
      if (data.username === username) return;

      const player = players.current[data.username];

      if (player?.disconnected) return deletePlayer(data);
      if (!player) return createPlayer(data);

      return player.update(data);
    };

    subscribeToEvent('playerUpdate', updatePlayer);

    sendEvent('playerUpdate', { lobby: id, username });
    sendEvent('playerJoin');
  }, [id, username]);

  useEffect(() => {
    if (player.current) {
      player.current.speed = settings.playerSpeed;
      controls.current = new Controls(
        player.current,
        camera.current,
        renderer.current,
      );
    }

    if (stage === 'lobby') {
      if (hud.current) hudScene.current.remove(hud.current);

      hud.current = createHud({ data: settings });
      hudScene.current.add(hud.current);
    }
  }, [id, settings, stage]);

  useEffect(() => {
    const animate = () => {
      oldPosition.current.copy(player.current.position);
      oldRotation.current.copy(player.current.rotation);

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

      const posXChange = oldPosition.current.x.toFixed(3) !== player.current.position.x.toFixed(3);
      const posZChange = oldPosition.current.z.toFixed(3) !== player.current.position.z.toFixed(3);
      const rotYChange = oldRotation.current.y.toFixed(2) !== player.current.rotation.y.toFixed(2);
      const playerChanged = (posXChange || posZChange) || rotYChange;

      if (player.current && playerChanged) {
        sendEvent('playerUpdate', {
          username,
          position: {
            x: player.current.position.x.toFixed(3),
            y: player.current.position.y.toFixed(3),
            z: player.current.position.z.toFixed(3),
          },
          rotation: {
            x: player.current.rotation.x.toFixed(2),
            y: player.current.rotation.y.toFixed(2),
            z: player.current.rotation.z.toFixed(2),
          },
        });
      }

      renderer.current.render(scene.current, camera.current);
      renderer.current.render(hudScene.current, hudCamera.current);
    };

    renderer.current.setAnimationLoop(animate);

    return () => {
      renderer.current.setAnimationLoop(null);
    };
  }, [username]);

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
