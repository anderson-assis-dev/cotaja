import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const categories = [
  'Limpeza',
  'Manutenção',
  'Construção',
  'Elétrica',
  'Hidráulica',
  'Pintura',
  'Outros',
];

export default function CreateOrderScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [address, setAddress] = useState('');
  const [attachments, setAttachments] = useState<(DocumentPickerResponse | { uri: string; name: string; type: string })[]>([]);

  const handleCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments([...attachments, { uri: asset.uri!, name: asset.fileName!, type: asset.type! }]);
    }
  };

  const handleGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'mixed', quality: 0.7 });
    if (result.assets && result.assets.length > 0) {
      const newAssets = result.assets.map(asset => ({ uri: asset.uri!, name: asset.fileName!, type: asset.type! }));
      setAttachments([...attachments, ...newAssets]);
    }
  };

  const handleDocumentPick = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: true,
      });
      setAttachments([...attachments, ...results]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        throw err;
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleSubmit = () => {
    if (!title || !category || !description || !budget || !deadline || !address) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Simulação de criação de pedido
    Alert.alert(
      'Sucesso',
      'Pedido criado com sucesso! Em breve você receberá propostas de prestadores.',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyOrders' as never),
        },
      ]
    );
  };
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Criar Novo Pedido</Text>

        <View className="bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-semibold mb-2">Título do Serviço</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: Pintura de apartamento"
            value={title}
            onChangeText={setTitle}
          />

          <Text className="text-lg font-semibold mb-2">Categoria</Text>
          <View className="flex-row flex-wrap mb-4">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                  category === cat
                    ? 'bg-indigo-600'
                    : 'bg-gray-200'
                }`}
                onPress={() => setCategory(cat)}
              >
                <Text
                  className={`${
                    category === cat ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-lg font-semibold mb-2">Descrição</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4 h-32"
            placeholder="Descreva detalhadamente o serviço que você precisa"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <Text className="text-lg font-semibold mb-2">Endereço do Serviço</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: Rua das Flores, 123, Bairro, Cidade - UF"
            value={address}
            onChangeText={setAddress}
          />

          <Text className="text-lg font-semibold mb-2">Anexos</Text>
          <View className="flex-row justify-around bg-gray-100 rounded-lg p-3 mb-4">
            <TouchableOpacity onPress={handleCamera} className="items-center space-y-1">
              <Icon name="photo-camera" size={30} color="#4f46e5" />
              <Text className="text-xs text-indigo-600">Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleGallery} className="items-center space-y-1">
              <Icon name="photo-library" size={30} color="#4f46e5" />
              <Text className="text-xs text-indigo-600">Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDocumentPick} className="items-center space-y-1">
              <Icon name="attach-file" size={30} color="#4f46e5" />
              <Text className="text-xs text-indigo-600">PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Anexos */}
          {attachments.length > 0 && (
            <View className="mb-4">
              {attachments.map((file, index) => (
                <View key={index} className="flex-row items-center justify-between bg-gray-50 p-2 rounded-lg mb-2">
                  <Icon name={file.type === 'application/pdf' ? 'picture-as-pdf' : 'image'} size={24} color="#6b7280" />
                  <Text className="flex-1 mx-3 text-gray-700" numberOfLines={1}>{file.name}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <Icon name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text className="text-lg font-semibold mb-2">Orçamento (R$)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Ex: 1000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />

          <Text className="text-lg font-semibold mb-2">Prazo Desejado</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Ex: 15 dias"
            value={deadline}
            onChangeText={setDeadline}
          />

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4"
            onPress={handleSubmit}
          >
            <Text className="text-center text-white font-bold text-lg">
              Criar Pedido
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 