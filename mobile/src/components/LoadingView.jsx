import React, { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingView = ({
  color = '#a224f9',
  text = 'Loading...',
  showText = true,
}) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingItem}>
        <ActivityIndicator size="large" color={color} />
        {showText && (
          <Text style={[styles.loadingText, { color }]}>{text}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    backgroundColor: 'rgba(251,244,255,0.6)',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
  },
  loadingItem: {},
});

export default memo(LoadingView);
