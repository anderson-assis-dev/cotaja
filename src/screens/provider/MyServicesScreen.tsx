import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Modal, TextInput, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, Keyboard, PermissionsAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { serviceService, Service } from '../../services/api';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { formatPrice } from '../../utils/formatters';

// Categorias disponíveis
const categories = [
  'Limpeza', 'Reparos', 'Tecnologia', 'Aulas', 'Design', 'Eventos',
  'Pintura', 'Elétrica', 'Encanamento', 'Jardinagem', 'Transporte', 'Outros'
];

export default function MyServicesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [extraScrollHeight, setExtraScrollHeight] = useState(0);

  // Estados para o modal de novo serviço
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number>(0);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    status: 'active' as 'active' | 'inactive' | 'paused'
  });
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Carregar serviços do usuário
  useEffect(() => {
    loadMyServices();
  }, []);

  const loadMyServices = async () => {
    try {
      setLoading(true);
      const response = await serviceService.getMyServices();
      setServices(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar serviços:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus serviços');
    } finally {
      setLoading(false);
    }
  };

  const scrollToInput = (inputPosition: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: inputPosition,
        animated: true,
      });
    }, 100);
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permissão da Câmera',
            message: 'Este app precisa de acesso à câmera para tirar fotos.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const selectImageSource = () => {
    if (serviceImages.length >= 5) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 5 imagens por serviço.');
      return;
    }

    Alert.alert(
      'Selecionar Imagem',
      'Escolha de onde você quer selecionar a imagem',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Galeria', onPress: () => openImageLibrary() },
        { text: 'Câmera', onPress: () => openCamera() },
      ]
    );
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8 as PhotoQuality,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const base64 = response.assets[0].base64;
        if (base64) {
          setServiceImages(prev => [...prev, `data:image/jpeg;base64,${base64}`]);
        }
      }
    });
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permissão negada', 'Permissão da câmera é necessária para tirar fotos.');
      return;
    }

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8 as PhotoQuality,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const base64 = response.assets[0].base64;
        if (base64) {
          setServiceImages(prev => [...prev, `data:image/jpeg;base64,${base64}`]);
        }
      }
    });
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Remover Imagem',
      'Tem certeza que deseja remover esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setServiceImages(prev => prev.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };

  const openImagePreview = (imageUri: string) => {
    console.log('Opening image preview for:', imageUri);
    setPreviewImage(imageUri);
    setShowNewServiceModal(false); // Hide the form modal
    setPreviewModalVisible(true);
  };

  const closeImagePreview = () => {
    setPreviewModalVisible(false);
    setShowNewServiceModal(true); // Restore the form modal
    setTimeout(() => {
      setPreviewImage(null);
    }, 300); // Delay to allow animation to complete
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#22c55e' };
      case 'inactive':
        return { backgroundColor: '#6b7280' };
      case 'paused':
        return { backgroundColor: '#f59e0b' };
      default:
        return { backgroundColor: '#6b7280' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'paused':
        return 'Pausado';
      default:
        return 'Desconhecido';
    }
  };

  const toggleServiceStatus = async (serviceId: number) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const newStatus = service.status === 'active' ? 'inactive' : 'active';

      await serviceService.updateService(serviceId, {
        title: service.title,
        description: service.description,
        price: service.price,
        category: service.category,
        status: newStatus
      });

      setServices(prevServices =>
        prevServices.map(s =>
          s.id === serviceId ? { ...s, status: newStatus } : s
        )
      );
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status do serviço');
    }
  };

  const deleteService = (serviceId: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este serviço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceService.deleteService(serviceId);
              setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
              Alert.alert('Sucesso', 'Serviço excluído com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir serviço:', error);
              Alert.alert('Erro', 'Não foi possível excluir o serviço');
            }
          }
        }
      ]
    );
  };

  const editService = (service: Service) => {
    // Preencher o modal com os dados do serviço para edição
    setNewService({
      title: service.title,
      description: service.description,
      price: service.price.toString().replace('.', ','),
      category: service.category,
      status: service.status
    });
    // Load existing images if they exist
    setServiceImages(service.images || []);
    setEditingServiceId(service.id);
    setIsEditing(true);
    setShowNewServiceModal(true);
  };

  const handleAddNewService = async () => {
    if (!newService.title || !newService.description || !newService.price || !newService.category) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const priceString = newService.price.replace(',', '.');
    const price = parseFloat(priceString);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Por favor, insira um preço válido');
      return;
    }

    try {
      if (isEditing) {
        // Atualizar serviço existente usando a API
        await serviceService.updateService(editingServiceId, {
          title: newService.title,
          description: newService.description,
          price: price,
          status: newService.status,
          category: newService.category,
          images: serviceImages
        });

        setServices(prevServices =>
          prevServices.map(service =>
            service.id === editingServiceId
              ? {
                  ...service,
                  title: newService.title,
                  description: newService.description,
                  price: price,
                  status: newService.status,
                  category: newService.category,
                  images: serviceImages
                }
              : service
          )
        );

        Alert.alert('Sucesso', 'Serviço atualizado com sucesso!');
        // Reload services to ensure we have the latest data
        await loadMyServices();
      } else {
        // Criar novo serviço usando a API
        const response = await serviceService.createService({
          title: newService.title,
          description: newService.description,
          price: price,
          status: newService.status,
          category: newService.category,
          images: serviceImages
        });

        setServices(prevServices => [...prevServices, response.data]);
        Alert.alert('Sucesso', 'Serviço criado com sucesso!');
      }

      setShowNewServiceModal(false);
      resetNewServiceForm();
      setIsEditing(false);
      setEditingServiceId(0);
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      Alert.alert('Erro', 'Não foi possível salvar o serviço');
    }
  };

  const resetNewServiceForm = () => {
    setNewService({
      title: '',
      description: '',
      price: '',
      category: '',
      status: 'active' as 'active' | 'inactive' | 'paused'
    });
    setServiceImages([]);
    setIsEditing(false);
    setEditingServiceId(0);
    // Close any open preview modal
    setPreviewModalVisible(false);
    setPreviewImage(null);
  };

  return (
    <View style={styles.container}>
    <ScrollView
      style={[styles.scrollView, { paddingTop: insets.top }]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meus Serviços</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewServiceModal(true)}
          >
            <Icon name="add" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumo</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{services.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.activeText]}>
                {services.filter(s => s.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Ativos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.pendingText]}>
                {services.filter(s => s.status === 'inactive' || s.status === 'paused').length}
              </Text>
              <Text style={styles.statLabel}>Pausados</Text>
            </View>
          </View>
        </View>

        {/* Services List */}
        <View style={styles.servicesList}>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceCategory}>{service.category}</Text>
                </View>
                <View style={[styles.statusBadge, getStatusBadgeStyle(service.status)]}>
                  <Text style={styles.statusText}>{getStatusText(service.status)}</Text>
                </View>
              </View>

              <Text style={styles.serviceDescription}>{service.description}</Text>

              <View style={styles.serviceMeta}>
                <Text style={styles.servicePrice}>R$ {formatPrice(parseFloat(service.price.toString().replace(",", ".")))}</Text>
                <Text style={styles.serviceDate}>
                  Criado em {new Date(service.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>

              {/* Action Icons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editService(service)}
                >
                  <Icon name="edit" size={20} color="#4f46e5" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => toggleServiceStatus(service.id)}
                >
                  <Icon
                    name={service.status === 'active' ? 'pause' : 'play-arrow'}
                    size={20}
                    color={service.status === 'active' ? '#6b7280' : '#22c55e'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteService(service.id)}
                >
                  <Icon name="delete" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {services.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum serviço cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Comece criando seu primeiro serviço para começar a receber propostas
            </Text>
          </View>
        )}
      </View>

      {/* Modal para Novo Serviço */}
      <Modal
        visible={showNewServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
              </Text>
              <Text style={styles.formSectionTitle}>Informações do Serviço</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowNewServiceModal(false);
                resetNewServiceForm();
              }}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: extraScrollHeight }}
          >
            {/* Informações do Serviço */}
            <View style={styles.formSection}>
              {/* Imagens do Serviço */}
              <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Fotos do Serviço ({serviceImages.length}/5)</Text>
              <Text style={styles.imageHint}>
                Adicione fotos para mostrar melhor seu serviço
              </Text>
              <View style={styles.imageSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                  <View style={styles.imageContainer}>
                    {serviceImages.length < 5 && (
                      <TouchableOpacity
                        style={styles.addImageButton}
                        onPress={selectImageSource}
                      >
                        <Icon name="add-a-photo" size={32} color="#4f46e5" />
                        <Text style={styles.addImageText}>
                          {serviceImages.length === 0 ? 'Adicionar Fotos' : 'Adicionar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {serviceImages.map((image, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <TouchableOpacity
                          onPress={() => openImagePreview(image)}
                          activeOpacity={0.8}
                          style={styles.serviceImageTouchable}
                        >
                          <Image source={{ uri: image }} style={styles.serviceImage} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Icon name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Text style={styles.fieldLabel}>Título do Serviço *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Limpeza Residencial"
                value={newService.title}
                onChangeText={(text) => setNewService(prev => ({ ...prev, title: text }))}
                onFocus={() => scrollToInput(200)}
              />

              <Text style={styles.fieldLabel}>Categoria *</Text>
              <View style={styles.categorySelector}>
                <View style={styles.categoryRow}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        newService.category === category && styles.categoryChipSelected
                      ]}
                      onPress={() => setNewService(prev => ({ ...prev, category }))}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          newService.category === category && styles.categoryChipTextSelected
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="clip"
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.fieldLabel}>Descrição *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Descreva seu serviço em detalhes..."
                value={newService.description}
                onChangeText={(text) => setNewService(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => {
                  setExtraScrollHeight(120);
                  scrollToInput(350);
                }}
                onBlur={() => setExtraScrollHeight(0)}
              />

              <Text style={styles.fieldLabel}>Preço Médio(R$) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0,00"
                value={newService.price}
                onChangeText={(text) => setNewService(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
                onFocus={() => {
                  setExtraScrollHeight(180);
                  scrollToInput(500);
                }}
                onBlur={() => setExtraScrollHeight(0)}
              />

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    newService.status === 'active' && styles.statusButtonActive
                  ]}
                  onPress={() => setNewService(prev => ({ ...prev, status: 'active' }))}
                >
                  <Text style={[
                    styles.statusButtonText,
                    newService.status === 'active' && styles.statusButtonTextActive
                  ]}>
                    Ativo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    newService.status === 'inactive' && styles.statusButtonInactive
                  ]}
                  onPress={() => setNewService(prev => ({ ...prev, status: 'inactive' }))}
                >
                  <Text style={[
                    styles.statusButtonText,
                    newService.status === 'inactive' && styles.statusButtonTextInactive
                  ]}>
                    Inativo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    newService.status === 'paused' && styles.statusButtonPending
                  ]}
                  onPress={() => setNewService(prev => ({ ...prev, status: 'paused' }))}
                >
                  <Text style={[
                    styles.statusButtonText,
                    newService.status === 'paused' && styles.statusButtonTextPending
                  ]}>
                    Pausado
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões de Ação */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewServiceModal(false);
                  resetNewServiceForm();
                }}
              >
                <Icon name="close" size={24} color="#ffffffff" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddNewService}
              >
                <Icon name="check" size={24} color="#4f46e5" />
                <Text style={styles.confirmButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>

    {/* Image Preview Modal */}
    <Modal
      visible={previewModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeImagePreview}
    >
      <View style={styles.previewModalContainer}>
        <TouchableOpacity
          style={styles.previewModalOverlay}
          onPress={closeImagePreview}
          activeOpacity={1}
        >
          <View style={styles.previewModalContent}>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            )}
            <View style={styles.previewModalButtons}>
              <TouchableOpacity
                style={[styles.previewButton, styles.removeButton]}
                onPress={() => {
                  const imageIndex = serviceImages.findIndex(img => img === previewImage);
                  if (imageIndex !== -1) {
                    setPreviewModalVisible(false);
                    setShowNewServiceModal(true); // Restore the form modal
                    setTimeout(() => {
                      setPreviewImage(null);
                      removeImage(imageIndex);
                    }, 300);
                  }
                }}
              >
                <Icon name="delete" size={20} color="#fff" />
                <Text style={styles.previewButtonText}>Remover</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewButton, styles.keepButton]}
                onPress={closeImagePreview}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.previewButtonText}>Manter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>

    {/* Status Bar Overlay */}
    <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  activeText: {
    color: '#22c55e',
  },
  pendingText: {
    color: '#f59e0b',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  servicesList: {
    gap: 2,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceCategory: {
    color: '#6b7280',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  serviceDescription: {
    color: '#374151',
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  serviceDate: {
    color: '#6b7280',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    color: '#f59e0b',
    marginRight: 4,
    fontSize: 16,
  },
  ratingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  jobsText: {
    color: '#9ca3af',
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#e0e7ff',
    padding: 8,
    borderRadius: 20,
  },
  toggleButton: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginVertical: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderText: {
    flexDirection: 'column',
    gap: 2
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    marginBottom: 20
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  formSection: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6d6d6dff',
  },
  fieldLabel: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 100,
    fontSize: 16,
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    width: 'auto',
  },
  categoryChipSelected: {
    backgroundColor: '#4f46e5',
  },
  categoryChipText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  statusButtonActive: {
    backgroundColor: '#22c55e',
  },
  statusButtonInactive: {
    backgroundColor: '#6b7280',
  },
  statusButtonPending: {
    backgroundColor: '#f59e0b',
  },
  statusButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  statusButtonTextInactive: {
    color: '#ffffff',
  },
  statusButtonTextPending: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: '#ff3030ff',
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: (Dimensions.get('window').width / 2) - 30,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: (Dimensions.get('window').width / 2) - 30,
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#4f46e5',
    marginLeft: 5,
    fontWeight: '600',
  },
  imageSection: {
    marginVertical: 14,
    borderRadius: 12,
  },
  imageScrollView: {
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceImageTouchable: {
    borderRadius: 12,
  },
  serviceImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    marginRight: 16,
  },
  addImageText: {
    fontSize: 11,
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  imageHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'justify',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 10
  },
  previewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  previewModalOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10000,
    elevation: 10000,
  },
  previewModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: screenWidth - 20,
    height: screenWidth,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  previewModalButtons: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  keepButton: {
    backgroundColor: '#22c55e',
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});