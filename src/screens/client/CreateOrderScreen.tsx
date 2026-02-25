import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Image, PermissionsAndroid } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import Config from 'react-native-config';
import { orderService, geocodingService, GeocodedAddress } from '../../services/api';
import { formatCurrency, extractNumericValue, formatDeadline, validateDeadline } from '../../utils/formatters';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { compressImage, compressVideo } from '../../utils/fileCompressor';

// Tipos de anexos
type AttachmentType = 'image' | 'video' | 'document';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  fileType: AttachmentType;
  isExisting?: boolean; // Flag para anexos que já existem no servidor
  serverPath?: string; // Caminho no servidor
}

interface ExistingAttachment {
  path?: string;
  data?: string;
  size: number;
  type: string;
  filename: string;
  mime_type: string;
  uploaded_at: string;
  original_name: string;
}

// Limites de anexos
const LIMITS = {
  image: 5,
  video: 1,
  document: 2,
};

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
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as any;

  // Modo de edição
  const editMode = params?.editMode || false;
  const orderId = params?.orderId;
  const orderData = params?.orderData;
  const hasProposals = orderData?.proposals && orderData.proposals.length > 0;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [street, setStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [addressSearchResults, setAddressSearchResults] = useState<GeocodedAddress[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]); // Paths dos anexos removidos
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionType, setCompressionType] = useState<'image' | 'video'>('image');
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  // Preencher formulário em modo de edição
  useEffect(() => {
    if (editMode && orderData) {
      console.log('📝 Modo de edição ativado para pedido:', orderId);
      console.log('📄 Dados do pedido:', orderData);

      setTitle(orderData.title || '');
      setCategory(orderData.category || '');
      setDescription(orderData.description || '');

      // Formatar budget (remover "R$ " e formatar)
      const budgetValue = orderData.budget?.replace('R$ ', '').replace(',', '.');
      setBudget(formatCurrency(budgetValue || '0'));

      // Formatar deadline (remover " dias")
      const deadlineValue = orderData.deadline?.replace(' dias', '');
      setDeadline(formatDeadline(deadlineValue || '0'));

      // Carregar campos de endereço estruturado
      setStreet(orderData.street || '');
      setAddressNumber(orderData.number || '');
      setComplement(orderData.complement || '');
      setNeighborhood(orderData.neighborhood || '');
      setCity(orderData.city || '');
      setAddressState(orderData.state || '');
      setZipCode(orderData.zip_code || '');
      if (orderData.latitude) setLatitude(parseFloat(orderData.latitude));
      if (orderData.longitude) setLongitude(parseFloat(orderData.longitude));

      // Carregar anexos existentes
      if (orderData.attachments && Array.isArray(orderData.attachments)) {
        const existingAttachments: Attachment[] = orderData.attachments.map((att: ExistingAttachment) => {
          // Support base64 data URIs (new format) and legacy file paths
          let imageUrl: string;
          if (att.data && typeof att.data === 'string' && att.data.startsWith('data:')) {
            imageUrl = att.data;
          } else if (att.path) {
            const uploadsIndex = att.path.indexOf('uploads/');
            const imagePath = uploadsIndex !== -1 ? att.path.substring(uploadsIndex) : att.path;
            imageUrl = `${Config.SERVER_BASE_URL || 'http://localhost:3000'}/${imagePath}`;
          } else {
            imageUrl = '';
          }

          // Determinar tipo de arquivo
          let fileType: AttachmentType = 'document';
          if (att.mime_type.startsWith('image/') || att.type === 'image') {
            fileType = 'image';
          } else if (att.mime_type.startsWith('video/') || att.type === 'video') {
            fileType = 'video';
          }

          return {
            uri: imageUrl,
            name: att.original_name || att.filename,
            type: att.mime_type,
            fileType,
            isExisting: true,
            serverPath: att.filename || att.path || att.original_name,
          };
        });

        console.log('📎 Anexos existentes carregados:', existingAttachments.length);
        setAttachments(existingAttachments);
      }
    }
  }, [editMode, orderData, orderId]);

  // Contador de anexos por tipo
  const getAttachmentCount = (fileType: AttachmentType) => {
    return attachments.filter(att => att.fileType === fileType).length;
  };

  // Handler para orçamento com formatação
  const handleBudgetChange = (value: string) => {
    const formatted = formatCurrency(value);
    setBudget(formatted);
  };

  // Handler para prazo com validação
  const handleDeadlineChange = (value: string) => {
    const formatted = formatDeadline(value);
    setDeadline(formatted);
  };

  const handleZipCodeChange = async (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    const formatted = numbers.length > 5
      ? `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
      : numbers;
    setZipCode(formatted);
    if (numbers.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setAddressState(data.uf || '');
        }
      } catch (error) {
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Buscar endereço por texto (autocomplete com debounce)
  const handleStreetChange = (text: string) => {
    setStreet(text);

    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length < 3) {
      setAddressSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Debounce: esperar 500ms após parar de digitar
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await geocodingService.searchAddress(
          text,
          latitude || undefined,
          longitude || undefined
        );
        if (response.success && response.data) {
          setAddressSearchResults(response.data.slice(0, 5));
          setShowSearchResults(true);
        }
      } catch (error) {
        console.log('Erro na busca de endereço:', error);
      }
    }, 500);
  };

  // Selecionar endereço dos resultados de busca
  const handleSelectAddress = (address: GeocodedAddress) => {
    setStreet(address.street || '');
    setAddressNumber(address.number || '');
    setNeighborhood(address.neighborhood || '');
    setCity(address.city || '');
    setAddressState(address.state || '');
    setZipCode(address.zip_code || '');
    if (address.latitude) setLatitude(address.latitude);
    if (address.longitude) setLongitude(address.longitude);
    setShowSearchResults(false);
    setAddressSearchResults([]);
  };

  // Obter localização GPS do dispositivo
  const handleGetLocation = async () => {
    setIsLoadingLocation(true);

    try {
      // Solicitar permissão no Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão de Localização',
            message: 'Cotaja precisa acessar sua localização para preencher o endereço automaticamente.',
            buttonNeutral: 'Perguntar depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permissão negada', 'Não foi possível obter sua localização.');
          setIsLoadingLocation(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          console.log('📍 Localização obtida:', lat, lng);
          setLatitude(lat);
          setLongitude(lng);

          try {
            // Reverse geocode via backend
            const response = await geocodingService.reverseGeocode(lat, lng);
            if (response.success && response.data) {
              const addr = response.data;
              setStreet(addr.street || '');
              setAddressNumber(addr.number || '');
              setNeighborhood(addr.neighborhood || '');
              setCity(addr.city || '');
              setAddressState(addr.state || '');
              setZipCode(addr.zip_code || '');
              console.log('✅ Endereço preenchido automaticamente:', addr.formatted_address);
            }
          } catch (error) {
            console.error('Erro no reverse geocode:', error);
            Alert.alert('Aviso', 'Localização obtida, mas não foi possível converter em endereço. Preencha manualmente.');
          }

          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          let message = 'Não foi possível obter sua localização.';
          if (error.code === 1) message = 'Permissão de localização negada.';
          if (error.code === 2) message = 'Localização indisponível. Verifique se o GPS está ativado.';
          if (error.code === 3) message = 'Tempo esgotado ao tentar obter localização.';
          Alert.alert('Erro', message);
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.error('Erro geral de localização:', error);
      Alert.alert('Erro', 'Não foi possível acessar a localização.');
      setIsLoadingLocation(false);
    }
  };

  // Construir endereço completo a partir dos campos
  const buildFullAddress = () => {
    const parts = [];
    if (street) {
      let streetLine = street;
      if (addressNumber) streetLine += `, ${addressNumber}`;
      parts.push(streetLine);
    }
    if (complement) parts.push(complement);
    if (neighborhood) parts.push(neighborhood);
    if (city) {
      let cityLine = city;
      if (addressState) cityLine += ` - ${addressState}`;
      parts.push(cityLine);
    }
    if (zipCode) parts.push(zipCode);
    return parts.join(', ');
  };

  // Adicionar imagem (câmera ou galeria)
  const handleAddImage = async (useCamera: boolean = false) => {
    const imageCount = getAttachmentCount('image');
    if (imageCount >= LIMITS.image) {
      console.log(`Limite atingido: Você pode adicionar no máximo ${LIMITS.image} imagens`);
      return;
    }

    const result = useCamera
      ? await launchCamera({ mediaType: 'photo', quality: 1.0 })
      : await launchImageLibrary({
        mediaType: 'photo',
        quality: 1.0,
        selectionLimit: LIMITS.image - imageCount
      });

    if (result.assets && result.assets.length > 0) {
      setIsCompressing(true);
      setCompressionType('image');
      setCompressionProgress(0);
      const compressedAssets: Attachment[] = [];

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        try {
          // Simular progresso para imagens (são rápidas)
          setCompressionProgress((i / result.assets.length) * 100);

          // Comprimir imagem
          const compressed = await compressImage(asset.uri!, asset.fileName || 'image.jpg');
          compressedAssets.push({
            uri: compressed.uri,
            name: compressed.name,
            type: compressed.type,
            fileType: 'image' as AttachmentType,
          });
        } catch (error) {
          console.error('Erro ao comprimir imagem:', error);
          // Em caso de erro, adiciona imagem original
          compressedAssets.push({
            uri: asset.uri!,
            name: asset.fileName!,
            type: asset.type!,
            fileType: 'image' as AttachmentType,
          });
        }
      }

      setCompressionProgress(100);
      setAttachments([...attachments, ...compressedAssets]);
      setTimeout(() => {
        setIsCompressing(false);
        setCompressionProgress(0);
      }, 300);
    }
  };

  // Adicionar vídeo
  const handleAddVideo = async () => {
    const videoCount = getAttachmentCount('video');
    if (videoCount >= LIMITS.video) {
      console.log(`Limite atingido: Você pode adicionar no máximo ${LIMITS.video} vídeo`);
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'video',
      quality: 1.0,
      selectionLimit: 1
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      setIsCompressing(true);
      setCompressionType('video');
      setCompressionProgress(0);

      try {
        // Comprimir vídeo com callback de progresso
        const compressed = await compressVideo(
          asset.uri!,
          asset.fileName || 'video.mp4',
          (progress) => {
            setCompressionProgress(progress);
          }
        );
        const newVideo: Attachment = {
          uri: compressed.uri,
          name: compressed.name,
          type: compressed.type,
          fileType: 'video',
        };
        setAttachments([...attachments, newVideo]);
      } catch (error) {
        console.error('Erro ao comprimir vídeo:', error);
        // Em caso de erro, adiciona vídeo original
        const newVideo: Attachment = {
          uri: asset.uri!,
          name: asset.fileName!,
          type: asset.type!,
          fileType: 'video',
        };
        setAttachments([...attachments, newVideo]);
      } finally {
        setTimeout(() => {
          setIsCompressing(false);
          setCompressionProgress(0);
        }, 300);
      }
    }
  };

  // Adicionar documento
  const handleAddDocument = async () => {
    const docCount = getAttachmentCount('document');
    if (docCount >= LIMITS.document) {
      console.log(`Limite atingido: Você pode adicionar no máximo ${LIMITS.document} documentos`);
      return;
    }

    try {
      const results = await pick({
        type: [types.pdf, types.doc, types.docx],
        allowMultiSelection: true,
      });

      if (results && results.length > 0) {
        const availableSlots = LIMITS.document - docCount;
        const docsToAdd = results.slice(0, availableSlots);

        const newDocs = docsToAdd.map(result => ({
          uri: result.uri,
          name: result.name || 'document.pdf',
          type: result.type || 'application/pdf',
          fileType: 'document' as AttachmentType,
        }));
        setAttachments([...attachments, ...newDocs]);

        if (results.length > availableSlots) {
          console.log(`Limite atingido: Apenas ${availableSlots} documento(s) foram adicionados`);
        }
      }
    } catch (err) {
      console.log('Usuário cancelou a seleção de documento ou erro:', err);
    }
  };

  const removeAttachment = (index: number) => {
    const attachment = attachments[index];

    // Se for um anexo existente no servidor, adicionar à lista de removidos
    if (attachment.isExisting && attachment.serverPath) {
      console.log('🗑️ Marcando anexo para remoção:', attachment.serverPath);
      setRemovedAttachments([...removedAttachments, attachment.serverPath]);
    }

    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Renderizar ícone baseado no tipo de anexo
  const getAttachmentIcon = (attachment: Attachment) => {
    if (attachment.fileType === 'image') return 'image';
    if (attachment.fileType === 'video') return 'videocam';
    return 'insert-drive-file';
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit chamado');
    const fullAddress = buildFullAddress();
    console.log('Valores:', { title, category, description, budget, deadline, fullAddress });

    // Verificar se há propostas e está em modo de edição
    if (editMode && hasProposals) {
      Alert.alert(
        'Não é possível editar',
        'Este pedido já recebeu propostas e não pode mais ser editado. Você pode apenas excluir o pedido.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!title || !category || !description || !budget || !deadline || !street || !city || !addressState) {
      console.log('❌ Erro: Por favor, preencha todos os campos obrigatórios');
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios (título, categoria, descrição, orçamento, prazo, rua, cidade e estado).');
      return;
    }

    // Validar anexos - pelo menos 1 arquivo é obrigatório (apenas para novo pedido)
    if (!editMode && attachments.length === 0) {
      console.log('❌ Erro: Adicione pelo menos 1 imagem, vídeo ou documento');
      Alert.alert('Erro', 'Adicione pelo menos 1 imagem, vídeo ou documento ao pedido');
      return;
    }

    // Validar orçamento
    const budgetValue = extractNumericValue(budget);
    console.log('💰 Budget value:', budgetValue);
    if (budgetValue <= 0) {
      console.log('❌ Erro: Por favor, insira um orçamento válido');
      Alert.alert('Erro', 'Por favor, insira um orçamento válido');
      return;
    }

    // Validar prazo
    const deadlineDays = parseInt(deadline, 10);
    console.log('📅 Deadline days:', deadlineDays);
    if (!validateDeadline(deadline)) {
      console.log('❌ Erro: Por favor, insira um prazo válido (1 a 365 dias)');
      Alert.alert('Erro', 'Por favor, insira um prazo válido (1 a 365 dias)');
      return;
    }

    console.log('✅ Validações passaram, mostrando alerta de confirmação');

    // Mostrar aviso importante antes de iniciar
    Alert.alert(
      editMode ? 'Atualizando Pedido' : 'Criando Pedido',
      'Por favor, não feche ou minimize o app até completar a operação. Isso pode levar alguns segundos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Continuar',
          onPress: async () => {
            console.log('🟢 Usuário clicou em Continuar');
            setIsLoading(true);

            try {
              // Filtrar apenas novos anexos (não os que já existem no servidor)
              const newAttachments = attachments
                .filter(att => !att.isExisting)
                .map(attachment => ({
                  uri: attachment.uri,
                  type: attachment.type,
                  name: attachment.name,
                }));

              const orderPayload = {
                title,
                description,
                category,
                budget: budgetValue,
                deadline: deadlineDays,
                address: fullAddress,
                street,
                number: addressNumber,
                complement,
                neighborhood,
                city,
                state: addressState,
                zip_code: zipCode,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                attachments: newAttachments,
                removedAttachments: editMode ? removedAttachments : undefined,
              };

              console.log(editMode ? '📝 Atualizando pedido:' : '📦 Criando pedido:', orderPayload);
              console.log('📎 Total de anexos:', attachments.length);
              console.log('🆕 Novos anexos:', newAttachments.length);
              console.log('🗑️ Anexos removidos:', removedAttachments.length);

              let response;
              if (editMode && orderId) {
                response = await orderService.updateOrder(parseInt(orderId), orderPayload);
              } else {
                response = await orderService.createOrder(orderPayload);
              }

              console.log('📨 Resposta recebida:', response);

              if (response.success) {
                Alert.alert(
                  'Sucesso',
                  editMode
                    ? 'Pedido atualizado com sucesso!'
                    : 'Pedido criado com sucesso! Em breve você receberá propostas de prestadores.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Voltar para a tela anterior (ou duas telas se estiver editando)
                        if (editMode) {
                          navigation.navigate('OrderDetails');
                        } else {
                          navigation.goBack();
                        }
                      },
                    },
                  ]
                );
              } else {
                console.log(editMode ? 'Erro ao atualizar pedido:' : 'Erro ao criar pedido:', response.message);
              }
            } catch (error: any) {
              console.error('❌ ERRO CAPTURADO:', error);
              console.error('❌ Tipo do erro:', typeof error);
              console.error('❌ Error.message:', error.message);
              console.error('❌ Error.response:', error.response);
              console.error('❌ Error.code:', error.code);
              Alert.alert('Erro', error.response?.data?.message || error.message || `Erro ao ${editMode ? 'atualizar' : 'criar'} pedido. Tente novamente.`);
            } finally {
              console.log('🔴 setIsLoading(false)');
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, { paddingTop: insets.top + 60, marginTop: -60 }]}>
            <Text style={styles.title}>{editMode ? 'Editar Pedido' : 'Criar Novo Pedido'}</Text>

            <View style={styles.formCard}>
              <Text style={styles.label}>Título do Serviço</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Pintura de apartamento"
                value={title}
                onChangeText={setTitle}
                editable={!isLoading}
              />

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat ? styles.categoryButtonSelected : styles.categoryButtonUnselected
                    ]}
                    onPress={() => setCategory(cat)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat ? styles.categoryButtonTextSelected : styles.categoryButtonTextUnselected
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva detalhadamente o serviço que você precisa"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                editable={!isLoading}
              />

              <Text style={styles.label}>Endereço do Serviço</Text>

              <Text style={styles.addressSubLabel}>CEP</Text>
              <TextInput
                style={styles.input}
                placeholder="00000-000"
                value={zipCode}
                onChangeText={handleZipCodeChange}
                keyboardType="numeric"
                maxLength={9}
                editable={!isLoading && !isLoadingCep}
              />
              {isLoadingCep && (
                <View style={styles.cepLoadingContainer}>
                  <ActivityIndicator size="small" color="#4f46e5" />
                  <Text style={styles.cepLoadingText}>Buscando endereço...</Text>
                </View>
              )}

              {/* Botão de Geolocalização */}
              <TouchableOpacity
                style={[styles.locationButton, isLoadingLocation && styles.locationButtonDisabled]}
                onPress={handleGetLocation}
                disabled={isLoading || isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Icon name="my-location" size={20} color="#ffffff" />
                )}
                <Text style={styles.locationButtonText}>
                  {isLoadingLocation ? 'Obtendo localização...' : 'Usar minha localização'}
                </Text>
              </TouchableOpacity>

              {latitude && longitude && (
                <View style={styles.coordinatesInfo}>
                  <Icon name="place" size={14} color="#059669" />
                  <Text style={styles.coordinatesText}>
                    Localização obtida ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                  </Text>
                </View>
              )}

              <Text style={styles.addressSubLabel}>Rua / Logradouro</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Rua das Flores"
                value={street}
                onChangeText={handleStreetChange}
                editable={!isLoading}
              />
              {showSearchResults && addressSearchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  {addressSearchResults.map((result, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectAddress(result)}
                    >
                      <Icon name="place" size={18} color="#6b7280" />
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {result.formatted_address || `${result.street}, ${result.city} - ${result.state}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.addressRow}>
                <View style={styles.addressFieldSmall}>
                  <Text style={styles.addressSubLabel}>Número</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={addressNumber}
                    onChangeText={setAddressNumber}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View>
                <View style={styles.addressFieldLarge}>
                  <Text style={styles.addressSubLabel}>Complemento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apto 101, Bloco B"
                    value={complement}
                    onChangeText={setComplement}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <Text style={styles.addressSubLabel}>Bairro</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Centro"
                value={neighborhood}
                onChangeText={setNeighborhood}
                editable={!isLoading}
              />

              <View style={styles.addressRow}>
                <View style={styles.addressFieldLarge}>
                  <Text style={styles.addressSubLabel}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: São Paulo"
                    value={city}
                    onChangeText={setCity}
                    editable={!isLoading}
                  />
                </View>
                <View style={styles.addressFieldSmall}>
                  <Text style={styles.addressSubLabel}>Estado</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="SP"
                    value={addressState}
                    onChangeText={(text) => setAddressState(text.toUpperCase().slice(0, 2))}
                    maxLength={2}
                    autoCapitalize="characters"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <Text style={styles.label}>Anexos</Text>

              {/* Botões para Imagens */}
              <Text style={styles.attachmentSectionTitle}>
                Imagens ({getAttachmentCount('image')}/{LIMITS.image})
              </Text>

              {/* Indicador de Compressão para Imagens */}
              {isCompressing && compressionType === 'image' && (
                <View style={styles.compressingContainer}>
                  <View style={styles.compressingHeader}>
                    <ActivityIndicator size="small" color="#4f46e5" />
                    <Text style={styles.compressingText}>
                      Comprimindo imagem...
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${compressionProgress}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {compressionProgress.toFixed(0)}%
                  </Text>
                </View>
              )}
              <View style={styles.attachmentButtonsContainer}>
                <TouchableOpacity
                  onPress={() => handleAddImage(true)}
                  style={[styles.attachmentButton, getAttachmentCount('image') >= LIMITS.image && styles.attachmentButtonDisabled]}
                  disabled={isLoading || getAttachmentCount('image') >= LIMITS.image}
                >
                  <Icon name="photo-camera" size={30} color={getAttachmentCount('image') >= LIMITS.image ? '#9ca3af' : '#4f46e5'} />
                  <Text style={styles.attachmentButtonText}>Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAddImage(false)}
                  style={[styles.attachmentButton, getAttachmentCount('image') >= LIMITS.image && styles.attachmentButtonDisabled]}
                  disabled={isLoading || getAttachmentCount('image') >= LIMITS.image}
                >
                  <Icon name="photo-library" size={30} color={getAttachmentCount('image') >= LIMITS.image ? '#9ca3af' : '#4f46e5'} />
                  <Text style={styles.attachmentButtonText}>Galeria</Text>
                </TouchableOpacity>
              </View>

              {/* Preview de Imagens */}
              {attachments.filter(att => att.fileType === 'image').length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                  {attachments.map((file, index) => (
                    file.fileType === 'image' && (
                      <View key={index} style={styles.imagePreviewItem}>
                        <Image source={{ uri: file.uri }} style={styles.imagePreview} />
                        <TouchableOpacity
                          onPress={() => removeAttachment(index)}
                          style={styles.removeImageButton}
                          disabled={isLoading}
                        >
                          <Icon name="close" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    )
                  ))}
                </ScrollView>
              )}

              {/* Botão para Vídeo */}
              <Text style={styles.attachmentSectionTitle}>
                Vídeo ({getAttachmentCount('video')}/{LIMITS.video})
              </Text>

              {/* Indicador de Compressão para Vídeo */}
              {isCompressing && compressionType === 'video' && (
                <View style={styles.compressingContainer}>
                  <View style={styles.compressingHeader}>
                    <ActivityIndicator size="small" color="#4f46e5" />
                    <Text style={styles.compressingText}>
                      Comprimindo vídeo...
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${compressionProgress}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {compressionProgress.toFixed(0)}%
                  </Text>
                </View>
              )}

              <View style={styles.attachmentButtonsContainer}>
                <TouchableOpacity
                  onPress={handleAddVideo}
                  style={[styles.attachmentButton, getAttachmentCount('video') >= LIMITS.video && styles.attachmentButtonDisabled]}
                  disabled={isLoading || getAttachmentCount('video') >= LIMITS.video}
                >
                  <Icon name="videocam" size={30} color={getAttachmentCount('video') >= LIMITS.video ? '#9ca3af' : '#4f46e5'} />
                  <Text style={styles.attachmentButtonText}>Adicionar Vídeo</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Vídeos */}
              {attachments.filter(att => att.fileType === 'video').length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {attachments.map((file, index) => (
                    file.fileType === 'video' && (
                      <View key={index} style={styles.attachmentItem}>
                        <Icon name="videocam" size={24} color="#6b7280" />
                        <Text style={styles.attachmentFileName} numberOfLines={1}>{file.name}</Text>
                        <TouchableOpacity onPress={() => removeAttachment(index)} disabled={isLoading}>
                          <Icon name="close" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )
                  ))}
                </View>
              )}

              {/* Botão para Documentos */}
              <Text style={styles.attachmentSectionTitle}>
                Documentos ({getAttachmentCount('document')}/{LIMITS.document})
              </Text>
              <View style={styles.attachmentButtonsContainer}>
                <TouchableOpacity
                  onPress={handleAddDocument}
                  style={[styles.attachmentButton, getAttachmentCount('document') >= LIMITS.document && styles.attachmentButtonDisabled]}
                  disabled={isLoading || getAttachmentCount('document') >= LIMITS.document}
                >
                  <Icon name="attach-file" size={30} color={getAttachmentCount('document') >= LIMITS.document ? '#9ca3af' : '#4f46e5'} />
                  <Text style={styles.attachmentButtonText}>Adicionar Arquivo</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Documentos */}
              {attachments.filter(att => att.fileType === 'document').length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {attachments.map((file, index) => (
                    file.fileType === 'document' && (
                      <View key={index} style={styles.attachmentItem}>
                        <Icon name="insert-drive-file" size={24} color="#6b7280" />
                        <Text style={styles.attachmentFileName} numberOfLines={1}>{file.name}</Text>
                        <TouchableOpacity onPress={() => removeAttachment(index)} disabled={isLoading}>
                          <Icon name="close" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )
                  ))}
                </View>
              )}

              <Text style={styles.label}>Orçamento (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: R$ 1.000,00"
                value={budget}
                onChangeText={handleBudgetChange}
                keyboardType="numeric"
                editable={!isLoading}
              />

              <Text style={styles.label}>Prazo Desejado (dias)</Text>
              <TextInput
                style={[styles.input, styles.lastInput]}
                placeholder="Ex: 15"
                value={deadline}
                onChangeText={handleDeadlineChange}
                keyboardType="numeric"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.loadingText}>
                      Criando Pedido...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    Criar Pedido
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
        backgroundColor="#4f46e5"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 128,
  },
  lastInput: {
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryButtonSelected: {
    backgroundColor: '#4f46e5',
  },
  categoryButtonUnselected: {
    backgroundColor: '#e5e7eb',
  },
  categoryButtonText: {
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  categoryButtonTextUnselected: {
    color: '#1f2937',
  },
  compressingContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  compressingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  compressingText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    textAlign: 'right',
  },
  attachmentSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 8,
  },
  attachmentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  attachmentButton: {
    alignItems: 'center',
    gap: 4,
  },
  attachmentButtonDisabled: {
    opacity: 0.5,
  },
  attachmentButtonText: {
    fontSize: 12,
    color: '#4f46e5',
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentsContainer: {
    marginBottom: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentFileName: {
    flex: 1,
    marginHorizontal: 12,
    color: '#374151',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  // Estilos de endereço estruturado
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  locationButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    gap: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#059669',
  },
  addressSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressFieldSmall: {
    flex: 1,
  },
  addressFieldLarge: {
    flex: 2,
  },
  searchResultsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: -12,
    marginBottom: 12,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  searchResultText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  cepLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: -8,
  },
  cepLoadingText: {
    fontSize: 13,
    color: '#4f46e5',
  },
});