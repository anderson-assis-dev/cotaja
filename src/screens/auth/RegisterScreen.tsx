import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import LivenessScreen, { LivenessResultData } from './LivenessScreen';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { TextInputMask } from 'react-native-masked-text';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { SERVICE_CATEGORIES, filterCategories } from '../../utils/serviceCategories';
import { requestLocationPermission } from '../../utils/permissions';
import { facebookEvents } from '../../services/facebookEventsService';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll: handleStatusBarScroll } = useStatusBarOverlay({ threshold: 60 });
  const [registering, setRegistering] = useState(false);
  const [showLiveness, setShowLiveness] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [phone, setPhone] = useState('');
  const [profileType, setProfileType] = useState<'client' | 'provider'>('client');
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
      if (data.erro) { showError('CEP não encontrado'); return; }
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

  const getLocationByGPS = async () => {
    const granted = await requestLocationPermission('address');
    if (!granted) {
      showError('Ative a localização nas configurações do dispositivo.');
      return;
    }
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
      if (!motherName) { showError('Nome da mãe é obrigatório para prestadores'); return; }
      if (!birthDate || birthDate.length < 10) { showError('Data de nascimento é obrigatória para prestadores'); return; }
      if (selectedCategories.length === 0) { showError('Selecione pelo menos uma categoria de serviço'); return; }
      if (!addressCity) { showError('Informe seu endereço para receber serviços próximos'); return; }
    }
    if (senha.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    // O cadastro só é concluído após a verificação de liveness (anti-robô).
    setShowLiveness(true);
  };

  // Executa o cadastro de fato (com ou sem dados de liveness).
  const submitRegistration = async (liveness?: { score: number; imageBase64: string | null }) => {
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
        liveness,
      );
      facebookEvents.logCompleteRegistration(profileType);
      showSuccess('Cadastro realizado! Verifique seu email para ativar sua conta.', 5000);
      navigation.navigate('Login');
    } catch (error: any) {
      showError(error.message || 'Erro ao realizar cadastro');
    } finally {
      setRegistering(false);
    }
  };

  // Chamado quando o liveness conclui com sucesso (ou o modelo não carrega).
  const handleLivenessComplete = async (result: LivenessResultData) => {
    setShowLiveness(false);

    if (result.loadFailed) {
      // Device sem suporte ao liveness: NÃO bloqueia o cadastro (a validação
      // será feita de outra forma depois). Conclui o cadastro sem liveness.
      console.error('[LivenessKit] loadFailed no cadastro:', result.errorMessage);
      if (__DEV__ && result.errorMessage) {
        showError(`Liveness (debug): ${result.errorMessage}`, 8000);
      }
      await submitRegistration(undefined);
      return;
    }
    if (!result.isLive) {
      showError('Não foi possível validar que você é uma pessoa real. Refaça o teste de liveness para concluir o cadastro.');
      return;
    }

    await submitRegistration({ score: result.confidence, imageBase64: result.imageBase64 });
  };

  const handleLivenessCancel = () => {
    setShowLiveness(false);
    showError('Verificação cancelada. Conclua o teste de liveness para finalizar o cadastro.');
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.bottomBackground} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleStatusBarScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.outer}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headerTagline}>Marketplace de Serviços</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>É rápido e leva menos de 1 minuto</Text>

            <Text style={styles.label}>Nome completo</Text>
            <View style={styles.inputRow}>
              <Icon name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                ref={nomeInputRef}
                style={styles.input}
                placeholder="Digite seu nome completo"
                placeholderTextColor="#9ca3af"
                value={nome}
                onChangeText={(t) => setNome(capitalizeWords(t))}
                autoCapitalize="words"
                editable={!registering}
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Icon name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Digite seu email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!registering}
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.getElement()?.focus()}
              />
            </View>

            <Text style={styles.label}>Tipo de perfil</Text>
            <View style={styles.profileSelection}>
              <TouchableOpacity
                style={[styles.profileOption, profileType === 'client' && styles.profileOptionSelected]}
                onPress={() => setProfileType('client')}
                disabled={registering}
              >
                <View style={styles.profileOptionContent}>
                  <Icon name="person" size={24} color={profileType === 'client' ? '#4f46e5' : '#9ca3af'} />
                  <Text style={[styles.profileOptionText, profileType === 'client' && styles.profileOptionTextSelected]}>Cliente</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileOption, profileType === 'provider' && styles.profileOptionSelected]}
                onPress={() => setProfileType('provider')}
                disabled={registering}
              >
                <View style={styles.profileOptionContent}>
                  <Icon name="work" size={24} color={profileType === 'provider' ? '#4f46e5' : '#9ca3af'} />
                  <Text style={[styles.profileOptionText, profileType === 'provider' && styles.profileOptionTextSelected]}>Prestador</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>CPF / CNPJ</Text>
            <View style={styles.inputRow}>
              <Icon name="badge" size={20} color="#9ca3af" />
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

            <Text style={styles.label}>Telefone</Text>
            <View style={styles.inputRow}>
              <Icon name="phone" size={20} color="#9ca3af" />
              <TextInputMask
                ref={phoneInputRef}
                type={'cel-phone'}
                options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
                value={phone}
                onChangeText={setPhone}
                placeholder="(99) 99999-9999"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                keyboardType="phone-pad"
                editable={!registering}
                returnKeyType="next"
                onSubmitEditing={() => senhaInputRef.current?.focus()}
              />
            </View>

            {profileType === 'provider' && (
              <>
                <Text style={styles.sectionLabel}>Informações do Prestador</Text>

                <Text style={styles.label}>Nome da mãe</Text>
                <View style={styles.inputRow}>
                  <Icon name="person-outline" size={20} color="#9ca3af" />
                  <TextInput
                    ref={motherNameInputRef}
                    style={styles.input}
                    placeholder="Nome completo da sua mãe"
                    placeholderTextColor="#9ca3af"
                    value={motherName}
                    onChangeText={(t) => setMotherName(capitalizeWords(t))}
                    autoCapitalize="words"
                    editable={!registering}
                    returnKeyType="next"
                    onSubmitEditing={() => birthDateInputRef.current?.getElement()?.focus()}
                  />
                </View>

                <Text style={styles.label}>Data de nascimento</Text>
                <View style={styles.inputRow}>
                  <Icon name="event" size={20} color="#9ca3af" />
                  <TextInputMask
                    ref={birthDateInputRef}
                    type={'datetime'}
                    options={{ format: 'DD/MM/YYYY' }}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    keyboardType="numeric"
                    editable={!registering}
                    returnKeyType="next"
                    onSubmitEditing={() => senhaInputRef.current?.focus()}
                  />
                </View>

                <Text style={styles.label}>Categorias de serviço</Text>
                {selectedCategories.length > 0 && (
                  <View style={styles.categoriesContainer}>
                    {selectedCategories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryBadge, styles.categoryBadgeSelected]}
                        onPress={() => toggleCategory(cat)}
                        disabled={registering}
                      >
                        <Text style={[styles.categoryBadgeText, styles.categoryBadgeTextSelected]}>{cat} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.inputRow}>
                  <Icon name="search" size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar categorias..."
                    placeholderTextColor="#9ca3af"
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                    editable={!registering}
                  />
                </View>
                <View style={styles.categoriesContainer}>
                  {filterCategories(categorySearch).filter(c => !selectedCategories.includes(c.name)).slice(0, categorySearch ? 50 : 12).map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.categoryBadge}
                      onPress={() => { toggleCategory(cat.name); setCategorySearch(''); }}
                      disabled={registering}
                    >
                      <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {!categorySearch && SERVICE_CATEGORIES.length > 12 && (
                    <Text style={styles.categoryHint}>Digite para ver mais categorias...</Text>
                  )}
                </View>

                <Text style={styles.sectionLabel}>Localização</Text>
                {/* O acesso à localização passa por getLocationByGPS →
                    requestLocationPermission, que mostra o aviso de uso
                    (Prominent Disclosure) ANTES de pedir a permissão. */}
                <TouchableOpacity
                  style={[styles.locationButton, loadingLocation && styles.locationButtonDisabled]}
                  onPress={getLocationByGPS}
                  disabled={registering || loadingLocation}
                  activeOpacity={0.8}
                >
                  {loadingLocation ? (
                    <ActivityIndicator color="#4f46e5" size="small" />
                  ) : (
                    <Icon name="my-location" size={20} color="#4f46e5" />
                  )}
                  <Text style={styles.locationButtonText}>
                    {loadingLocation ? 'Buscando localização...' : 'Usar minha localização atual'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.locationOrText}>ou informe o CEP manualmente</Text>

                <Text style={styles.label}>CEP</Text>
                <View style={styles.inputRow}>
                  <Icon name="location-on" size={20} color="#9ca3af" />
                  <TextInputMask
                    ref={cepInputRef}
                    type={'custom'}
                    options={{ mask: '99999-999' }}
                    value={cep}
                    onChangeText={(v) => { setCep(v); fetchAddressByCep(v); }}
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
                  <Icon name="home" size={20} color="#9ca3af" />
                  <TextInput
                    ref={streetInputRef}
                    style={styles.input}
                    placeholder="Rua, número, complemento"
                    placeholderTextColor="#9ca3af"
                    value={addressStreet}
                    onChangeText={setAddressStreet}
                    editable={!registering}
                    returnKeyType="next"
                    onSubmitEditing={() => neighborhoodInputRef.current?.focus()}
                  />
                </View>

                <Text style={styles.label}>Bairro</Text>
                <View style={styles.inputRow}>
                  <Icon name="map" size={20} color="#9ca3af" />
                  <TextInput
                    ref={neighborhoodInputRef}
                    style={styles.input}
                    placeholder="Bairro"
                    placeholderTextColor="#9ca3af"
                    value={addressNeighborhood}
                    onChangeText={setAddressNeighborhood}
                    editable={!registering}
                    returnKeyType="next"
                    onSubmitEditing={() => cityInputRef.current?.focus()}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.label}>Cidade</Text>
                    <View style={[styles.inputRow, { marginBottom: 16 }]}>
                      <TextInput
                        ref={cityInputRef}
                        style={styles.input}
                        placeholder="Cidade"
                        placeholderTextColor="#9ca3af"
                        value={addressCity}
                        onChangeText={setAddressCity}
                        editable={!registering}
                        returnKeyType="next"
                        onSubmitEditing={() => stateInputRef.current?.focus()}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>UF</Text>
                    <View style={[styles.inputRow, { marginBottom: 16 }]}>
                      <TextInput
                        ref={stateInputRef}
                        style={styles.input}
                        placeholder="UF"
                        placeholderTextColor="#9ca3af"
                        value={addressState}
                        onChangeText={setAddressState}
                        maxLength={2}
                        autoCapitalize="characters"
                        editable={!registering}
                        returnKeyType="next"
                        onSubmitEditing={() => senhaInputRef.current?.focus()}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputRow}>
              <Icon name="lock-outline" size={20} color="#9ca3af" />
              <TextInput
                ref={senhaInputRef}
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#9ca3af"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showSenha}
                editable={!registering}
                returnKeyType="next"
                onSubmitEditing={() => confirmarSenhaInputRef.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowSenha(v => !v)} style={styles.eyeButton} disabled={registering}>
                <Icon name={showSenha ? 'visibility' : 'visibility-off'} size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar senha</Text>
            <View style={styles.inputRow}>
              <Icon name="lock-outline" size={20} color="#9ca3af" />
              <TextInput
                ref={confirmarSenhaInputRef}
                style={styles.input}
                placeholder="Confirme sua senha"
                placeholderTextColor="#9ca3af"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!showConfirmarSenha}
                editable={!registering}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity onPress={() => setShowConfirmarSenha(v => !v)} style={styles.eyeButton} disabled={registering}>
                <Icon name={showConfirmarSenha ? 'visibility' : 'visibility-off'} size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, registering && styles.primaryButtonDisabled]}
              onPress={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.primaryButtonText}>Cadastrando...</Text>
                </View>
              ) : (
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
      </ScrollView>
      <StatusBarOverlay show={showStatusBarOverlay} opacity={statusBarOpacity} forceLight />

      <Modal visible={showLiveness} animationType="slide" onRequestClose={handleLivenessCancel}>
        <LivenessScreen
          onComplete={handleLivenessComplete}
          onCancel={handleLivenessCancel}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  outer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -70,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    left: -55,
  },
  circle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 24,
    left: 24,
  },
  logo: {
    width: 240,
    height: 80,
    tintColor: '#ffffff',
    marginBottom: 6,
  },
  headerTagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  eyeButton: {
    paddingLeft: 10,
  },
  profileSelection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  profileOption: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  profileOptionContent: {
    alignItems: 'center',
    gap: 8,
  },
  profileOptionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9ca3af',
  },
  profileOptionTextSelected: {
    color: '#4f46e5',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#f9fafb',
  },
  categoryBadgeSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryBadgeTextSelected: {
    color: '#4f46e5',
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
    borderRadius: 14,
    paddingVertical: 13,
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
    marginBottom: 14,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
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
    marginTop: 20,
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 14,
  },
});
