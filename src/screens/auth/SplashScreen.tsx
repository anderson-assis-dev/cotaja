import { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );

    pulse(dotAnim1, 0).start();
    pulse(dotAnim2, 180).start();
    pulse(dotAnim3, 360).start();

    const timer = setTimeout(async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        navigation.navigate(onboardingCompleted === 'true' ? 'Login' : 'Onboarding');
      } catch {
        navigation.navigate('Onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        <Image
          source={require('../../../assets/Cotajaveorizada.PNG')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.dotsWrapper, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logo: {
    width: 800,
    height: 300,
  },
  dotsWrapper: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
});
