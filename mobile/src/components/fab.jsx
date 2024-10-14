import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const Fab = ({ onMicrophonePress, onCameraPress, onEditPress }) => {
  const isOpen = useSharedValue(false);
  const progress = useSharedValue(0);
  const position = useSharedValue({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
    })
    .onUpdate((event) => {
      position.value = {
        x: position.value.x + event.changeX,
        y: position.value.y + event.changeY,
      };
    })
    .onEnd(() => {
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: position.value.x },
        { translateY: position.value.y },
      ],
    };
  });

  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
    progress.value = withSpring(isOpen.value ? 1 : 0);
  };

  const fabStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      progress.value,
      [0, 1],
      [0, 45],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const actionButtonStyle1 = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -60],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }], opacity };
  });

  const actionButtonStyle2 = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -120],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }], opacity };
  });

  const actionButtonStyle3 = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, -180],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }, { scale }], opacity };
  });

  const actionButtonStyles = [
    actionButtonStyle1,
    actionButtonStyle2,
    actionButtonStyle3,
  ];

  const actionButtons = [
    { icon: 'microphone', onPress: onMicrophonePress },
    { icon: 'camera', onPress: onCameraPress },
    { icon: 'pencil', onPress: onEditPress },
  ].map(({ icon, onPress }, index) => (
    <Animated.View
      key={icon}
      style={[styles.actionButton, actionButtonStyles[index]]}
    >
      <Pressable onPress={onPress}>
        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </Pressable>
    </Animated.View>
  ));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.fabContainer, animatedStyles]}>
        {actionButtons}
        <Pressable onPress={toggleMenu}>
          <Animated.View style={[styles.fab, fabStyle]}>
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#ff4081',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  actionButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff4081',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Fab;
