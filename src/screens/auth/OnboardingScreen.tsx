import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Login' as never);
    }
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View className="w-full items-center px-6" style={{ width }}>
        <Image
          source={item.image}
          className="w-64 h-64 mb-8"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-center mb-4">{item.title}</Text>
        <Text className="text-gray-600 text-center mb-8">{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white">
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

      <View className="p-6">
        <View className="flex-row justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4"
          onPress={handleNext}
        >
          <Text className="text-center text-white font-bold text-lg">
            {currentIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>

        {currentIndex === slides.length - 1 && (
          <TouchableOpacity
            className="mt-4"
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text className="text-indigo-600 text-center">Já tenho uma conta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
} 