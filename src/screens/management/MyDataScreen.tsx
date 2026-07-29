import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Mail, RefreshCw, X, Calendar, Heart, Search } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';
import { SERVICE_CATEGORIES, filterCategories } from '../../utils/serviceCategories';

const maskDate = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function MyDataScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [changingType, setChangingType] = useState(false);

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [motherName, setMotherName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');

  // Na transição Cliente -> Prestador, só pedimos nome da mãe / nascimento se
  // o usuário ainda não os tiver cadastrado (ex.: nunca foi prestador antes).
  const needsPersonalData = !user?.mother_name && !user?.birth_date;

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('O nome não pode estar vazio.');
      return;
    }
    try {
      setSaving(true);
      await authService.updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshUser();
      showSuccess('Dados atualizados com sucesso!');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao salvar dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeProfileType = () => {
    const isClient = user?.profile_type === 'client';

    // Cliente -> Prestador: sempre abre o modal para selecionar a(s) área(s) de
    // atuação (e dados pessoais, se ainda não cadastrados). A troca só é efetivada
    // ao confirmar o modal com pelo menos uma categoria.
    if (isClient) {
      setMotherName('');
      setBirthDate('');
      setSelectedCategories(user?.service_categories || []);
      setCategorySearch('');
      setShowProviderModal(true);
      return;
    }

    // Prestador -> Cliente: confirmação simples, sem modal.
    Alert.alert(
      'Alterar tipo de conta',
      'Deseja alterar sua conta para Cliente?\n\nVocê passará a buscar serviços como cliente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tornar-se Cliente',
          onPress: () => doChangeProfileType('client'),
        },
      ],
    );
  };

  const doChangeProfileType = async (
    nextType: 'client' | 'provider',
    serviceCategories?: string[],
    extraData?: { mother_name: string; birth_date: string },
  ) => {
    try {
      setChangingType(true);
      await authService.updateProfileType(nextType, serviceCategories, extraData);
      await refreshUser();
      showSuccess(`Conta alterada para ${nextType === 'provider' ? 'Prestador' : 'Cliente'}!`);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao alterar tipo de conta.');
    } finally {
      setChangingType(false);
    }
  };

  const handleConfirmProvider = async () => {
    let extraData: { mother_name: string; birth_date: string } | undefined;

    if (needsPersonalData) {
      if (!motherName.trim()) {
        showError('Informe o nome da mãe.');
        return;
      }
      const dateDigits = birthDate.replace(/\D/g, '');
      if (dateDigits.length !== 8) {
        showError('Informe a data de nascimento completa (DD/MM/AAAA).');
        return;
      }
      const day = parseInt(dateDigits.slice(0, 2), 10);
      const month = parseInt(dateDigits.slice(2, 4), 10);
      const year = parseInt(dateDigits.slice(4, 8), 10);
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2010) {
        showError('Data de nascimento inválida.');
        return;
      }
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      extraData = { mother_name: motherName.trim(), birth_date: isoDate };
    }

    if (selectedCategories.length === 0) {
      showError('Selecione pelo menos uma área de atuação.');
      return;
    }

    setShowProviderModal(false);
    await doChangeProfileType('provider', selectedCategories, extraData);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate(user?.profile_type === 'provider' ? 'Provider' : 'Client');
              }
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Dados</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>Informações pessoais</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <User size={18} color="#4f46e5" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Nome completo</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={styles.sep} />
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Phone size={18} color="#4f46e5" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <View style={styles.sep} />
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Mail size={18} color="#9ca3af" />
              </View>
              <View style={styles.fieldBody}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.readOnlyValue}>{user?.email}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Tipo de conta</Text>
          <View style={styles.card}>
            <View style={styles.typeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {user?.profile_type === 'provider' ? 'Prestador de Serviços' : 'Cliente'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.typeChangeBtn, changingType && styles.typeChangeBtnDisabled]}
                onPress={handleChangeProfileType}
                activeOpacity={0.8}
                disabled={changingType}
              >
                {changingType ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <>
                    <RefreshCw size={16} color="#4f46e5" />
                    <Text style={styles.typeChangeBtnText}>Alterar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
      />

      <Modal visible={showProviderModal} transparent animationType="fade" onRequestClose={() => setShowProviderModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tornar-se Prestador</Text>
              <TouchableOpacity onPress={() => setShowProviderModal(false)} activeOpacity={0.7}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              {needsPersonalData
                ? 'Preencha seus dados e selecione as áreas em que deseja atuar:'
                : 'Selecione as áreas em que deseja atuar como prestador:'}
            </Text>

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {needsPersonalData && (
                <>
                  <View style={styles.modalField}>
                    <View style={styles.modalFieldIcon}>
                      <Heart size={18} color="#4f46e5" />
                    </View>
                    <View style={styles.modalFieldBody}>
                      <Text style={styles.modalFieldLabel}>Nome da mãe</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={motherName}
                        onChangeText={setMotherName}
                        placeholder="Nome completo da mãe"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.modalFieldSep} />

                  <View style={styles.modalField}>
                    <View style={styles.modalFieldIcon}>
                      <Calendar size={18} color="#4f46e5" />
                    </View>
                    <View style={styles.modalFieldBody}>
                      <Text style={styles.modalFieldLabel}>Data de nascimento</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={birthDate}
                        onChangeText={(t) => setBirthDate(maskDate(t))}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  </View>

                  <View style={styles.modalFieldSep} />
                </>
              )}

              <Text style={[styles.modalFieldLabel, { marginTop: needsPersonalData ? 8 : 0, marginBottom: 10 }]}>
                Áreas de atuação
              </Text>

              {selectedCategories.length > 0 && (
                <View style={styles.categoriesContainer}>
                  {selectedCategories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryBadge, styles.categoryBadgeSelected]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <Text style={[styles.categoryBadgeText, styles.categoryBadgeTextSelected]}>{cat} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.categorySearchRow}>
                <Search size={18} color="#9ca3af" />
                <TextInput
                  style={styles.categorySearchInput}
                  placeholder="Buscar áreas..."
                  placeholderTextColor="#9ca3af"
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                />
              </View>

              <View style={styles.categoriesContainer}>
                {filterCategories(categorySearch)
                  .filter(c => !selectedCategories.includes(c.name))
                  .slice(0, categorySearch ? 50 : 12)
                  .map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.categoryBadge}
                      onPress={() => { toggleCategory(cat.name); setCategorySearch(''); }}
                    >
                      <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                {!categorySearch && SERVICE_CATEGORIES.length > 12 && (
                  <Text style={styles.categoryHint}>Digite para ver mais áreas...</Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, changingType && styles.saveBtnDisabled]}
              onPress={handleConfirmProvider}
              activeOpacity={0.8}
              disabled={changingType}
            >
              {changingType ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalConfirmBtnText}>Tornar-se Prestador</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: 500,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  readOnlyValue: {
    fontSize: 15,
    color: '#6b7280',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 66,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    minHeight: 52,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  typeBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
  },
  typeChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4f46e5',
  },
  typeChangeBtnDisabled: {
    opacity: 0.5,
  },
  typeChangeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalFieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFieldBody: {
    flex: 1,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 2,
  },
  modalInput: {
    fontSize: 15,
    color: '#111827',
    padding: 0,
    paddingVertical: 6,
  },
  modalFieldSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 50,
    marginVertical: 8,
  },
  modalScroll: {
    maxHeight: 360,
  },
  categorySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  modalConfirmBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
