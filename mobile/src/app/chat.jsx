import { MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { PerspectiveCamera } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import useControls from 'r3f-native-orbitcontrols';
import {
  Suspense,
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  BackHandler,
} from 'react-native';
import { unzipWithPassword } from 'react-native-zip-archive';
import { io } from 'socket.io-client';

import LoadingHook from '@/components/LoadingHook';
import LoadingView from '@/components/LoadingView';
import Avatar from '@/components/avatar';
import { AudioShapesContext } from '@/context/audio_shapes_context';
import { useCustomEvent } from '@/context/event-context';
import { fixGlLogWarning, logtime, toast } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings_store';
import { useUserStore } from '@/store/user_store';

const ChatScreen = () => {
  const { avatarStr } = useLocalSearchParams();
  const router = useRouter();
  const event = useCustomEvent();
  const avatar = useMemo(() => JSON.parse(avatarStr), [avatarStr]);
  const [avatarModelPath, setAvatarModelPath] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [OrbitControls, events] = useControls();
  const [message, setMessage] = useState('');
  const serverUrl = useSettingsStore((state) => state.serverUrl);
  const showDebug = useSettingsStore((state) => state.showDebug);
  const token = useUserStore((state) => state.token);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [responseText, setResponseText] = useState('');
  const recording = useRef(null);
  const aiReponseBufferRef = useRef([]);
  const [userAudioStatus, setUserAudioStatus] = useState('idle');
  const [rippleAnimation] = useState(new Animated.Value(0));
  const waitingForAudioRef = useRef(false);
  const playingAudioIndexRef = useRef(0);
  const playingAudioStatusRef = useRef('idle');

  const { setAudioPlayTime, setAudioStreamData, resetAudioShapesStates } =
    useContext(AudioShapesContext);

  const cleanupWhenExit = useCallback(() => {
    resetReplyAudioStatus();
    resetAudioShapesStates();

    if (recording.current) {
      recording.current.getStatusAsync().then((status) => {
        if (status.isLoaded) {
          if (status.isPlaying) {
            recording.current.stopAsync();
          }
          recording.current.unloadAsync();
        }
      });
    }

    if (socket) {
      socket.disconnect();
    }
  }, [socket, recording]);

  const resetReplyAudioStatus = useCallback(() => {
    waitingForAudioRef.current = false;
    playingAudioIndexRef.current = 0;
    playingAudioStatusRef.current = 'idle';
  }, []);

  const fetchResponseBuffer = useCallback(() => {
    if (playingAudioIndexRef.current < aiReponseBufferRef.current.length) {
      if (aiReponseBufferRef.current[playingAudioIndexRef.current]) {
        const { audio, shapes, message, audioDuration } =
          aiReponseBufferRef.current[playingAudioIndexRef.current];
        playingAudioIndexRef.current += 1;
        if (playingAudioStatusRef.current === 'reponsePlaying') {
          setResponseText((prev) => prev + message);
        }
        if (audioDuration > 0) {
          setAudioStreamData({ audio, shapes, audioDuration });
          setAudioPlayTime(Date.now());
        } else {
          event.emit('avatarAudioFinished');
        }
      } else {
        waitingForAudioRef.current = true;
      }
    } else {
      event.emit('audioBufferEmpty');
      resetReplyAudioStatus();
    }
  }, []);

  const onAvatarAudioFinished = useCallback(() => {
    fetchResponseBuffer();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        cleanupWhenExit();
        router.back();
        return true;
      };

      event.on('avatarAudioFinished', onAvatarAudioFinished);

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        event.off('avatarAudioFinished', onAvatarAudioFinished);
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [cleanupWhenExit, router]),
  );

  useEffect(() => {
    const loadModel = async (glbName) => {
      const glbPath = `${FileSystem.documentDirectory}${glbName}`;
      const fileInfo = await FileSystem.getInfoAsync(glbPath);
      if (fileInfo.exists) {
        setAvatarModelPath(glbPath);
      } else {
        const zipFilePath = `${FileSystem.cacheDirectory}${avatar.name}.zip`;
        const downloadedResult = await FileSystem.downloadAsync(
          `${serverUrl}/assets/avatars/${avatar.name}.zip`,
          zipFilePath,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (downloadedResult.status === 200) {
          await unzipWithPassword(
            zipFilePath,
            FileSystem.documentDirectory,
            `${avatar.name.charAt(0).toUpperCase()}${avatar.name.slice(1)}2024!`,
          );
          await FileSystem.deleteAsync(zipFilePath);
          setAvatarModelPath(glbPath);
        }
      }
    };

    if (!avatarModelPath) {
      try {
        loadModel(`${avatar.name}.glb`);
      } catch (error) {
        toast(`发生错误：${error.message}`);
        router.back();
      }
    }
  }, [avatar]);

  useEffect(() => {
    if (!avatarModelPath) {
      return;
    }
    const newSocket = io(serverUrl, {
      auth: {
        token,
        avatarId: avatar.id,
      },
    });
    newSocket.on('connect', () => {
      setMessage('已连接到服务器');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      setMessage(`连接错误:${error.message}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      setMessage(`connect_error:${error.message}`);
      if (/invalid token/i.test(error.message)) {
        router.push('/');
      }
    });

    newSocket.on(
      'aiReplyStream',
      async ({ audio, shapes, message, index, sendCount, audioDuration }) => {
        if (sendCount === 1) {
          resetReplyAudioStatus();
          aiReponseBufferRef.current = [];
          playingAudioStatusRef.current = 'reponsePlaying';
          setResponseText('');
        }
        aiReponseBufferRef.current[index] = {
          audio,
          shapes,
          message,
          audioDuration,
        };
        if (index === 0) {
          fetchResponseBuffer();
        } else if (waitingForAudioRef.current) {
          fetchResponseBuffer();
          waitingForAudioRef.current = false;
        }
      },
    );

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, token, avatarModelPath]);

  useEffect(() => {
    let animation;
    if (userAudioStatus === 'recording') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      rippleAnimation.setValue(0);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [userAudioStatus, rippleAnimation]);

  const startRecording = async () => {
    setUserAudioStatus('willStart');
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: recordingObject } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recording.current = recordingObject;
      setUserAudioStatus('recording');
    } catch (err) {
      setUserAudioStatus('idle');
      if (recording.current) {
        recording.current.getStatusAsync().then((status) => {
          if (status.isLoaded) {
            if (status.isPlaying) {
              recording.current.stopAsync();
            }
            recording.current.unloadAsync();
          }
        });
        recording.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (recording.current) {
      setUserAudioStatus('willStop');

      try {
        await recording.current.stopAndUnloadAsync();
        const uri = recording.current.getURI();
        recording.current = null;
        await uploadAudioToServer(uri);
        setUserAudioStatus('idle');
      } catch (error) {
        setUserAudioStatus('idle');
        if (recording.current) {
          recording.current.getStatusAsync().then((status) => {
            if (status.isLoaded) {
              if (status.isPlaying) {
                recording.current.stopAsync();
              }
              recording.current.unloadAsync();
            }
          });
          recording.current = null;
        }
      }
    }
  };

  const uploadAudioToServer = useCallback(
    async (uri) => {
      try {
        const audioData = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBuffer = bytes.buffer;
        socket.emit('audioStream', audioBuffer);
      } catch (error) {
        console.error('uploading audio failed =>', error);
      } finally {
        await FileSystem.deleteAsync(uri);
      }
    },
    [socket],
  );

  const toggleRecording = async () => {
    if (userAudioStatus === 'willStop' || userAudioStatus === 'willStart') {
      return;
    }
    if (userAudioStatus === 'recording') {
      await stopRecording();
    } else if (userAudioStatus === 'idle') {
      await startRecording();
    }
  };

  const resetMessageContext = () => {
    socket.emit('resetContext');
    setResponseText('');
    resetReplyAudioStatus();
    resetAudioShapesStates();
    toast('Session context has been reset');
  };

  const toggleTextMode = () => {
    setTextMode(!textMode);
  };

  const findIdeas = () => {
    socket.emit('newIdea');
  };

  const playAudio = () => {
    if (playingAudioStatusRef.current === 'idle') {
      playingAudioStatusRef.current = 'userPlaying';
      fetchResponseBuffer();
    }
  };

  const AudioButton = () => {
    const rippleScale = rippleAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    return (
      <View style={styles.audioButtonContainer}>
        <Animated.View
          style={[
            styles.ripple,
            {
              transform: [{ scale: rippleScale }],
              opacity: rippleAnimation,
            },
          ]}
        />
        <Pressable
          style={[styles.actionButton, { backgroundColor: '#7351da' }]}
          onPress={toggleRecording}
        >
          {userAudioStatus === 'willStart' || userAudioStatus === 'willStop' ? (
            <ActivityIndicator size={24} color="white" />
          ) : (
            <MaterialCommunityIcons
              name="microphone-outline"
              size={28}
              color="white"
            />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {!avatarModelPath || avatarLoading ? (
        <LoadingView />
      ) : (
        <>
          <View style={styles.modelContainer}>
            <Image
              style={styles.modelContainerBg}
              source={{ uri: avatar.r3fBgImageUrl }}
            />
            <View style={{ flex: 1 }} {...events}>
              <Canvas onCreated={(state) => fixGlLogWarning(state)}>
                <OrbitControls enableRotate={false} />
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <ambientLight intensity={1} />
                <directionalLight
                  position={[5, 5, 5]}
                  intensity={1}
                  castShadow
                />
                <Suspense
                  fallback={<LoadingHook setLoading={setAvatarLoading} />}
                >
                  <Avatar
                    position={avatar.r3fPosition}
                    scale={7}
                    avatarUri={avatarModelPath}
                  />
                </Suspense>
              </Canvas>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={() => {
                cleanupWhenExit();
                router.back();
              }}
            >
              <MaterialCommunityIcons
                name="window-close"
                size={24}
                color="white"
              />
            </Pressable>
          </View>
          {showDebug && (
            <View style={styles.toolContainer}>
              <Text>{message}</Text>
              <Text>audio status：{userAudioStatus}</Text>
              <Text>audio object：{recording.current ? 'exists' : 'null'}</Text>
            </View>
          )}

          {textMode && (
            <View style={styles.responseTextContainer}>
              <ScrollView>
                <Pressable onPress={playAudio}>
                  <Text style={styles.responseText}>
                    {responseText || 'The reply text will appear here'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#049d84' }]}
              onPress={resetMessageContext}
              disabled={userAudioStatus !== 'idle'}
            >
              <MaterialCommunityIcons
                name="autorenew"
                size={24}
                color="white"
              />
            </Pressable>
            <AudioButton />
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#677e0d' }]}
              onPress={toggleTextMode}
            >
              <MaterialCommunityIcons
                name={textMode ? 'translate' : 'translate-off'}
                size={24}
                color="white"
              />
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#f83c86' }]}
              onPress={findIdeas}
            >
              <FontAwesome6
                name="wand-magic-sparkles"
                size={20}
                color="white"
              />
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modelContainer: {
    flex: 1,
  },
  modelContainerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  audioButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  ripple: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7351da',
  },
  toolContainer: {
    position: 'absolute',
    backgroundColor: '#f37676',
    bottom: 0,
    left: 0,
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    columnGap: 20,
  },
  actionButton: {
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseTextContainer: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    maxHeight: '40%',
    backgroundColor: 'rgba(59, 126, 13, 0.8)',
    borderRadius: 10,
    padding: 10,
  },
  responseText: {
    color: 'white',
    fontSize: 16,
    flexWrap: 'wrap',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
  },
});

export default ChatScreen;
