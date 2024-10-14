import { Box } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber/native';
import React, { memo, useRef } from 'react';

const LoadingCube = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 2;
      meshRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <Box ref={meshRef} args={[1, 1, 1]} position={[0, 0, 0]}>
      <meshStandardMaterial color="#7351da" />
    </Box>
  );
};

export default memo(LoadingCube);
