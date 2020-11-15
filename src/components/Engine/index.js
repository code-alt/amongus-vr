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
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { VRControls, FPSControls } from 'components/Controls';
import Stage from 'components/Stage';
import Player from 'components/Player';
import innerHeight from 'ios-inner-height';
import getEnvironmentMap from './getEnvironmentMap';
import { useAppContext } from 'hooks';
import { cleanScene, removeLights, cleanRenderer } from 'utils/three';
import { subscribeToEvent, sendEvent } from 'utils/socket';
import vr from 'utils/vr';
import './index.css';

const Engine = ({ id, stage, settings, ...rest }) => {
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
    if (vr) document.body.appendChild(VRButton.createButton(renderer.current));

    camera.current = new PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);
    camera.current.position.set(0, 1.6, 0);

    scene.current = new Scene();
    scene.current.fog = new Fog(0x000000, 1, 30);

    getEnvironmentMap(renderer.current).then(({ envMap }) => {
      scene.current.environment = envMap;
      // scene.current.background = envMap;
    });

    map.current = new Stage(stage, tasks.current);
    scene.current.add(map.current.mesh);

    const renderScene = new RenderPass(scene.current, camera.current);

    const bloomPass = new UnrealBloomPass(new Vector2(innerWidth, innerHeight));
    bloomPass.threshold = 0.25;
    bloomPass.strength = 0.25;
    bloomPass.radius = 0;


    composer.current = new EffectComposer(renderer.current);
    composer.current.addPass(renderScene);
    composer.current.addPass(bloomPass);

    player.current = new Object3D();
    player.current.name = 'player';
    player.current.speed = playerSpeed.current;
    scene.current.add(player.current);
    player.current.add(camera.current);

    controls.current = new FPSControls(
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

        return player;
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
    let presenting = false;

    const handleSessionChange = () => {
      if (presenting) {
        const controllers = new Group();
        controllers.name = 'controllers';

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

        controls.current = new VRControls(
          player.current,
          camera.current,
          renderer.current,
        );
      } else {
        const controllers = player.current.getObjectByName('controllers');
        if (controllers) player.current.remove(controllers);

        controls.current = new FPSControls(
          player.current,
          camera.current,
          renderer.current,
        );
      }
    };

    const animate = () => {
      // Handle VR session change
      if (!presenting && renderer.current.xr.isPresenting) {
        presenting = true;
        handleSessionChange();
      } else if (presenting !== false && !renderer.current.xr.isPresenting) {
        presenting = false;
        handleSessionChange();
      }

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

      if (player.current) {
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
      className="engine"
      ref={canvasRef}
      {...rest}
    />
  );
};

export default Engine;
