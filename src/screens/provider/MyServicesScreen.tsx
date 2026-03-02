import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Modal, TextInput, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, Keyboard, PermissionsAndroid, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { serviceService, Service, orderService, Order } from '../../services/api';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { formatPrice } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import React from 'react';

const categories = [
  'Limpeza', 'Reparos', 'Tecnologia', 'Aulas', 'Design', 'Eventos',
  'Pintura', 'Elétrica', 'Encanamento', 'Jardinagem', 'Transporte', 'Outros'
];

export default function MyServicesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const { showSuccess, showError } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [extraScrollHeight, setExtraScrollHeight] = useState(0);

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

  useEffect(() => {
    loadMyServices();
    loadActiveOrders();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadActiveOrders();
    }, [])
  );

  const loadActiveOrders = async () => {
    try {
      const response = await orderService.getOrders({ status: 'in_progress' });
      if (response.success) {
        setActiveOrders(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedidos ativos:', error);
    }
  };

  const loadMyServices = async () => {
    try {
      setLoading(true);
      const response = await serviceService.getMyServices();
      setServices(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar serviços:', error);
      showError('Não foi possível carregar seus serviços');
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
      showError('Você pode adicionar no máximo 5 imagens por serviço.');
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
      showError('Permissão da câmera é necessária para tirar fotos.');
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
    setShowNewServiceModal(false);
    setPreviewModalVisible(true);
  };

  const closeImagePreview = () => {
    setPreviewModalVisible(false);
    setShowNewServiceModal(true);
    setTimeout(() => {
      setPreviewImage(null);
    }, 300);
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

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'paused': return '#f59e0b';
      case 'inactive': return '#9ca3af';
      default: return '#9ca3af';
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
      showError('Não foi possível alterar o status do serviço');
    }
  };

  const formatCurrencyInput = (text: string): string => {
    const digits = text.replaceAll(/\D/g, '');
    if (!digits) return '';
    const number = Number.parseInt(digits, 10);
    return (number / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (formatted: string): number => {
    const normalized = formatted.replaceAll('.', '').replace(',', '.');
    return Number.parseFloat(normalized);
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
              showSuccess('Serviço excluído com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir serviço:', error);
              showError('Não foi possível excluir o serviço');
            }
          }
        }
      ]
    );
  };

  const editService = (service: Service) => {
    setNewService({
      title: service.title,
      description: service.description,
      price: Number.parseFloat(service.price.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      category: service.category,
      status: service.status
    });
    setServiceImages(service.images || []);
    setEditingServiceId(service.id);
    setIsEditing(true);
    setShowNewServiceModal(true);
  };

  const handleAddNewService = async () => {
    if (!newService.title || !newService.description || !newService.price || !newService.category) {
      showError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const price = parseCurrencyInput(newService.price);
    if (isNaN(price) || price <= 0) {
      showError('Por favor, insira um preço válido');
      return;
    }

    try {
      if (isEditing) {
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

        showSuccess('Serviço atualizado com sucesso!');
        await loadMyServices();
      } else {
        const response = await serviceService.createService({
          title: newService.title,
          description: newService.description,
          price: price,
          status: newService.status,
          category: newService.category,
          images: serviceImages
        });

        setServices(prevServices => [...prevServices, response.data]);
        showSuccess('Serviço criado com sucesso!');
      }

      setShowNewServiceModal(false);
      resetNewServiceForm();
      setIsEditing(false);
      setEditingServiceId(0);
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      showError('Não foi possível salvar o serviço');
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
    setPreviewModalVisible(false);
    setPreviewImage(null);
  };

  return (
    <View style={styles.container}>
    <View style={styles.headerBackground} />
    <ScrollView
      style={styles.scrollView}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.title}>Meus Serviços</Text>
          <Text style={styles.subtitle}>Gerencie seus serviços ativos</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewServiceModal(true)}
        >
          <Icon name="add" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Resumo</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{services.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.activeText]}>
                {services.filter(s => s.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Ativos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.pendingText]}>
                {services.filter(s => s.status === 'inactive' || s.status === 'paused').length}
              </Text>
              <Text style={styles.statLabel}>Pausados</Text>
            </View>
          </View>
        </View>


        {activeOrders.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>
              Pedidos em Andamento
            </Text>
            {activeOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={{
                  backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 10,
                  borderLeftWidth: 4, borderLeftColor: '#4f46e5',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
                }}
                onPress={() => navigation.navigate('AcceptedOrder', { orderId: order.id })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                      {order.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      {order.category} • R$ {formatPrice(Number(order.budget || 0))}
                    </Text>
                    {order.scheduled_date && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                        <Icon name="event" size={14} color={order.schedule_confirmed_by_client && order.schedule_confirmed_by_provider ? '#10b981' : '#f59e0b'} />
                        <Text style={{ fontSize: 12, color: order.schedule_confirmed_by_client && order.schedule_confirmed_by_provider ? '#10b981' : '#f59e0b', fontWeight: '500' }}>
                          {new Date(order.scheduled_date).toLocaleDateString('pt-BR')} às {new Date(order.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="chat" size={18} color="#4f46e5" />
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}


        <View style={styles.servicesList}>
          {services.map((service) => (
            <View key={service.id} style={[styles.serviceCard, { borderLeftColor: getStatusBorderColor(service.status) }]}>
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
                <Text style={styles.servicePrice}>R$ {formatPrice(Number.parseFloat(service.price.toString().replace(",", ".")))}</Text>
                <Text style={styles.serviceDate}>
                  Criado em {new Date(service.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>


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


        {services.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum serviço cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Comece criando seu primeiro serviço para começar a receber propostas
            </Text>
          </View>
        )}
      </View>


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

            <View style={styles.formSection}>

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
                onChangeText={(text) => setNewService(prev => ({ ...prev, price: formatCurrencyInput(text) }))}
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
                    setShowNewServiceModal(true);
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


    <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#4f46e5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 28,
    backgroundColor: '#4f46e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    minHeight: 500,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 28,
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
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  serviceCategory: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  serviceDescription: {
    color: '#6b7280',
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4f46e5',
  },
  serviceDate: {
    color: '#9ca3af',
    fontSize: 11,
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
    gap: 8,
  },
  editButton: {
    backgroundColor: '#eef2ff',
    padding: 8,
    borderRadius: 10,
  },
  toggleButton: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deleteButton: {
    backgroundColor: '#fff1f2',
    padding: 8,
    borderRadius: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
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