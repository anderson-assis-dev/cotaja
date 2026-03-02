import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator, Linking, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Play } from 'lucide-react-native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { OrderCardSkeleton, SkeletonBlock } from '../../components/Skeleton';
import { providerService, ratingService, serviceService, Service } from '../../services/api';
import { getAttachmentName, getAttachmentUrl } from '../../utils/attachmentHelpers';
import { SERVICE_CATEGORIES, filterCategories } from '../../utils/serviceCategories';
import { useToast } from '../../contexts/ToastContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const defaultCompanyImage = require('../../../assets/icon.png');
type Company = { id: string; name: string; category: string; rating: number; ratingsCount: number; description: string; phone: string; image: any; serviceCategories?: string[]; _raw?: any; };
type ProviderRatingItem={id?:number;provider_id?:string;client_id?:string;rating?:number;comment?:string|null;attachments?:any[]|null;created_at?:string;client_name?:string;client_avatar_base64?:string;};
const normalizeAvatarUri = (avatar?: string) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('file:')) return avatar;
  return `data:image/jpeg;base64,${avatar}`;
};
const formatDate=(value?:string)=>{
  if(!value)return'';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return String(value);
  return d.toLocaleDateString('pt-BR');
};

const CompanyCard = ({ company, onPress }: { company: Company, onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.companyCard}>
    <View style={styles.companyInfo}>
        <Image source={company.image} style={styles.companyAvatar} />
        <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyCategory}>{company.category}</Text>
        </View>
    </View>
    <View style={styles.ratingContainer}>
      <Icon name="star" size={18} color="#f59e0b" />
      <Text style={styles.ratingText}>{company.rating}</Text>
    </View>
  </TouchableOpacity>
);

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [providerRatings,setProviderRatings]=useState<ProviderRatingItem[]>([]);
  const [loadingRatings,setLoadingRatings]=useState(false);
  const [ratingsError,setRatingsError]=useState<string|null>(null);
  const [attachmentsModalVisible,setAttachmentsModalVisible]=useState(false);
  const [attachmentsModalItems,setAttachmentsModalItems]=useState<any[]>([]);
  const [attachmentsModalTitle,setAttachmentsModalTitle]=useState('');
  const [previewImageUrl,setPreviewImageUrl]=useState<string|null>(null);
  const [requestingQuote,setRequestingQuote]=useState(false);
  const [providerServices, setProviderServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [serviceImagePreview, setServiceImagePreview] = useState<string | null>(null);
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();
  const { showSuccess, showError } = useToast();

  const fetchCompanies = async (category?: string | null) => {
    setLoadingCompanies(true);
    try {
      const params = category ? { category } : undefined;
      const response = await serviceService.getAvailableServices(params);
      const services = response?.success && response.data?.data && Array.isArray(response.data.data) ? response.data.data : [];
      const map = new Map<string, Company>();
      for (const service of services) {
        const provider = service?.provider;
        if (!provider?.id) continue;
        if (map.has(provider.id.toString())) continue;
        const providerCategory = category || (service?.category || (provider?.service_categories?.[0] || 'Serviços'));
        const avatarUri = normalizeAvatarUri(provider?.avatar_base64);
        const avgRatingRaw: any = (provider as any)?.avg_rating ?? (provider as any)?.rate ?? 0;
        const ratingsCountRaw: any = (provider as any)?.ratings_count ?? 0;
        const avgRating = Number(avgRatingRaw);
        const ratingsCount = Number(ratingsCountRaw);
        map.set(provider.id.toString(), {
          id: provider.id.toString(),
          name: provider?.name || 'Empresa',
          category: providerCategory,
          rating: Number.isFinite(avgRating) ? avgRating : 0,
          ratingsCount: Number.isFinite(ratingsCount) ? ratingsCount : 0,
          description: provider?.address || 'Sem descrição',
          phone: provider?.phone || 'Não informado',
          image: avatarUri ? { uri: avatarUri } : defaultCompanyImage,
          serviceCategories: Array.isArray(provider?.service_categories) ? provider.service_categories : [],
          _raw: provider
        });
      }
      const list = Array.from(map.values()).sort((a, b) => {
        const ac = a.ratingsCount || 0;
        const bc = b.ratingsCount || 0;
        if (ac === 0 && bc > 0) return 1;
        if (bc === 0 && ac > 0) return -1;
        if (bc !== ac) return bc - ac;
        return (b.rating || 0) - (a.rating || 0);
      });
      setCompanies(list);
    } catch (e) {
      console.warn('fetchCompanies error', e);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompanies(selectedCategory);
  }, [selectedCategory]);
  useEffect(()=>{
    let mounted=true;
    const providerId=selectedCompany?.id;
    if(!providerId){setProviderRatings([]);setRatingsError(null);setLoadingRatings(false);return()=>{mounted=false;};}
    setLoadingRatings(true);
    setRatingsError(null);
    ratingService.getProviderRatings(providerId).then(res=>{
      const rows=Array.isArray(res?.data?.data)?res.data.data:[];
      if(mounted)setProviderRatings(rows);
    }).catch(e=>{
      console.warn('fetchRatings error',e);
      if(mounted){setProviderRatings([]);setRatingsError('Erro ao carregar avaliações');}
    }).finally(()=>{if(mounted)setLoadingRatings(false);});
    return()=>{mounted=false;};
  },[selectedCompany?.id]);

  useEffect(() => {
    let mounted = true;
    const providerId = selectedCompany?.id;
    if (!providerId) { setProviderServices([]); setLoadingServices(false); setSelectedServiceId(null); return () => { mounted = false; }; }
    setLoadingServices(true);
    setSelectedServiceId(null);
    serviceService.getProviderServices(providerId).then(res => {
      if (mounted && res?.success) setProviderServices(res.data || []);
    }).catch(() => {
      if (mounted) setProviderServices([]);
    }).finally(() => { if (mounted) setLoadingServices(false); });
    return () => { mounted = false; };
  }, [selectedCompany?.id]);

  const filteredCompanies = useMemo(() => {
    let list = companies;
    if (searchQuery.length > 1) {
      const lowercasedQuery = searchQuery.toLowerCase();
      list = list.filter(
        c => c.name.toLowerCase().includes(lowercasedQuery) ||
             c.category.toLowerCase().includes(lowercasedQuery)
      );
    }
    return list;
  }, [searchQuery, companies]);

  const handleCategoryPress = (categoryName: string) => {
    setSearchQuery('');
    setSelectedCategory(prev => (prev === categoryName ? null : categoryName));
  };

  const handleCompanyPress = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
    setProviderServices([]);
    setSelectedServiceId(null);
    setServiceImagePreview(null);
  };
  const handleCloseAttachmentsModal=()=>{
    setAttachmentsModalVisible(false);
    setAttachmentsModalItems([]);
    setAttachmentsModalTitle('');
    setPreviewImageUrl(null);
  };
  const handleOpenAttachment=async(att:any)=>{
    const url=getAttachmentUrl(att);
    if(!url){showError('Anexo inválido');return;}
    if(typeof url==='string'&&url.startsWith('data:image/')){setPreviewImageUrl(url);return;}
    try{
      const supported=await Linking.canOpenURL(url);
      if(!supported){showError('Não foi possível abrir o anexo');return;}
      await Linking.openURL(url);
    }catch(e){
      console.warn('openAttachment error',e);
      showError('Não foi possível abrir o anexo');
    }
  };

  const handleRequestQuote=async()=>{
    if(!selectedCompany||requestingQuote)return;
    try{
      setRequestingQuote(true);
      const res=await providerService.requestQuote(selectedCompany.id);
      showSuccess(res?.message||'Solicitação enviada com sucesso');
      handleCloseModal();
    }catch(e:any){
      const msg=e?.response?.data?.message||e?.message||'Não foi possível solicitar orçamento';
      if(String(msg).toLowerCase().includes('cadastrar um pedido')){
        Alert.alert('Atenção',msg,[{text:'Cadastrar pedido',onPress:()=>navigation.navigate('Home',{screen:'CreateOrder',params:{...(route.params as any)}})},{text:'OK'}]);
      }else{
        showError(msg);
      }
    }finally{
      setRequestingQuote(false);
    }
  };
  const renderCompanies=()=>{
    if(loadingCompanies)return(
      <View>
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </View>
    );
    if(filteredCompanies.length>0)return filteredCompanies.map((company)=>(
      <CompanyCard key={company.id} company={company} onPress={()=>handleCompanyPress(company)} />
    ));
    return(
      <View style={styles.emptyState}>
        <Icon name="search-off" size={40} color="#9ca3af" />
        <Text style={styles.emptyStateText}>Nenhuma empresa encontrada. Tente uma busca diferente.</Text>
      </View>
    );
  };
  const renderRatings=()=>{
    if(loadingRatings)return(
      <View style={styles.ratingsLoading}>
        <ActivityIndicator size="small" color="#4f46e5" />
        <Text style={styles.ratingsLoadingText}>Carregando avaliações...</Text>
      </View>
    );
    if(providerRatings.length>0)return providerRatings.map((r,idx)=>{
      const avatar=normalizeAvatarUri(r.client_avatar_base64||undefined);
      const ratingValue=Number(r.rating)||0;
      const attachmentsCount=Array.isArray(r.attachments)?r.attachments.length:0;
      const openAttachments=()=>{
        if(!Array.isArray(r.attachments)||r.attachments.length===0)return;
        setAttachmentsModalTitle(r.client_name||'Anexos');
        setAttachmentsModalItems(r.attachments);
        setAttachmentsModalVisible(true);
      };
      return(
        <View key={`${r.id||'r'}-${idx}`} style={styles.ratingItem}>
          <View style={styles.ratingHeader}>
            <View style={styles.clientRow}>
              <Image source={avatar?{uri:avatar}:defaultCompanyImage} style={styles.clientAvatar} />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{r.client_name||'Cliente'}</Text>
                <Text style={styles.ratingMeta}>{formatDate(r.created_at)}</Text>
              </View>
            </View>
            <View style={styles.ratingValueBox}>
              <Icon name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingValueText}>{ratingValue.toFixed(1)}</Text>
            </View>
          </View>
          {r.comment?(<Text style={styles.ratingComment}>{String(r.comment)}</Text>):null}
          {attachmentsCount>0?(
            <TouchableOpacity style={styles.attachmentsButton} onPress={openAttachments}>
              <Text style={styles.attachmentsButtonText}>{`Ver anexos (${attachmentsCount})`}</Text>
            </TouchableOpacity>
          ):null}
        </View>
      );
    });
    if(ratingsError)return <Text style={styles.noRatingsText}>{ratingsError}</Text>;
    return <Text style={styles.noRatingsText}>Nenhuma avaliação ainda.</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Encontrar Empresas</Text>
          <Text style={styles.headerSubtitle}>Busque prestadores e serviços</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={24} color="#9ca3af" />
            <TextInput placeholder="Buscar por nome ou categoria..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.categorySearchRow}>
              <Icon name="search" size={20} color="#9ca3af" />
              <TextInput placeholder="Buscar categoria..." style={styles.categorySearchInput} value={categoryFilter} onChangeText={setCategoryFilter} />
              {categoryFilter !== '' && (
                <TouchableOpacity onPress={() => setCategoryFilter('')}>
                  <Icon name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBadgeScroll} contentContainerStyle={styles.categoryBadgeScrollContent}>
              {selectedCategory && (
                <TouchableOpacity style={[styles.categoryBadge, styles.categoryBadgeSelected]} onPress={() => handleCategoryPress(selectedCategory)}>
                  <Icon name={SERVICE_CATEGORIES.find(c => c.name === selectedCategory)?.icon || 'label'} size={16} color="#4f46e5" />
                  <Text style={[styles.categoryBadgeText, styles.categoryBadgeTextSelected]}>{selectedCategory} ✕</Text>
                </TouchableOpacity>
              )}
              {filterCategories(categoryFilter).filter(c => c.name !== selectedCategory).slice(0, categoryFilter ? 50 : 15).map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.categoryBadge, styles.categoryBadgeUnselected]} onPress={() => { handleCategoryPress(cat.name); setCategoryFilter(''); }}>
                  <Icon name={cat.icon} size={16} color="#6b7280" />
                  <Text style={[styles.categoryBadgeText, styles.categoryBadgeTextUnselected]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {!categoryFilter && SERVICE_CATEGORIES.length > 15 && (
              <Text style={styles.categoryHintText}>Busque acima para ver mais categorias...</Text>
            )}
          </View>
          <View>
            <Text style={styles.sectionTitle}>{searchQuery || selectedCategory ? 'Resultados da Busca' : 'Empresas Populares'}</Text>
            {renderCompanies()}
          </View>
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedCompany}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Icon name="close" size={30} color="#6b7280" />
            </TouchableOpacity>

            {selectedCompany && (
              <>
                <View style={styles.modalCompanyInfo}>
                    <Image source={selectedCompany.image} style={styles.modalCompanyAvatar} />
                    <Text style={styles.modalCompanyName}>{selectedCompany.name}</Text>
                    <View style={styles.modalRatingBadge}>
                        <Icon name="star" size={18} color="#f59e0b" />
                        <Text style={styles.modalRatingText}>{`${Number(selectedCompany.rating||0).toFixed(1)} (${selectedCompany.ratingsCount||0})`}</Text>
                    </View>
                </View>

                {selectedCompany.serviceCategories && selectedCompany.serviceCategories.length > 0 && (
                  <View style={styles.categoriesBadgeContainer}>
                    {selectedCompany.serviceCategories.map((cat, idx) => (
                      <View key={`cat-${idx}`} style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalDescription}>{selectedCompany.description}</Text>

                    <View style={styles.servicesSection}>
                      <Text style={styles.servicesSectionTitle}>Serviços Oferecidos</Text>
                      {loadingServices ? (
                        <View style={{ gap: 12 }}>
                          <SkeletonBlock width="100%" height={120} borderRadius={12} />
                          <SkeletonBlock width="100%" height={120} borderRadius={12} />
                        </View>
                      ) : providerServices.length > 0 ? (
                        providerServices.map(svc => {
                          const isSelected = selectedServiceId === svc.id;
                          const images = Array.isArray(svc.images) ? svc.images : [];
                          return (
                            <TouchableOpacity
                              key={svc.id}
                              style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                              onPress={() => setSelectedServiceId(isSelected ? null : svc.id)}
                              activeOpacity={0.8}
                            >
                              {images.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceImagesRow}>
                                  {images.map((img: string, imgIdx: number) => {
                                    const isVideo = img.match(/\.(mp4|mov|webm)$/i);
                                    const isBase64 = img.startsWith('data:');
                                    const imgUri = isBase64 ? img : img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`;
                                    if (isVideo) {
                                      return (
                                        <TouchableOpacity key={`img-${imgIdx}`} style={styles.serviceImageWrap} onPress={() => Linking.openURL(img)}>
                                          <View style={[styles.serviceImage, styles.videoPlaceholder]}>
                                            <Play size={24} color="#fff" />
                                          </View>
                                        </TouchableOpacity>
                                      );
                                    }
                                    return (
                                      <TouchableOpacity key={`img-${imgIdx}`} style={styles.serviceImageWrap} onPress={() => setServiceImagePreview(imgUri)}>
                                        <Image source={{ uri: imgUri }} style={styles.serviceImage} />
                                      </TouchableOpacity>
                                    );
                                  })}
                                </ScrollView>
                              )}
                              <View style={styles.serviceInfo}>
                                <Text style={styles.serviceTitle}>{svc.title}</Text>
                                <Text style={styles.serviceDescription} numberOfLines={2}>{svc.description}</Text>
                                <View style={styles.serviceFooter}>
                                  <View style={styles.serviceCategoryTag}>
                                    <Text style={styles.serviceCategoryTagText}>{svc.category}</Text>
                                  </View>
                                  <Text style={styles.servicePrice}>
                                    {Number(svc.price) > 0
                                      ? `R$ ${Number(svc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                      : 'A combinar'}
                                  </Text>
                                </View>
                              </View>
                              {isSelected && (
                                <View style={styles.selectedIndicator}>
                                  <Icon name="check-circle" size={18} color="#4f46e5" />
                                  <Text style={styles.selectedIndicatorText}>Selecionado</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.noServicesBox}>
                          <Icon name="inventory-2" size={32} color="#d1d5db" />
                          <Text style={styles.noServicesText}>Nenhum serviço cadastrado.</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.contactCard}>
                        <Text style={styles.contactTitle}>Contato</Text>
                        <Text style={styles.contactPhone}>{selectedCompany.phone}</Text>
                    </View>
                    <View style={styles.ratingsSection}>
                      <Text style={styles.ratingsTitle}>Avaliações</Text>
                      {renderRatings()}
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={[styles.quoteButton, !selectedServiceId && providerServices.length > 0 && styles.quoteButtonDisabled]}
                    onPress={handleRequestQuote}
                    disabled={requestingQuote || (!selectedServiceId && providerServices.length > 0)}
                  >
                    {requestingQuote?(
                      <View style={styles.quoteLoadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.actionButtonText}>Enviando...</Text>
                      </View>
                    ):(
                      <Text style={styles.actionButtonText}>
                        {providerServices.length > 0 && !selectedServiceId
                          ? 'Selecione um serviço acima'
                          : 'Solicitar Orçamento'}
                      </Text>
                    )}
                  </TouchableOpacity>
              </>
            )}
          </View>

          {attachmentsModalVisible && (
            <View style={styles.attachmentsOverlayInModal}>
              <TouchableOpacity style={styles.attachmentsBackdrop} onPress={handleCloseAttachmentsModal} />
              <View style={[styles.attachmentsModalContent,{paddingBottom:insets.bottom+16}]}>
                <View style={styles.attachmentsModalHeader}>
                  <Text style={styles.attachmentsModalTitle}>{attachmentsModalTitle||'Anexos'}</Text>
                  <TouchableOpacity onPress={handleCloseAttachmentsModal} style={styles.attachmentsModalClose}>
                    <Icon name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {previewImageUrl?(
                    <View style={styles.previewBox}>
                      <Image source={{uri:previewImageUrl}} style={styles.previewImage} />
                      <TouchableOpacity style={styles.previewClose} onPress={()=>setPreviewImageUrl(null)}>
                        <Text style={styles.previewCloseText}>Fechar</Text>
                      </TouchableOpacity>
                    </View>
                  ):null}
                  {attachmentsModalItems.length>0?attachmentsModalItems.map((att,idx)=>{
                    const name=getAttachmentName(att);
                    const url=getAttachmentUrl(att);
                    const type=att?.mime_type||att?.type||'';
                    return(
                      <TouchableOpacity key={`${name}-${idx}`} style={styles.attachmentRow} onPress={()=>handleOpenAttachment(att)}>
                        <View style={styles.attachmentRowLeft}>
                          <Icon name="attach-file" size={20} color="#4f46e5" />
                          <View style={styles.attachmentRowInfo}>
                            <Text style={styles.attachmentRowName} numberOfLines={1}>{name}</Text>
                            <Text style={styles.attachmentRowMeta} numberOfLines={1}>{type||url}</Text>
                          </View>
                        </View>
                        <Icon name="open-in-new" size={18} color="#6b7280" />
                      </TouchableOpacity>
                    );
                  }):(
                    <Text style={styles.noRatingsText}>Nenhum anexo.</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}

          {serviceImagePreview && (
            <View style={styles.serviceImagePreviewOverlay}>
              <TouchableOpacity style={styles.serviceImagePreviewBackdrop} onPress={() => setServiceImagePreview(null)} />
              <View style={styles.serviceImagePreviewContainer}>
                <Image source={{ uri: serviceImagePreview }} style={styles.serviceImagePreviewFull} resizeMode="contain" />
                <TouchableOpacity style={styles.serviceImagePreviewClose} onPress={() => setServiceImagePreview(null)}>
                  <Icon name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} backgroundColor="#4f46e5" forceLight />
    </View>
  );
}

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
  headerSection: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
  },
  loadingBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categorySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 10,
  },
  categoryBadgeScroll: {
    marginBottom: 4,
  },
  categoryBadgeScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  categoryBadgeSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  categoryBadgeUnselected: {
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBadgeTextSelected: {
    color: '#4f46e5',
  },
  categoryBadgeTextUnselected: {
    color: '#6b7280',
  },
  categoryHintText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 8,
  },
  companyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  companyCategory: {
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  modalCompanyInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCompanyAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'white',
  },
  modalCompanyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  categoriesBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  categoryBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  modalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  modalRatingText: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#d97706',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactPhone: {
    color: '#6b7280',
  },
  quoteButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  quoteButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  quoteLoadingRow:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap:10,
  },
  actionButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  ratingsSection:{
    marginTop:8,
  },
  ratingsTitle:{
    fontSize:18,
    fontWeight:'600',
    color:'#374151',
    marginBottom:12,
  },
  ratingsLoading:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'white',
    borderRadius:12,
    padding:12,
  },
  ratingsLoadingText:{
    marginLeft:10,
    color:'#6b7280',
  },
  ratingItem:{
    backgroundColor:'white',
    borderRadius:12,
    padding:14,
    marginBottom:12,
    borderWidth:1,
    borderColor:'#e5e7eb',
  },
  ratingHeader:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
  },
  clientRow:{
    flexDirection:'row',
    alignItems:'center',
    flex:1,
    marginRight:12,
  },
  clientAvatar:{
    width:34,
    height:34,
    borderRadius:17,
    marginRight:10,
  },
  clientInfo:{
    flex:1,
  },
  clientName:{
    color:'#374151',
    fontWeight:'600',
  },
  ratingMeta:{
    color:'#9ca3af',
    fontSize:12,
    marginTop:2,
  },
  ratingValueBox:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#fef3c7',
    borderRadius:10,
    paddingHorizontal:10,
    paddingVertical:4,
  },
  ratingValueText:{
    marginLeft:6,
    fontWeight:'700',
    color:'#d97706',
  },
  ratingComment:{
    marginTop:10,
    color:'#4b5563',
    lineHeight:20,
  },
  ratingAttachments:{
    marginTop:8,
    color:'#6b7280',
    fontSize:12,
  },
  attachmentsButton:{
    alignSelf:'flex-start',
    marginTop:10,
    backgroundColor:'#eef2ff',
    borderRadius:10,
    paddingHorizontal:12,
    paddingVertical:8,
  },
  attachmentsButtonText:{
    color:'#4f46e5',
    fontWeight:'700',
  },
  attachmentsOverlayInModal:{
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    justifyContent:'center',
    padding:20,
    zIndex:50,
  },
  attachmentsBackdrop:{
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    backgroundColor:'rgba(0,0,0,0.45)',
  },
  attachmentsModalContent:{
    backgroundColor:'white',
    borderRadius:16,
    padding:16,
    maxHeight:'80%',
  },
  attachmentsModalHeader:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    marginBottom:12,
  },
  attachmentsModalTitle:{
    fontSize:18,
    fontWeight:'700',
    color:'#374151',
    flex:1,
    marginRight:12,
  },
  attachmentsModalClose:{
    padding:8,
  },
  attachmentRow:{
    backgroundColor:'#f9fafb',
    borderRadius:12,
    padding:12,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    marginBottom:10,
  },
  attachmentRowLeft:{
    flexDirection:'row',
    alignItems:'center',
    flex:1,
    marginRight:10,
  },
  attachmentRowInfo:{
    flex:1,
    marginLeft:8,
  },
  attachmentRowName:{
    color:'#374151',
    fontWeight:'700',
  },
  attachmentRowMeta:{
    color:'#6b7280',
    fontSize:12,
    marginTop:2,
  },
  previewBox:{
    backgroundColor:'#111827',
    borderRadius:12,
    padding:12,
    marginBottom:12,
  },
  previewImage:{
    width:'100%',
    height:240,
    borderRadius:10,
    resizeMode:'contain',
    backgroundColor:'#111827',
  },
  previewClose:{
    marginTop:10,
    backgroundColor:'#4f46e5',
    borderRadius:10,
    paddingVertical:10,
  },
  previewCloseText:{
    color:'white',
    fontWeight:'700',
    textAlign:'center',
  },
  noRatingsText:{
    color:'#6b7280',
    textAlign:'center',
    paddingVertical:12,
  },
  servicesSection: {
    marginBottom: 16,
  },
  servicesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  serviceCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
  },
  serviceImagesRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  serviceImageWrap: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  serviceImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  videoPlaceholder: {
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    padding: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceCategoryTag: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  serviceCategoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338ca',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
  },
  selectedIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  noServicesBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noServicesText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  serviceImagePreviewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  serviceImagePreviewBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  serviceImagePreviewContainer: {
    width: '90%',
    height: '60%',
  },
  serviceImagePreviewFull: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  serviceImagePreviewClose: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 8,
  },
});