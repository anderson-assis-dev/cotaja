import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Dados mockados para exemplo
const mockService = {
  id: '1',
  title: 'Pintura de apartamento',
  provider: {
    name: 'João Silva',
    avatar: require('../../../assets/splash-icon.png'),
  },
  date: '15/03/2024',
};

export default function RateProviderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { companyToRate } = (route.params as any) || {};

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);

  if (!companyToRate) {
    return (
        <View className="flex-1 justify-center items-center p-6">
            <Text className="text-lg text-gray-600">Nenhuma empresa selecionada para avaliar.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
                <Text className="text-indigo-600">Voltar</Text>
            </TouchableOpacity>
        </View>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Avaliação Incompleta', 'Por favor, selecione pelo menos uma estrela.');
      return;
    }
    Alert.alert( 'Avaliação Enviada', 'Obrigado por seu feedback!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  // --- Funções de Seleção de Imagem ---
  const handleCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments([...attachments, { uri: asset.uri!, name: asset.fileName!, type: asset.type! }]);
    }
  };

  const handleGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7, selectionLimit: 5 });
    if (result.assets && result.assets.length > 0) {
      const newAssets = result.assets.map(asset => ({ uri: asset.uri!, name: asset.fileName!, type: asset.type! }));
      setAttachments([...attachments, ...newAssets]);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-3xl font-bold mb-6 text-gray-800">Avaliar Empresa</Text>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <Image source={companyToRate.image} className="w-16 h-16 rounded-full mr-4" />
            <View>
              <Text className="text-xl font-bold text-gray-800">{companyToRate.name}</Text>
              <Text className="text-gray-600">{companyToRate.category}</Text>
            </View>
          </View>

          <Text className="text-lg font-semibold mb-3 text-gray-700">Sua Nota</Text>
          <View className="flex-row justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} className="mx-2">
                <Icon name="star" size={40} color={star <= rating ? '#f59e0b' : '#d1d5db'} />
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-lg font-semibold mb-3 text-gray-700">Sua Experiência</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 h-32"
            placeholder="Descreva como foi o serviço..."
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-lg font-semibold mb-3 text-gray-700">Anexar Fotos</Text>
          <View className="flex-row justify-around bg-gray-100 rounded-lg p-3 mb-4 border border-gray-200">
            <TouchableOpacity onPress={handleCamera} className="items-center space-y-1 px-4">
              <Icon name="photo-camera" size={30} color="#4f46e5" />
              <Text className="text-xs text-indigo-600">Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGallery} className="items-center space-y-1 px-4">
              <Icon name="photo-library" size={30} color="#4f46e5" />
              <Text className="text-xs text-indigo-600">Galeria</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Anexos */}
          {attachments.length > 0 && (
            <View className="mb-4 space-y-2">
              {attachments.map((file, index) => (
                <View key={index} className="flex-row items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <Image source={{ uri: file.uri }} className="w-10 h-10 rounded-md mr-3" />
                  <Text className="flex-1 text-gray-700" numberOfLines={1}>{file.name}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)} className="p-2">
                    <Icon name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity className="bg-indigo-600 rounded-lg p-4" onPress={handleSubmit}>
            <Text className="text-center text-white font-bold text-lg">Enviar Avaliação</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-indigo-600 text-center mt-2">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 