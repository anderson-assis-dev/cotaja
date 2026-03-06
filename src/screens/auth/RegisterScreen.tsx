import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { TextInputMask } from 'react-native-masked-text';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { SERVICE_CATEGORIES, filterCategories } from '../../utils/serviceCategories';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll: handleStatusBarScroll } = useStatusBarOverlay({ threshold: 60 });
  const [registering, setRegistering] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('location_enabled_pref').then((v) => setLocationEnabled(v === 'true'));
  }, []);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [phone, setPhone] = useState('');
  const [profileType, setProfileType] = useState<'client' | 'provider' | ''>('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const [motherName, setMotherName] = useState('');

  const capitalizeWords = (text: string) =>
    text.replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());

  const maskCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };
  const [birthDate, setBirthDate] = useState('');
  const [cpf, setCpf] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  const [cep, setCep] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressLatitude, setAddressLatitude] = useState<number | null>(null);
  const [addressLongitude, setAddressLongitude] = useState<number | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const nomeInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<any>(null);
  const senhaInputRef = useRef<TextInput>(null);
  const confirmarSenhaInputRef = useRef<TextInput>(null);
  const motherNameInputRef = useRef<TextInput>(null);
  const birthDateInputRef = useRef<any>(null);
  const cpfInputRef = useRef<any>(null);
  const cepInputRef = useRef<any>(null);
  const streetInputRef = useRef<TextInput>(null);
  const neighborhoodInputRef = useRef<TextInput>(null);
  const cityInputRef = useRef<TextInput>(null);
  const stateInputRef = useRef<TextInput>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const parseBirthDate = (masked: string): string => {
    const parts = masked.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const fetchAddressByCep = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        showError('CEP não encontrado');
        return;
      }
      setAddressStreet(data.logradouro || '');
      setAddressNeighborhood(data.bairro || '');
      setAddressCity(data.localidade || '');
      setAddressState(data.uf || '');
    } catch {
      showError('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const getLocationByGPS = () => {
    setLoadingLocation(true);
    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddressLatitude(latitude);
        setAddressLongitude(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'CotajaApp/1.0' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          setAddressStreet(addr.road || addr.pedestrian || '');
          setAddressNeighborhood(addr.suburb || addr.neighbourhood || addr.quarter || '');
          setAddressCity(addr.city || addr.town || addr.village || '');
          setAddressState((addr.state_code || addr.state || '').slice(0, 2).toUpperCase());
          if (addr.postcode) {
            const digits = addr.postcode.replace(/\D/g, '');
            setCep(digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
          }
        } catch {
          showError('Localização obtida, mas não foi possível buscar o endereço.');
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setLoadingLocation(false);
        showError('Ative a localização nas configurações do dispositivo.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha || !phone || !profileType) {
      showError('Por favor, preencha todos os campos e selecione o tipo de perfil');
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, '');
    if (!cpfDigits || (cpfDigits.length !== 11 && cpfDigits.length !== 14)) {
      showError('CPF ou CNPJ inválido');
      return;
    }

    if (senha !== confirmarSenha) {
      showError('As senhas não coincidem');
      return;
    }

    if (profileType === 'provider') {
      if (!motherName) {
        showError('Nome da mãe é obrigatório para prestadores');
        return;
      }
      if (!birthDate || birthDate.length < 10) {
        showError('Data de nascimento é obrigatória para prestadores');
        return;
      }
      if (selectedCategories.length === 0) {
        showError('Selecione pelo menos uma categoria de serviço');
        return;
      }
      if (!addressCity) {
        showError('Informe seu endereço para receber serviços próximos');
        return;
      }
    }

    if (senha.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setRegistering(true);
    try {
      const fullAddress = profileType === 'provider' && addressStreet
        ? `${addressStreet}, ${addressNeighborhood}, ${addressCity} - ${addressState}`
        : undefined;
      await register(
        nome, email, phone, senha, confirmarSenha,
        profileType as 'client' | 'provider',
        cpf.replace(/\D/g, ''),
        profileType === 'provider' ? motherName : undefined,
        profileType === 'provider' ? parseBirthDate(birthDate) : undefined,
        profileType === 'provider' ? selectedCategories : undefined,
        profileType === 'provider' ? fullAddress : undefined,
        profileType === 'provider' ? cep.replace(/\D/g, '') : undefined,
        profileType === 'provider' ? (addressLatitude ?? undefined) : undefined,
        profileType === 'provider' ? (addressLongitude ?? undefined) : undefined,
      );
      showSuccess('Cadastro realizado! Verifique seu email para ativar sua conta.', 5000);
      navigation.navigate('Login');
    } catch (error: any) {
      showError(error.message || 'Erro ao realizar cadastro');
    } finally {
      setRegistering(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent,{paddingBottom:insets.bottom+24}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleStatusBarScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.outer}>
          <View style={[styles.header,{paddingTop:insets.top}]}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.content}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Criar conta</Text>
              <Text style={styles.headerSubtitle}>É rápido e leva menos de 1 minuto</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Nome completo</Text>
              <View style={styles.inputRow}>
                <Icon name="person-outline" size={20} color="#6b7280" />
                <TextInput ref={nomeInputRef} style={styles.input} placeholder="Digite seu nome completo" placeholderTextColor="#9ca3af" value={nome} onChangeText={(t) => setNome(capitalizeWords(t))} autoCapitalize="words" editable={!registering} returnKeyType="next" onSubmitEditing={() => emailInputRef.current?.focus()} />
              </View>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Icon name="mail-outline" size={20} color="#6b7280" />
                <TextInput ref={emailInputRef} style={styles.input} placeholder="Digite seu email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!registering} returnKeyType="next" onSubmitEditing={() => phoneInputRef.current?.getElement()?.focus()} />
              </View>
              <Text style={styles.label}>Tipo de perfil</Text>
              <View style={styles.profileSelection}>
                <TouchableOpacity style={[styles.profileOption,profileType==='client'&&styles.profileOptionSelected]} onPress={() => setProfileType('client')} disabled={registering}>
                  <View style={styles.profileOptionContent}>
                    <Icon name="person" size={22} color={profileType==='client'?'#4f46e5':'#6b7280'} />
                    <Text style={[styles.profileOptionText,profileType==='client'&&styles.profileOptionTextSelected]}>Cliente</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.profileOption,profileType==='provider'&&styles.profileOptionSelected]} onPress={() => setProfileType('provider')} disabled={registering}>
                  <View style={styles.profileOptionContent}>
                    <Icon name="work" size={22} color={profileType==='provider'?'#4f46e5':'#6b7280'} />
                    <Text style={[styles.profileOptionText,profileType==='provider'&&styles.profileOptionTextSelected]}>Prestador</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {profileType !== '' && (
                <>
                  <Text style={styles.label}>CPF / CNPJ</Text>
                  <View style={styles.inputRow}>
                    <Icon name="badge" size={20} color="#6b7280" />
                    <TextInput
                      ref={cpfInputRef}
                      value={cpf}
                      onChangeText={(t) => setCpf(maskCpfCnpj(t))}
                      placeholder="000.000.000-00"
                      placeholderTextColor="#9ca3af"
                      style={styles.input}
                      keyboardType="numeric"
                      maxLength={18}
                      editable={!registering}
                      returnKeyType="next"
                      onSubmitEditing={() => phoneInputRef.current?.getElement()?.focus()}
                    />
                  </View>
                </>
              )}
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputRow}>
                <Icon name="phone" size={20} color="#6b7280" />
                <TextInputMask ref={phoneInputRef} type={'cel-phone'} options={{maskType:'BRL',withDDD:true,dddMask:'(99) '}} value={phone} onChangeText={setPhone} placeholder="(99) 99999-9999" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="phone-pad" editable={!registering} returnKeyType="next" onSubmitEditing={() => senhaInputRef.current?.focus()} />
              </View>
              {profileType === 'provider' && (
                <>
                  <Text style={styles.providerSectionLabel}>Informações do Prestador</Text>
                  <Text style={styles.label}>Nome da mãe</Text>
                  <View style={styles.inputRow}>
                    <Icon name="person-outline" size={20} color="#6b7280" />
                    <TextInput ref={motherNameInputRef} style={styles.input} placeholder="Nome completo da sua mãe" placeholderTextColor="#9ca3af" value={motherName} onChangeText={(t) => setMotherName(capitalizeWords(t))} autoCapitalize="words" editable={!registering} returnKeyType="next" onSubmitEditing={() => birthDateInputRef.current?.getElement()?.focus()} />
                  </View>
                  <Text style={styles.label}>Data de nascimento</Text>
                  <View style={styles.inputRow}>
                    <Icon name="event" size={20} color="#6b7280" />
                    <TextInputMask ref={birthDateInputRef} type={'datetime'} options={{format:'DD/MM/YYYY'}} value={birthDate} onChangeText={setBirthDate} placeholder="DD/MM/AAAA" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="numeric" editable={!registering} returnKeyType="next" onSubmitEditing={() => senhaInputRef.current?.focus()} />
                  </View>
                  <Text style={styles.label}>Categorias de serviço</Text>
                  {selectedCategories.length > 0 && (
                    <View style={styles.categoriesContainer}>
                      {selectedCategories.map(cat => (
                        <TouchableOpacity key={cat} style={[styles.categoryBadge, styles.categoryBadgeSelected]} onPress={() => toggleCategory(cat)} disabled={registering}>
                          <Text style={[styles.categoryBadgeText, styles.categoryBadgeTextSelected]}>{cat} ✕</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={styles.inputRow}>
                    <Icon name="search" size={20} color="#6b7280" />
                    <TextInput style={styles.input} placeholder="Digite para buscar categorias..." placeholderTextColor="#9ca3af" value={categorySearch} onChangeText={setCategorySearch} editable={!registering} />
                  </View>
                  <View style={styles.categoriesContainer}>
                    {filterCategories(categorySearch).filter(c => !selectedCategories.includes(c.name)).slice(0, categorySearch ? 50 : 12).map(cat => (
                      <TouchableOpacity key={cat.id} style={styles.categoryBadge} onPress={() => { toggleCategory(cat.name); setCategorySearch(''); }} disabled={registering}>
                        <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {!categorySearch && SERVICE_CATEGORIES.length > 12 && (
                      <Text style={styles.categoryHint}>Digite para ver mais categorias...</Text>
                    )}
                  </View>
                  <Text style={styles.providerSectionLabel}>Localização</Text>
                  <TouchableOpacity
                    style={[styles.locationButton, (!locationEnabled || loadingLocation) && styles.locationButtonDisabled]}
                    onPress={locationEnabled ? getLocationByGPS : () => showError('Ative a permissão de localização no perfil do app para usar este recurso.')}
                    disabled={registering || loadingLocation}
                    activeOpacity={0.8}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator color="#4f46e5" size="small" />
                    ) : (
                      <Icon name={locationEnabled ? 'my-location' : 'location-off'} size={20} color={locationEnabled ? '#4f46e5' : '#9ca3af'} />
                    )}
                    <Text style={[styles.locationButtonText, !locationEnabled && { color: '#9ca3af' }]}>
                      {loadingLocation ? 'Buscando localização...' : locationEnabled ? 'Usar minha localização atual' : 'Localização desativada no perfil'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.locationOrText}>ou informe o CEP manualmente</Text>
                  <Text style={styles.label}>CEP</Text>
                  <View style={styles.inputRow}>
                    <Icon name="location-on" size={20} color="#6b7280" />
                    <TextInputMask
                      ref={cepInputRef}
                      type={'custom'}
                      options={{ mask: '99999-999' }}
                      value={cep}
                      onChangeText={(v) => {
                        setCep(v);
                        fetchAddressByCep(v);
                      }}
                      placeholder="00000-000"
                      placeholderTextColor="#9ca3af"
                      style={styles.input}
                      keyboardType="numeric"
                      editable={!registering}
                      returnKeyType="next"
                      onSubmitEditing={() => streetInputRef.current?.focus()}
                    />
                    {loadingCep && <ActivityIndicator color="#4f46e5" size="small" />}
                  </View>
                  <Text style={styles.label}>Rua / Logradouro</Text>
                  <View style={styles.inputRow}>
                    <Icon name="home" size={20} color="#6b7280" />
                    <TextInput ref={streetInputRef} style={styles.input} placeholder="Rua, número, complemento" placeholderTextColor="#9ca3af" value={addressStreet} onChangeText={setAddressStreet} editable={!registering} returnKeyType="next" onSubmitEditing={() => neighborhoodInputRef.current?.focus()} />
                  </View>
                  <Text style={styles.label}>Bairro</Text>
                  <View style={styles.inputRow}>
                    <Icon name="map" size={20} color="#6b7280" />
                    <TextInput ref={neighborhoodInputRef} style={styles.input} placeholder="Bairro" placeholderTextColor="#9ca3af" value={addressNeighborhood} onChangeText={setAddressNeighborhood} editable={!registering} returnKeyType="next" onSubmitEditing={() => cityInputRef.current?.focus()} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 3 }}>
                      <Text style={styles.label}>Cidade</Text>
                      <View style={[styles.inputRow, { marginBottom: 14 }]}>
                        <TextInput ref={cityInputRef} style={styles.input} placeholder="Cidade" placeholderTextColor="#9ca3af" value={addressCity} onChangeText={setAddressCity} editable={!registering} returnKeyType="next" onSubmitEditing={() => stateInputRef.current?.focus()} />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>UF</Text>
                      <View style={[styles.inputRow, { marginBottom: 14 }]}>
                        <TextInput ref={stateInputRef} style={styles.input} placeholder="UF" placeholderTextColor="#9ca3af" value={addressState} onChangeText={setAddressState} maxLength={2} autoCapitalize="characters" editable={!registering} returnKeyType="next" onSubmitEditing={() => senhaInputRef.current?.focus()} />
                      </View>
                    </View>
                  </View>
                </>
              )}
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <Icon name="lock-outline" size={20} color="#6b7280" />
                <TextInput ref={senhaInputRef} style={styles.input} placeholder="Digite sua senha" placeholderTextColor="#9ca3af" value={senha} onChangeText={setSenha} secureTextEntry={!showSenha} editable={!registering} returnKeyType="next" onSubmitEditing={() => confirmarSenhaInputRef.current?.focus()} />
                <TouchableOpacity onPress={() => setShowSenha(v => !v)} style={styles.eyeButton} disabled={registering}>
                  <Icon name={showSenha ? 'visibility' : 'visibility-off'} size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Confirmar senha</Text>
              <View style={styles.inputRow}>
                <Icon name="lock-outline" size={20} color="#6b7280" />
                <TextInput ref={confirmarSenhaInputRef} style={styles.input} placeholder="Confirme sua senha" placeholderTextColor="#9ca3af" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry={!showConfirmarSenha} editable={!registering} returnKeyType="done" onSubmitEditing={handleRegister} />
                <TouchableOpacity onPress={() => setShowConfirmarSenha(v => !v)} style={styles.eyeButton} disabled={registering}>
                  <Icon name={showConfirmarSenha ? 'visibility' : 'visibility-off'} size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.primaryButton,registering&&styles.primaryButtonDisabled]} onPress={handleRegister} disabled={registering}>
                {registering?(
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.primaryButtonText}>Cadastrando...</Text>
                  </View>
                ):(
                  <Text style={styles.primaryButtonText}>Cadastrar</Text>
                )}
              </TouchableOpacity>
              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginText}>Já tem uma conta? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()} disabled={registering}>
                  <Text style={styles.loginLink}>Faça login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
    </ScrollView>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerBackground: {
    position: 'absolute',
    top: '-50%',
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  scroll:{
    flex:1,
  },
  scrollContent:{
    flexGrow:1,
  },
  logo: {
    width: 270,
    height: 94,
    tintColor:'#ffffff',
    left: 15,
    marginBottom: -15,
  },
  outer:{
    flex:1,
  },
  header:{
    paddingHorizontal:24,
    paddingBottom:26,
    alignItems:'center',
  },
  headerContent: {
    alignItems:'flex-start',
    marginBottom:24,
  },
  headerTitle:{
    fontSize:24,
    fontWeight:'900',
    color:'#000000',
    marginTop:10,
    letterSpacing:-0.5,
    textAlign:'justify',
    width:'100%',
  },
  headerSubtitle:{
    color:'rgba(0,0,0,0.85)',
    fontSize:14,
    marginTop:4,
    textAlign:'justify',
    width:'100%',
  },
  content:{
    flex:1,
    backgroundColor:'#f3f4f6',
    borderTopLeftRadius:24,
    borderTopRightRadius:24,
    padding:20,
  },
  card:{
    backgroundColor:'#ffffff',
    borderRadius:16,
    padding:18,
    shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.08,
    shadowRadius:6,
    elevation:3,
  },
  label: {
    fontSize:14,
    fontWeight:'700',
    color:'#374151',
    marginBottom:8,
  },
  inputRow:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#ffffff',
    borderWidth:1,
    borderColor:'#e5e7eb',
    borderRadius:12,
    paddingHorizontal:12,
    paddingVertical:10,
    marginBottom:14,
  },
  input:{
    flex:1,
    marginLeft:10,
    fontSize:16,
    color:'#111827',
    paddingVertical:0,
  },
  eyeButton: {
    paddingLeft:10,
  },
  primaryButton:{
    borderRadius:12,
    paddingVertical:14,
    backgroundColor:'#4f46e5',
  },
  primaryButtonDisabled:{
    backgroundColor:'#9ca3af',
  },
  primaryButtonText:{
    textAlign:'center',
    color:'#ffffff',
    fontWeight:'800',
    fontSize:16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop:16,
  },
  loginText: {
    color: '#6b7280',
  },
  loginLink: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  profileSelection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  profileOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor:'#ffffff',
  },
  profileOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor:'#eef2ff',
  },
  profileOptionContent: {
    alignItems: 'center',
    gap: 8,
  },
  profileOptionText: {
    fontSize: 14,
    fontWeight: '800',
    color:'#6b7280',
  },
  profileOptionTextSelected: {
    color: '#4f46e5',
  },
  providerSectionLabel: {
    fontSize:13,
    fontWeight:'700',
    color:'#4f46e5',
    marginTop:8,
    marginBottom:12,
    textTransform:'uppercase',
    letterSpacing:0.5,
  },
  categoriesContainer: {
    flexDirection:'row',
    flexWrap:'wrap',
    gap:8,
    marginBottom:16,
  },
  categoryBadge: {
    borderWidth:1.5,
    borderColor:'#d1d5db',
    borderRadius:20,
    paddingHorizontal:14,
    paddingVertical:7,
    backgroundColor:'#ffffff',
  },
  categoryBadgeSelected: {
    borderColor:'#4f46e5',
    backgroundColor:'#eef2ff',
  },
  categoryBadgeText: {
    fontSize:13,
    fontWeight:'600',
    color:'#6b7280',
  },
  categoryBadgeTextSelected: {
    color:'#4f46e5',
  },
  categoryHint: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
    width: '100%',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 8,
    backgroundColor: '#eef2ff',
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  locationOrText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 12,
  },
});