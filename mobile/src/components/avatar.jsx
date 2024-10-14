import { useGLTF } from '@react-three/drei/native';
import { useFrame, useThree } from '@react-three/fiber/native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import React, { useRef, useEffect, useContext, memo, useCallback } from 'react';
import { MathUtils } from 'three';

import { AudioShapesContext } from '@/context/audio_shapes_context';
import { useCustomEvent } from '@/context/event-context';
import { logtime, shapeIndexMorphTargets } from '@/lib/utils';

const Avatar = (props) => {
  const groupRef = useRef();
  const { nodes, materials } = useGLTF(props.avatarUri);
  const event = useCustomEvent();
  const { audioPlayTime, audioStreamData } = useContext(AudioShapesContext);
  const soundRef = useRef(null);
  const shapeIndexRef = useRef(Number.MAX_SAFE_INTEGER);
  const { clock } = useThree();
  const morphTargetNodesRef = useRef([
    nodes.EyeLeft,
    nodes.EyeRight,
    nodes.Wolf3D_Head,
    nodes.Wolf3D_Teeth,
  ]);
  const blinkEyeRef = useRef(false);
  const audioPlayingRef = useRef(false);

  const closeMouth = useCallback(() => {
    morphTargetNodesRef.current.forEach((node) => {
      for (let i = 0; i < node.morphTargetInfluences.length; i++) {
        node.morphTargetInfluences[i] = 0;
      }
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.getStatusAsync().then((status) => {
        if (status.isLoaded) {
          if (status.isPlaying) {
            soundRef.current.stopAsync();
          }
          soundRef.current.unloadAsync();
        }
        soundRef.current = null;
      });
    }
  }, []);

  const handleAudioDurationReached = useCallback(() => {
    event.emit('avatarAudioFinished');
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
    shapeIndexRef.current = Number.MAX_SAFE_INTEGER;
  }, []);

  useFrame(() => {
    if (
      audioPlayingRef.current &&
      clock.getElapsedTime() >= audioStreamData.audioDuration
    ) {
      audioPlayingRef.current = false;
      handleAudioDurationReached();
    }
    if (
      audioStreamData.shapes &&
      shapeIndexRef.current < audioStreamData.shapes.length
    ) {
      const runningFrameCount =
        Math.floor(clock.getElapsedTime() * 60) - shapeIndexRef.current;
      if (runningFrameCount > 0) {
        for (let j = 0; j < runningFrameCount; j++) {
          const currentShape = audioStreamData.shapes[shapeIndexRef.current];
          if (currentShape) {
            for (let i = 0; i < shapeIndexMorphTargets.length; i++) {
              morphTargetNodesRef.current.forEach((node) => {
                const influenceIndex =
                  node.morphTargetDictionary[shapeIndexMorphTargets[i]];
                if (influenceIndex !== undefined) {
                  node.morphTargetInfluences[influenceIndex] = currentShape[i];
                }
              });
            }
            shapeIndexRef.current += 1;
          }
        }
      }
    } else {
      const blinkStatus = blinkEyeRef.current ? 1 : 0;
      morphTargetNodesRef.current.forEach((node) => {
        const eyeBlinkLeftIndex = node.morphTargetDictionary.eyeBlinkLeft;
        const eyeBlinkRightIndex = node.morphTargetDictionary.eyeBlinkRight;
        if (eyeBlinkLeftIndex && eyeBlinkRightIndex) {
          node.morphTargetInfluences[eyeBlinkLeftIndex] = MathUtils.lerp(
            node.morphTargetInfluences[eyeBlinkLeftIndex],
            blinkStatus,
            0.5,
          );
          node.morphTargetInfluences[eyeBlinkRightIndex] = MathUtils.lerp(
            node.morphTargetInfluences[eyeBlinkRightIndex],
            blinkStatus,
            0.5,
          );
        }
      });
    }
  });

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    event.on('audioBufferEmpty', () => {
      closeMouth();
      soundRef.current = null;
    });

    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(
        () => {
          blinkEyeRef.current = true;
          setTimeout(
            () => {
              blinkEyeRef.current = false;
              nextBlink();
            },
            MathUtils.randInt(150, 350),
          );
        },
        MathUtils.randInt(1000, 5000),
      );
    };
    nextBlink();

    return () => {
      event.off('audioBufferEmpty');
      clearTimeout(blinkTimeout);
      closeMouth();
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (audioStreamData.audioDuration === 0) {
      event.emit('avatarAudioFinished');
      return;
    }
    console.log(audioStreamData.shapes.length);
    const playAudio = async () => {
      const uri = URL.createObjectURL(
        new Blob([audioStreamData.audio], { type: 'audio/mp3' }),
      );
      if (soundRef.current) {
        await soundRef.current.loadAsync({ uri }, { shouldPlay: true });
      } else {
        const { sound } = await Audio.Sound.createAsync(
          {
            uri,
          },
          {
            shouldPlay: true,
          },
        );
        soundRef.current = sound;
      }

      await soundRef.current.setVolumeAsync(1.0);
      await soundRef.current.playAsync();
      shapeIndexRef.current = 0;
      audioPlayingRef.current = true;
      clock.start();
    };

    if (audioStreamData.audio) {
      try {
        playAudio();
      } catch (err) {
        shapeIndexRef.current = Number.MAX_SAFE_INTEGER;
        soundRef.current = null;
      }
    } else {
      closeMouth();
      stopAudio();
      audioPlayingRef.current = false;
    }
    return () => {
      shapeIndexRef.current = Number.MAX_SAFE_INTEGER;
    };
  }, [audioStreamData, audioPlayTime]);

  return (
    <group {...props} ref={groupRef}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />

      {nodes.Wolf3D_Hair && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
      )}

      {nodes['hair-60'] && (
        <skinnedMesh
          geometry={nodes['hair-60'].geometry}
          material={materials.M_Hair_60}
          skeleton={nodes['hair-60'].skeleton}
        />
      )}

      {nodes.Wolf3D_Glasses && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Glasses.geometry}
          material={materials.Wolf3D_Glasses}
          skeleton={nodes.Wolf3D_Glasses.skeleton}
        />
      )}

      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
};

export default memo(Avatar);
