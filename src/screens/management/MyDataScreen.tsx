import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Phone, Mail, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

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
    const nextType = isClient ? 'provider' : 'client';
    const nextLabel = isClient ? 'Prestador' : 'Cliente';

    Alert.alert(
      'Alterar tipo de conta',
      `Deseja alterar sua conta para ${nextLabel}?${isClient ? '\n\nVocê poderá oferecer serviços na plataforma.' : '\n\nVocê passará a buscar serviços como cliente.'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Tornar-se ${nextLabel}`,
          onPress: async () => {
            try {
              setChangingType(true);
              await authService.updateProfileType(nextType);
              await refreshUser();
              showSuccess(`Conta alterada para ${nextLabel}!`);
            } catch (error: any) {
              showError(error.response?.data?.message || 'Erro ao alterar tipo de conta.');
            } finally {
              setChangingType(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#fff" />
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
        backgroundColor="#4f46e5"
        forceLight
      />
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
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
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
});
