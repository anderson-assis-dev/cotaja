import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator, Linking, Alert, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { OrderCardSkeleton, SkeletonBlock } from '../../components/Skeleton';
import { providerService, ratingService, serviceService, Service } from '../../services/api';
import { getAttachmentName, getAttachmentUrl } from '../../utils/attachmentHelpers';
import { SERVICE_CATEGORIES, filterCategories } from '../../utils/serviceCategories';
import { useToast } from '../../contexts/ToastContext';
import { ImageViewer } from '../../components/ImageViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const defaultCompanyImage = require('../../../assets/logo.png');
type Company = { id: string; name: string; category: string; rating: number; ratingsCount: number; description: string; phone: string; image: any; serviceCategories?: string[]; completedServices?: number; _raw?: any; };
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
  <TouchableOpacity onPress={onPress} style={styles.companyCard} activeOpacity={0.85}>
    <View style={styles.companyCardInner}>
      <Image source={company.image} style={styles.companyAvatar} />
      <View style={styles.companyCardBody}>
        <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
        <View style={styles.companyBadgesRow}>
          <View style={styles.companyStatusBadge}>
            <Icon name="star" size={14} color="#f59e0b" />
            <Text style={styles.companyStatusText}>{Number(company.rating || 0).toFixed(1)} ({company.ratingsCount || 0})</Text>
          </View>
          <View style={styles.companyCategoryBadge}>
            <Text style={styles.companyCategoryText}>{company.category}</Text>
          </View>
        </View>
        {company.description ? (
          <View style={styles.companyLocationRow}>
            <Icon name="place" size={14} color="#6b7280" />
            <Text style={styles.companyLocationText} numberOfLines={1}>{company.description}</Text>
          </View>
        ) : null}
        <View style={styles.companyServicesRow}>
          <Icon name="work-outline" size={14} color="#4f46e5" />
          <Text style={styles.companyServicesText}>{company.completedServices || 0} serviço(s) prestado(s)</Text>
        </View>
      </View>
    </View>
    <View style={styles.companyCardFooter}>
      <Text style={styles.companyCardAction}>Ver Detalhes</Text>
      <Icon name="chevron-right" size={16} color="#4f46e5" />
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
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const detailCarouselRef = useRef<FlatList>(null);
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
          completedServices: Number((provider as any)?.completed_services ?? 0),
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
    providerService.recordProfileView(Number(company.id)).catch(() => {});
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
    setProviderServices([]);
    setSelectedServiceId(null);
    setServiceImagePreview(null);
    setDetailService(null);
    setShowImageViewer(false);
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
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={[styles.headerSection, { paddingTop: insets.top + 14 }]}>
          <Text style={styles.headerTitle}>Encontrar Empresas</Text>
          <Text style={styles.headerSubtitle}>Busque prestadores e serviços</Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#9ca3af" />
            <TextInput placeholder="Buscar por nome ou categoria..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9ca3af" />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categorias</Text>
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
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {detailService ? (() => {
            const images = (Array.isArray(detailService.images) ? detailService.images : []).map((img: string) => {
              if (img.startsWith('data:') || img.startsWith('http')) return img;
              return `data:image/jpeg;base64,${img}`;
            });
            return (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setDetailService(null)} style={styles.modalHeaderBackBtn}>
                    <Icon name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle} numberOfLines={1}>Detalhes do Serviço</Text>
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Icon name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  {images.length > 0 ? (
                    <View>
                      <FlatList
                        ref={detailCarouselRef}
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => `ci-${i}`}
                        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                          setDetailImageIndex(idx);
                        }}
                        scrollEventThrottle={16}
                        renderItem={({ item, index }) => (
                          <TouchableOpacity activeOpacity={0.9} onPress={() => { setDetailImageIndex(index); setShowImageViewer(true); }}>
                            <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height: 280 }} resizeMode="cover" />
                          </TouchableOpacity>
                        )}
                      />
                      {images.length > 1 && (
                        <View style={styles.imageCountBadge}>
                          <Icon name="photo-library" size={14} color="#fff" />
                          <Text style={styles.imageCountText}>{images.length}</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.zoomBtn} onPress={() => setShowImageViewer(true)}>
                        <Icon name="zoom-in" size={22} color="#fff" />
                      </TouchableOpacity>
                      {images.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailStrip} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                          {images.map((img: string, i: number) => (
                            <TouchableOpacity
                              key={`th-${i}`}
                              onPress={() => { detailCarouselRef.current?.scrollToIndex({ index: i, animated: true }); setDetailImageIndex(i); }}
                              style={[styles.thumbnail, detailImageIndex === i && styles.thumbnailActive]}
                            >
                              <Image source={{ uri: img }} style={styles.thumbnailImage} />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  ) : (
                    <View style={styles.noImageBanner}>
                      <Icon name="image" size={40} color="#d1d5db" />
                      <Text style={{ color: '#9ca3af', marginTop: 8 }}>Sem imagens</Text>
                    </View>
                  )}

                  <View style={styles.detailBody}>
                    <Text style={styles.detailTitle}>{detailService.title}</Text>
                    <View style={styles.detailBadgesRow}>
                      <View style={styles.detailCatBadge}>
                        <Text style={styles.detailCatText}>{detailService.category}</Text>
                      </View>
                      <View style={styles.detailPriceBadge}>
                        <Text style={styles.detailPriceText}>
                          {Number(detailService.price) > 0
                            ? `R$ ${Number(detailService.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'A combinar'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailDescSection}>
                      <Text style={styles.detailDescLabel}>Descrição do Serviço</Text>
                      <Text style={styles.detailDescText}>{detailService.description}</Text>
                    </View>
                  </View>
                </ScrollView>
                <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 12 }]}>
                  <TouchableOpacity
                    style={[styles.quoteButton]}
                    onPress={() => { setSelectedServiceId(detailService.id); handleRequestQuote(); }}
                    disabled={requestingQuote}
                  >
                    {requestingQuote ? (
                      <View style={styles.quoteLoadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.actionButtonText}>Enviando...</Text>
                      </View>
                    ) : (
                      <View style={styles.quoteLoadingRow}>
                        <Icon name="chat" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Solicitar Orçamento</Text>
                        <Icon name="chevron-right" size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <ImageViewer
                  visible={showImageViewer}
                  images={images}
                  initialIndex={detailImageIndex}
                  onClose={() => setShowImageViewer(false)}
                />
              </>
            );
          })() : selectedCompany ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedCompany.name}</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.providerProfileCard}>
                  <Image source={selectedCompany.image} style={styles.providerAvatar} />
                  <Text style={styles.providerName}>{selectedCompany.name}</Text>
                  <View style={styles.providerRatingRow}>
                    <Icon name="star" size={18} color="#f59e0b" />
                    <Text style={styles.providerRatingText}>{Number(selectedCompany.rating || 0).toFixed(1)} ({selectedCompany.ratingsCount || 0} avaliações)</Text>
                  </View>
                  {selectedCompany.serviceCategories && selectedCompany.serviceCategories.length > 0 && (
                    <View style={styles.providerCatsBadges}>
                      {selectedCompany.serviceCategories.map((cat, idx) => (
                        <View key={`pc-${idx}`} style={styles.providerCatBadge}>
                          <Text style={styles.providerCatBadgeText}>{cat}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {selectedCompany.description ? (
                    <View style={styles.providerLocationRow}>
                      <Icon name="place" size={16} color="#6b7280" />
                      <Text style={styles.providerLocationText}>{selectedCompany.description}</Text>
                    </View>
                  ) : null}
                  <View style={styles.providerStatsRow}>
                    <View style={styles.providerStatItem}>
                      <Text style={styles.providerStatValue}>{selectedCompany.completedServices || 0}</Text>
                      <Text style={styles.providerStatLabel}>Serviços prestados</Text>
                    </View>
                    <View style={styles.providerStatDivider} />
                    <View style={styles.providerStatItem}>
                      <Text style={styles.providerStatValue}>{selectedCompany.ratingsCount || 0}</Text>
                      <Text style={styles.providerStatLabel}>Avaliações</Text>
                    </View>
                    <View style={styles.providerStatDivider} />
                    <View style={styles.providerStatItem}>
                      <Text style={styles.providerStatValue}>{Number(selectedCompany.rating || 0).toFixed(1)}</Text>
                      <Text style={styles.providerStatLabel}>Nota média</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailBody}>
                  <Text style={styles.servicesSectionTitle}>Serviços Oferecidos</Text>
                  {loadingServices ? (
                    <View style={{ gap: 12 }}>
                      <SkeletonBlock width="100%" height={120} borderRadius={12} />
                      <SkeletonBlock width="100%" height={120} borderRadius={12} />
                    </View>
                  ) : providerServices.length > 0 ? (
                    providerServices.map(svc => {
                      const images = Array.isArray(svc.images) ? svc.images : [];
                      const firstImage = images.length > 0 ? (images[0].startsWith('data:') || images[0].startsWith('http') ? images[0] : `data:image/jpeg;base64,${images[0]}`) : null;
                      return (
                        <TouchableOpacity
                          key={svc.id}
                          style={styles.serviceListCard}
                          onPress={() => { setDetailService(svc); setDetailImageIndex(0); }}
                          activeOpacity={0.85}
                        >
                          <View style={styles.serviceListInner}>
                            {firstImage && (
                              <Image source={{ uri: firstImage }} style={styles.serviceListThumb} />
                            )}
                            <View style={styles.serviceListInfo}>
                              <Text style={styles.serviceListTitle} numberOfLines={1}>{svc.title}</Text>
                              <Text style={styles.serviceListDesc} numberOfLines={2}>{svc.description}</Text>
                              <View style={styles.serviceListMeta}>
                                <View style={styles.serviceCategoryTag}>
                                  <Text style={styles.serviceCategoryTagText}>{svc.category}</Text>
                                </View>
                                <Text style={styles.serviceListPrice}>
                                  {Number(svc.price) > 0
                                    ? `R$ ${Number(svc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : 'A combinar'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.serviceListFooter}>
                            <Icon name="visibility" size={14} color="#4f46e5" />
                            <Text style={styles.serviceListAction}>Ver Detalhes</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.noServicesBox}>
                      <Icon name="inventory-2" size={32} color="#d1d5db" />
                      <Text style={styles.noServicesText}>Nenhum serviço cadastrado.</Text>
                    </View>
                  )}

                  <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>Contato</Text>
                    <Text style={styles.contactPhone}>{selectedCompany.phone}</Text>
                  </View>
                  <View style={styles.ratingsSection}>
                    <Text style={styles.ratingsTitle}>Avaliações</Text>
                    {renderRatings()}
                  </View>
                </View>
              </ScrollView>
            </>
          ) : null}

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

      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 14,
  },
  content: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    paddingBottom: 32,
    minHeight: 500,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
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
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  companyCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  companyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  companyCardBody: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  companyBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  companyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  companyStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  companyCategoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  companyCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338ca',
  },
  companyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  companyLocationText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  companyServicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyServicesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  companyCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  companyCardAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
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

  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#79a6ff',
    backgroundColor: '#4f46e5',
  },
  modalHeaderBackBtn: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    color: 'white',
  },
  detailScroll: {
    flex: 1,
  },

  imageCountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  thumbnailStrip: {
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#4f46e5',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noImageBanner: {
    height: 180,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailBody: {
    padding: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  detailBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailCatBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  detailCatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  detailPriceBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  detailPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  detailDescSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailDescLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  detailDescText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  detailFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },

  providerProfileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  providerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#e0e7ff',
    marginBottom: 12,
  },
  providerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  providerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  providerRatingText: {
    fontWeight: '700',
    color: '#d97706',
    fontSize: 14,
  },
  providerCatsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  providerCatBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  providerCatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  providerLocationText: {
    fontSize: 13,
    color: '#6b7280',
  },
  providerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  providerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  providerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4f46e5',
  },
  providerStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  providerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },

  servicesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  serviceListCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
  },
  serviceListInner: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  serviceListThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  serviceListInfo: {
    flex: 1,
  },
  serviceListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceListDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
    marginBottom: 6,
  },
  serviceListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceListPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  serviceListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  serviceListAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
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

  contactCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  contactPhone: {
    color: '#6b7280',
    fontSize: 14,
  },
  quoteButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
  },
  quoteButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  quoteLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },

  ratingsSection: {
    marginTop: 8,
  },
  ratingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ratingsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
  },
  ratingsLoadingText: {
    marginLeft: 10,
    color: '#6b7280',
  },
  ratingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  clientAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#374151',
    fontWeight: '600',
  },
  ratingMeta: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  ratingValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingValueText: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#d97706',
  },
  ratingComment: {
    marginTop: 10,
    color: '#4b5563',
    lineHeight: 20,
  },
  attachmentsButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachmentsButtonText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  attachmentsOverlayInModal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  attachmentsBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  attachmentsModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  attachmentsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attachmentsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  attachmentsModalClose: {
    padding: 8,
  },
  attachmentRow: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  attachmentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  attachmentRowInfo: {
    flex: 1,
    marginLeft: 8,
  },
  attachmentRowName: {
    color: '#374151',
    fontWeight: '700',
  },
  attachmentRowMeta: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    resizeMode: 'contain',
    backgroundColor: '#111827',
  },
  previewClose: {
    marginTop: 10,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 10,
  },
  previewCloseText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  noRatingsText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
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