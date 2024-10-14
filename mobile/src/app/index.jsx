import { SimpleLineIcons, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoadingView from '@/components/LoadingView';
import { useApi } from '@/lib/api';
import { toast } from '@/lib/utils';
import { useUserStore } from '@/store/user_store';

export default function Index() {
  const router = useRouter();
  const {token, logout} = useUserStore();
  const [isReady, setIsReady] = useState(false);
  const api = useApi();
  const [activeSlide, setActiveSlide] = useState(0);
  const [avatars, setAvatars] = useState([]);
  const { width } = Dimensions.get('window');
  const { top, right, left } = useSafeAreaInsets();

  const prepareChat = useCallback((avatar) => {
    router.push({
      pathname: '/chat',
      params: { avatarStr: JSON.stringify(avatar) },
    });
  }, []);

  const renderCarouselItem = ({ item }) => {
    return (
      <Pressable style={styles.carouselItem} onPress={() => prepareChat(item)}>
        <Image style={styles.bgImage} source={{ uri: item.r3fBgImageUrl }} />
        <Image
          source={{ uri: item.previewImageUrl }}
          style={styles.carouselImage}
        />
        <View style={styles.descContainer}>
          <Text style={styles.descText}>{item.description}</Text>
        </View>
      </Pressable>
    );
  };

  const onCarouselIndexChange = useCallback(
    (index) => {
      setActiveSlide(index);
    },
    [avatars],
  );

  const doLogout = () => {
    logout();
    router.replace('/login');
  };

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      if (token) {
        const validateToken = async () => {
          try {
            const res = await api.get('/avatars');
            setAvatars(res.avatars);
          } catch (error) {
            if (error.response) {
              const statusCode = error.response.status;
              if (statusCode === 401) {
                toast('The token has expired, please log in again');
                router.replace('/login');
              } else {
                toast(`Error: ${error.response?.data?.message}`);
              }
            } else {
              toast('Network Error');
              router.replace('/login');
            }
          }
        };
        validateToken();
      } else {
        router.replace('/login');
      }
    }
  }, [isReady, token, router]);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.settingsButton, { top, left: left + 20 }]}
        onPress={() => {
          router.push('/settings');
        }}
      >
        <SimpleLineIcons name="settings" size={24} color="white" />
      </Pressable>
      <Pressable
        style={[styles.settingsButton, { top, right: right + 20 }]}
        onPress={doLogout}
      >
        <AntDesign name="logout" size={24} color="white" />
      </Pressable>

      <View style={styles.carouselContainer}>
        {avatars.length === 0 ? (
          <LoadingView />
        ) : (
          <>
            <Carousel
              loop
              width={width}
              autoPlay={false}
              data={avatars}
              scrollAnimationDuration={1000}
              onSnapToItem={(index) => onCarouselIndexChange(index)}
              renderItem={renderCarouselItem}
            />
            <View style={styles.pagination}>
              {avatars.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationLine,
                    index === activeSlide ? styles.paginationLineActive : null,
                  ]}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    bottom: 20,
    right: 0,
  },
  paginationLine: {
    width: 20,
    height: 3,
    marginHorizontal: 4,
    backgroundColor: '#fe6e8e',
  },
  paginationLineActive: {
    backgroundColor: '#e51955',
    width: 30,
  },
  descContainer: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    right: 10,
    maxHeight: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 10,
  },
  descText: {
    color: 'white',
    fontSize: 16,
    flexWrap: 'wrap',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
});
