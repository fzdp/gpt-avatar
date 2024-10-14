import { Stack } from 'expo-router';
import { enableMapSet } from 'immer';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootSiblingParent } from 'react-native-root-siblings';

import { AudioShapesProvider } from '@/context/audio_shapes_context';
import { EventProvider } from '@/context/event-context';

enableMapSet();
const RootLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootSiblingParent initalRouteName="index">
        <EventProvider>
          <AudioShapesProvider>
            <Stack screenOptions={{ headerTitleAlign: 'center' }}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="chat" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ title: '设置' }} />
            </Stack>
          </AudioShapesProvider>
        </EventProvider>
      </RootSiblingParent>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
