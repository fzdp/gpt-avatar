import Toast from 'react-native-root-toast';

export const fixGlLogWarning = (state) => {
  const _gl = state.gl.getContext();
  const pixelStorei = _gl.pixelStorei.bind(_gl);
  _gl.pixelStorei = function (...args) {
    const [parameter] = args;
    switch (parameter) {
      case _gl.UNPACK_FLIP_Y_WEBGL:
        return pixelStorei(...args);
    }
  };
};

export const shapeIndexMorphTargets = [
  'eyeBlinkLeft',
  'eyeLookDownLeft',
  'eyeLookInLeft',
  'eyeLookOutLeft',
  'eyeLookUpLeft',
  'eyeSquintLeft',
  'eyeWideLeft',
  'eyeBlinkRight',
  'eyeLookDownRight',
  'eyeLookInRight',
  'eyeLookOutRight',
  'eyeLookUpRight',
  'eyeSquintRight',
  'eyeWideRight',
  'jawForward',
  'jawLeft',
  'jawRight',
  'jawOpen',
  'mouthClose',
  'mouthFunnel',
  'mouthPucker',
  'mouthLeft',
  'mouthRight',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthFrownLeft',
  'mouthFrownRight',
  'mouthDimpleLeft',
  'mouthDimpleRight',
  'mouthStretchLeft',
  'mouthStretchRight',
  'mouthRollLower',
  'mouthRollUpper',
  'mouthShrugLower',
  'mouthShrugUpper',
  'mouthPressLeft',
  'mouthPressRight',
  'mouthLowerDownLeft',
  'mouthLowerDownRight',
  'mouthUpperUpLeft',
  'mouthUpperUpRight',
  'browDownLeft',
  'browDownRight',
  'browInnerUp',
  'browOuterUpLeft',
  'browOuterUpRight',
  'cheekPuff',
  'cheekSquintLeft',
  'cheekSquintRight',
  'noseSneerLeft',
  'noseSneerRight',
  'tongueOut',
  'headRoll',
  'leftEyeRoll',
  'rightEyeRoll',
];

if (shapeIndexMorphTargets.length !== 55) {
  throw new Error('Invalid shapeIndexMorphTargets');
}

export const logtime = (...args) => {
  console.log(new Date(), ...args);
};

export const concatAudioBuffers = (buffers) => {
  const totalLength = buffers.reduce(
    (acc, buffer) => acc + buffer.byteLength,
    0,
  );
  const result = new Uint8Array(totalLength);
  let offset = 0;
  buffers.forEach((buffer) => {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });
  return result.buffer;
};

export const concatAudioBuffersNew = (buffers) => {
  return buffers.reduce((acc, buffer) => {
    const tmp = new Uint8Array(acc.byteLength + buffer.byteLength);
    tmp.set(new Uint8Array(acc), 0);
    tmp.set(new Uint8Array(buffer), acc.byteLength);
    return tmp.buffer;
  }, new ArrayBuffer(0));
};

export const toast = (message, props) => {
  Toast.show(message, {
    position: Toast.positions.CENTER,
    ...props,
  });
};
