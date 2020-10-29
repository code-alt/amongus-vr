import { PMREMGenerator, UnsignedByteType } from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import environment from 'assets/game/environment.hdr';

function getEnvironmentMap(renderer) {
  return new Promise(( resolve, reject) => {
    new RGBELoader()
      .setDataType(UnsignedByteType)
      .load(environment, (texture) => {
        const pmremGenerator = new PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();

        resolve({ envMap });
      }, undefined, reject);
  });
}

export default getEnvironmentMap;
