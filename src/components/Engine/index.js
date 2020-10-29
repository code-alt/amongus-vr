import { useRef, useEffect } from 'react';
import {
  Raycaster,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Scene,
  Fog,
  Vector2,
  Object3D,
  Group,
  HemisphereLight,
  AmbientLight,
  DirectionalLight,
} from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import Controls from 'components/Controls';
import Stage from 'components/Stage';
import Player from 'components/Player';
import Hud from 'components/Hud';
import innerHeight from 'ios-inner-height';
import getEnvironmentMap from './getEnvironmentMap';
import { useAppContext } from 'hooks';
import { cleanScene, removeLights, cleanRenderer } from 'utils/three';
import { subscribeToEvent, sendEvent } from 'utils/socket';
import isVR from 'utils/isVR';
import start from 'assets/game/start.png';
import customize from 'assets/game/customize.png';
import './index.css';

const World = ({ id, stage, settings, ...rest }) => {
  const { username } = useAppContext();
  const playerSpeed = useRef(settings.playerSpeed || 1);
  const players = useRef({});
  const canvasRef = useRef();
  const renderer = useRef();
  const camera = useRef();
  const controls = useRef();
  const scene = useRef();
  const composer = useRef();
  const lights = useRef();
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
    renderer.current.physicallyCorrectLights = true;
    renderer.current.toneMappingExposure = 1;
    renderer.current.outputEncoding = sRGBEncoding;
    renderer.current.shadowMap.enabled = true;
    renderer.current.xr.enabled = true;
    renderer.current.xr.setFramebufferScaleFactor(2.0);
    if (isVR) document.body.appendChild(VRButton.createButton(renderer.current));

    camera.current = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
    camera.current.position.set(0, 1.6, 0);

    scene.current = new Scene();
    scene.current.fog = new Fog(0x000000, 1, 30);

    getEnvironmentMap(renderer.current).then(({ envMap }) => {
      scene.current.environment = envMap;
      // scene.current.background = envMap;
    });

    const renderScene = new RenderPass(scene.current, camera.current);

		const bloomPass = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 1.5, 0.4, 0.85 );
		bloomPass.threshold = 0.25;
		bloomPass.strength = 0.25;
		bloomPass.radius = 0;

		composer.current = new EffectComposer(renderer.current);
		composer.current.addPass(renderScene);
		composer.current.addPass(bloomPass);

    map.current = new Stage(stage);
    scene.current.add(map.current.mesh);

    player.current = new Object3D();
    player.current.name = 'player';
    player.current.speed = playerSpeed.current;
    scene.current.add(player.current);
    player.current.add(camera.current);

    if (isVR) {
      const controllers = new Group();

      const controller1 = renderer.current.xr.getController(0);
      controller1.name = 'left';
      controllers.add(controller1);

      const controller2 = renderer.current.xr.getController(1);
      controller2.name = 'right';
      controllers.add(controller2);

      const controllerModelFactory = new XRControllerModelFactory();

      const controllerGrip1 = renderer.current.xr.getControllerGrip(0);
      controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
      controllers.add(controllerGrip1);

      const controllerGrip2 = renderer.current.xr.getControllerGrip(1);
      controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
      controllers.add(controllerGrip2);

      player.current.add(controllers);
    }

    controls.current = new Controls(
      player.current,
      camera.current,
      renderer.current,
    );

    return () => {
      cleanScene(scene.current);
      cleanRenderer(renderer.current);
    };
  }, [stage]);

  useEffect(() => {
    const hemisphereLight = new HemisphereLight();
    const ambientLight  = new AmbientLight(0xFFFFFF, 0.3);
    const directionalLight  = new DirectionalLight(0xFFFFFF, 0.3);

    lights.current = [hemisphereLight, ambientLight, directionalLight];
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
    let init = false;

    const createPlayer = (data) => {
      const player = new Player(data);

      players.current[data.username] = player;
      scene.current.add(player.mesh);

      return player;
    };

    const deletePlayer = (data) => {
      const player = players.current[data.username];

      scene.current.remove(player.mesh);
      player.dispose();

      delete players.current[data.username];

      return player;
    };

    const updatePlayer = (data) => {
      if (!data) return;
      if (data.username === username) {
        if (init) return;

        const { position, rotation } = data;

        player.current.position.set(position.x, position.y, position.z);
        player.current.rotation.y = rotation.y;

        return;
      };

      const playerEntry = players.current[data.username];

      if (playerEntry?.disconnected) return deletePlayer(data);
      if (!playerEntry) return createPlayer(data);

      return playerEntry.update(data);
    };

    subscribeToEvent('playerUpdate', updatePlayer);

    sendEvent('playerUpdate', { lobby: id, username });
    sendEvent('playerJoin');
  }, [id, username]);

  useEffect(() => {
    let hudElements;

    if (player.current) {
      player.current.speed = settings.playerSpeed;
      controls.current = new Controls(
        player.current,
        camera.current,
        renderer.current,
      );
    }

    if (stage === 'lobby' && isVR) {
      const settingsHud = new Hud({
        name: 'settings',
        text: [
          `Map: ${settings.map}`,
          `Impostors: ${settings.impostors}`,
          `Confirm Ejects: ${settings.confirmEjects ? 'on' : 'off'}`,
          `Emergency Meetings: ${settings.emergencyMeetings}`,
          `Emergency Cooldown: ${settings.emergencyCooldown}s`,
          `Discussion Time: ${settings.discussionTime}s`,
          `Voting Time: ${settings.votingtime}s`,
          `Player Speed: ${settings.playerSpeed}x`,
          `Crewmate Vision: ${settings.crewmateVision}x`,
          `Impostor Vision: ${settings.impostorVision}x`,
          `Kill Cooldown: ${settings.killCooldown}s`,
          `Kill Distance: ${settings.killDistance}`,
          `Visual Tasks: ${settings.visualTasks ? 'on' : 'off'}`,
          `Common Tasks: ${settings.commonTasks}`,
          `Long Tasks: ${settings.longTasks}`,
          `Short Tasks: ${settings.shortTasks}`,
        ].join('\n'),
        fontSize: 32,
        width: 650,
        height: 650,
      });
      settingsHud.mesh.scale.set(2, 2, 2);
      settingsHud.mesh.position.set(-1, 1, -5);
      settingsHud.mesh.renderOrder = 9999;

      const startHud = new Hud({
        name: 'start',
        image: start,
        width: 200,
        height: 200,
      });
      startHud.mesh.position.set(0, -1.5, -5);
      startHud.mesh.renderOrder = 9999;

      const customizeHud = new Hud({
        name: 'customize',
        image: customize,
        width: 200,
        height: 200,
      });
      customizeHud.mesh.position.set(2, -1.5, -5);
      customizeHud.mesh.renderOrder = 9999;

      hudElements = [settingsHud.mesh, startHud.mesh, customizeHud.mesh];
      hudElements.forEach(element => camera.current.add(element));
    }

    return () => {
      if (stage === 'lobby' && isVR) {
        hudElements?.forEach(element => camera.current.remove(element));
      }
    };
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

      if (player.current && false) {
        const posXChange = oldPosition.current.x.toFixed(3) !== player.current.position.x.toFixed(3);
        const posZChange = oldPosition.current.z.toFixed(3) !== player.current.position.z.toFixed(3);
        const rotYChange = oldRotation.current.y.toFixed(2) !== player.current.rotation.y.toFixed(2);
        const playerChanged = (posXChange || posZChange) || rotYChange;

        if (playerChanged) {
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
      }

      composer.current.render();
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
