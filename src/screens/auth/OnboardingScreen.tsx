import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Image, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugAsyncStorage, clearOnboardingForTesting } from '../../utils/debugAsyncStorage';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Bem-vindo ao Cotaja',
    description: 'A plataforma que conecta clientes e prestadores de serviços de forma simples e segura.',
    image: require('../../../assets/logo.png'),
  },
  {
    id: '2',
    title: 'Encontre Profissionais',
    description: 'Busque e contrate profissionais qualificados para realizar seus serviços.',
    image: require('../../../assets/logo.png'),
  },
  {
    id: '3',
    title: 'Ofereça seus Serviços',
    description: 'Cadastre-se como prestador e encontre novos clientes para seus serviços.',
    image: require('../../../assets/logo.png'),
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const markOnboardingCompleted = async () => {
    try {
      console.log('🔄 Salvando status do onboarding...');
      await AsyncStorage.setItem('onboarding_completed', 'true');
      console.log('✅ Status do onboarding salvo com sucesso');

      const saved = await AsyncStorage.getItem('onboarding_completed');
      console.log('📱 Status salvo verificado:', saved);
    } catch (error) {
      console.error('❌ Erro ao salvar status do onboarding:', error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      try {
        console.log('🚀 Finalizando onboarding...');
        await markOnboardingCompleted();

        console.log('📍 Navegando para Initial...');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Initial' }],
          })
        );
      } catch (error) {
        console.error('❌ Erro ao finalizar onboarding:', error);
      }
    }
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <Image
          source={item.image}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>

        {currentIndex === slides.length - 1 && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={async () => {
              try {
                console.log('🔑 Usuário já tem conta...');
                await markOnboardingCompleted();

                console.log('📍 Navegando para Login...');
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              } catch (error) {
                console.error('❌ Erro ao navegar para login:', error);
              }
            }}
          >
            <Text style={styles.loginText}>Já tenho uma conta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: 256,
    height: 256,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  bottomContainer: {
    padding: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4f46e5',
  },
  inactiveDot: {
    backgroundColor: '#d1d5db',
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginButton: {
    marginTop: 16,
  },
  loginText: {
    color: '#4f46e5',
    textAlign: 'center',
  },
  debugContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000,
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});