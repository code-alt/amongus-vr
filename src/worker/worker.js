import { Raycaster, Vector3, Clock } from 'three';

const PLAYER_SPEED = 1;

/**
 * Returns whether an object can be iterated or destructured
 */
function isIterable(obj) {
  // checks for null and undefined
  if (obj === null) return false;

  return typeof obj[Symbol.iterator] === 'function';
}

/**
 * Checks for head-on collisions from the camera
 */
export function checkCollisions(renderer, camera, player, targets) {
  const raycaster = new Raycaster();
  const zAxis = new Vector3(0, 0, -1);
  const yAxis = new Vector3(0, 1, 0);

  const cameraRef = session ? renderer.xr.getCamera(camera) : camera;

  const origin = player.position;
  const direction = zAxis.applyAxisAngle(yAxis, cameraRef.rotation.y);
  raycaster.set(origin, direction);

  const collisions = raycaster.intersectObjects(targets);

  return collisions;
}

/**
 * Rotates the player mesh to match both 2D and 3D camera Y rotations
 */
export function rotatePlayer(renderer, camera, astronaut) {
  if (!astronaut) return;

  const session = renderer.xr.getSession();
  const cameraRef = session ? renderer.xr.getCamera(camera) : camera;

  const diffX = cameraRef.position.x - astrouant.position.x;
  const diffZ = cameraRef.position.z - astrouant.position.z;

  return astrouant.rotation.y = Math.atan2(diffX, diffZ) + Math.PI;
}

const clock = new Clock();

/**
 * Animates the player model by syncing the animation and renderer deltas
 */
export function animatePlayer(mixer) {
  if (!mixer) return;

  const delta = clock.getDelta();
  mixer.update(delta);
}

let gamePads = new Map();
const cameraVector = new Vector3();

/**
 * Moves player model with detected VR controllers
 */
export function movePlayer(renderer, camera, player, callback) {
  if (!player) return;

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

        const oldPosition = player.position.copy();
        const old = prevGamePads.get(source);
        const data = {
          handedness,
          axes: source.gamepad.axes.slice(0),
        };

        if (old) {
          const movementSpeed = PLAYER_SPEED * 0.1;

          data.axes.forEach((value, i) => {
            if (i === 2) {
              // left and right axis on thumbsticks
              if (data.handedness === 'left') {
                player.position.x -= cameraVector.z * movementSpeed * data.axes[2];
                player.position.z += cameraVector.x * movementSpeed * data.axes[2];
              }
            }

            if (i === 3) {
              // up and down axis on thumbsticks
              if (data.handedness === 'right') {
                player.position.x -= cameraVector.x * movementSpeed * data.axes[3];
                player.position.z -= cameraVector.z * movementSpeed * data.axes[3];
              }
            }

            callback(oldPosition);
          });
        }

        prevGamePads.set(source, data);
      }
    }
  }
}
