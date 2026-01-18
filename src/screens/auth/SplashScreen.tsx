import { useEffect, useState } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Check onboarding status and navigate accordingly
    const timer = setTimeout(async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        if (onboardingCompleted === 'true') {
          navigation.navigate('Login');
        } else {
          navigation.navigate('Onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        navigation.navigate('Onboarding');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={[styles.logo, { tintColor: 'white' }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1', // indigo-500 to purple-600 gradient
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 400,
    height: 128,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 4,
    },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 5,
    right: -28
  },
});