import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, StatusBar, Switch, Alert, TextInput, Modal, Platform } from 'react-native';
import { useNavigation, NavigationProp, CommonActions, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, FileText, Wallet, User, Lock, LogOut, ChevronRight, CreditCard, Shield, Bell, Mail, MapPin, Instagram, Youtube, MessageCircle, Facebook, Music2, Clapperboard, Trash2, KeyRound } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/api';
import pushNotificationService from '../../services/pushNotificationService';

type RootStackParamList = {
  Login: undefined;
  MyData: undefined;
  Security: undefined;
  Wallet: undefined;
  TermsOfUse: undefined;
  PrivacyPolicy: undefined;
  [key: string]: any;
};

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/cotaja.io',
  whatsapp: 'https://wa.me/551142102257',
  youtube: 'https://youtube.com/@cotajaseumarketplacedeservicos',
  facebook: 'https://www.facebook.com/share/1ArvGRTDmo/',
  tiktok: 'https://www.tiktok.com/@cotaja.seu.market',
  kwai: 'https://www.kwai.com/@cotajaseumarke',
};

type ProfileScreenNavigationProp = NavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { logout, user, refreshUser, deleteAccount } = useAuth();
  const { showSuccess, showError } = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(Number(user?.email_unsubscribed ?? 0) !== 1);
  const [savingEmailPref, setSavingEmailPref] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  const loadPermissionsState = useCallback(async () => {
    const notifPref = await AsyncStorage.getItem('push_notifications_pref');
    setNotificationsEnabled(
      notifPref !== 'false' && pushNotificationService.isServiceInitialized(),
    );
    const locPref = await AsyncStorage.getItem('location_enabled_pref');
    setLocationEnabled(locPref === 'true');
  }, []);

  const loadSecurityCode = useCallback(async () => {
    if (user?.profile_type !== 'provider') return;
    try {
      const response = await authService.getSecurityCode();
      if (response.success) {
        setSecurityCode(response.data.security_code || '');
      }
    } catch {}
  }, [user?.profile_type]);

  const handleSaveSecurityCode = async () => {
    if (!newCode || newCode.length !== 4) {
      showError('O código deve ter exatamente 4 dígitos.');
      return;
    }
    if (!/^\d+$/.test(newCode)) {
      showError('O código deve conter apenas números.');
      return;
    }
    setSavingCode(true);
    try {
      const response = await authService.updateSecurityCode(newCode);
      if (response.success) {
        setSecurityCode(newCode);
        setEditingCode(false);
        setNewCode('');
        showSuccess('Código de segurança atualizado!');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao atualizar código.');
    } finally {
      setSavingCode(false);
    }
  };

  useEffect(() => {
    loadPermissionsState();
    loadSecurityCode();
  }, [loadPermissionsState, loadSecurityCode]);

  useFocusEffect(
    useCallback(() => {
      loadPermissionsState();
      loadSecurityCode();
      StatusBar.setBarStyle('dark-content', true);
      StatusBar.setBackgroundColor('#f0f2f5');
    }, [loadPermissionsState]),
  );

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('push_notifications_pref', value ? 'true' : 'false');
    if (value) {
      await pushNotificationService.initialize();
    } else {
      await pushNotificationService.clearToken();
    }
  };

  useEffect(() => {
    setEmailNotificationsEnabled(Number(user?.email_unsubscribed ?? 0) !== 1);
  }, [user?.email_unsubscribed]);

  const handleToggleEmailNotifications = async (value: boolean) => {
    setEmailNotificationsEnabled(value); // otimista
    setSavingEmailPref(true);
    try {
      await authService.updateNotificationPreferences(value);
      await refreshUser();
    } catch (error: any) {
      setEmailNotificationsEnabled(!value); // reverte
      showError(error.response?.data?.message || 'Não foi possível atualizar a preferência de e-mail.');
    } finally {
      setSavingEmailPref(false);
    }
  };

  const handleToggleLocation = async (value: boolean) => {
    setLocationEnabled(value);
    await AsyncStorage.setItem('location_enabled_pref', value ? 'true' : 'false');
  };

  const handleOpenSocial = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação é irreversível. Você perderá todos os seus dados e não conseguirá acessar com este e-mail.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            } catch (error: any) {
              showError(error.message || 'Erro ao excluir conta.');
            }
          },
        },
      ],
    );
  };

  const handleChangeAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      });
      if (result.didCancel || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        showError('Não foi possível processar a imagem.');
        return;
      }
      const base64String = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
      setUploadingAvatar(true);
      await authService.updateAvatar(base64String);
      await refreshUser();
      showSuccess('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handleChangeAvatar} disabled={uploadingAvatar} activeOpacity={0.85}>
            {uploadingAvatar ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color="#4f46e5" />
              </View>
            ) : user.avatar_base64 ? (
              <Image source={{ uri: user.avatar_base64 }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
              </View>
            )}
            <View style={styles.cameraTag}>
              <Camera size={13} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroName}>{user.name}</Text>
        </View>

        <Text style={styles.groupLabel}>Minha Conta</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MyData')} activeOpacity={0.7}>
            <User size={22} color="#374151" />
            <Text style={styles.itemText}>Meus Dados</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Security')} activeOpacity={0.7}>
            <Lock size={22} color="#374151" />
            <Text style={styles.itemText}>Segurança</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.7}>
            <CreditCard size={22} color="#374151" />
            <Text style={styles.itemText}>Carteira & Pagamentos</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          {user.profile_type === 'provider' && (
            <>
              <View style={styles.sep} />
              <TouchableOpacity
                style={styles.item}
                onPress={() => { setEditingCode(true); setNewCode(securityCode); }}
                activeOpacity={0.7}
              >
                <KeyRound size={22} color="#374151" />
                <Text style={styles.itemText}>Código de Segurança</Text>
                <Text style={styles.securityCodeInline}>
                  {securityCode
                    ? securityCode.split('').join(' ')
                    : '_ _ _ _'}
                </Text>
                <ChevronRight size={18} color="#9ca3af" />
              </TouchableOpacity>

              <Modal visible={editingCode} transparent animationType="fade">
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => { setEditingCode(false); setNewCode(''); }}
                >
                  <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Código de Segurança</Text>
                    <Text style={styles.modalSubtitle}>
                      Digite um código de 4 dígitos. Informe-o ao cliente para confirmar sua identidade.
                    </Text>
                    <TextInput
                      style={styles.securityCodeInput}
                      value={newCode}
                      onChangeText={(t) => setNewCode(t.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="0 0 0 0"
                      placeholderTextColor="#9ca3af"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={() => { if (newCode.length === 4 && !savingCode) handleSaveSecurityCode(); }}
                    />
                    <TouchableOpacity
                      style={[styles.modalSaveBtn, (savingCode || newCode.length !== 4) && { opacity: 0.5 }]}
                      onPress={handleSaveSecurityCode}
                      disabled={savingCode || newCode.length !== 4}
                    >
                      {savingCode ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.modalSaveBtnText}>Salvar</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => { setEditingCode(false); setNewCode(''); }}
                    >
                      <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            </>
          )}
        </View>

        <Text style={styles.groupLabel}>Suporte</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('TermsOfUse')} activeOpacity={0.7}>
            <FileText size={22} color="#374151" />
            <Text style={styles.itemText}>Termos de Uso</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PrivacyPolicy')} activeOpacity={0.7}>
            <Shield size={22} color="#374151" />
            <Text style={styles.itemText}>Política de Privacidade</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>Preferências</Text>
        <View style={styles.group}>
          <View style={styles.item}>
            <Bell size={22} color="#374151" />
            <Text style={styles.itemText}>Notificações push</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={notificationsEnabled ? '#4f46e5' : '#f3f4f6'}
            />
          </View>
          <View style={styles.sep} />
          <View style={styles.item}>
            <Mail size={22} color="#374151" />
            <Text style={styles.itemText}>Notificações por e-mail</Text>
            <Switch
              value={emailNotificationsEnabled}
              onValueChange={handleToggleEmailNotifications}
              disabled={savingEmailPref}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={emailNotificationsEnabled ? '#4f46e5' : '#f3f4f6'}
            />
          </View>
          <View style={styles.sep} />
          <View style={styles.item}>
            <MapPin size={22} color="#374151" />
            <Text style={styles.itemText}>Localização</Text>
            <Switch
              value={locationEnabled}
              onValueChange={handleToggleLocation}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={locationEnabled ? '#4f46e5' : '#f3f4f6'}
            />
          </View>
        </View>

        <Text style={styles.groupLabel}>Redes sociais</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => handleOpenSocial(SOCIAL_LINKS.instagram)} activeOpacity={0.7}>
            <Instagram size={22} color="#374151" />
            <Text style={styles.itemText}>Instagram</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => handleOpenSocial(SOCIAL_LINKS.whatsapp)} activeOpacity={0.7}>
            <MessageCircle size={22} color="#374151" />
            <Text style={styles.itemText}>WhatsApp</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => handleOpenSocial(SOCIAL_LINKS.youtube)} activeOpacity={0.7}>
            <Youtube size={22} color="#374151" />
            <Text style={styles.itemText}>YouTube</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => handleOpenSocial(SOCIAL_LINKS.facebook)} activeOpacity={0.7}>
            <Facebook size={22} color="#374151" />
            <Text style={styles.itemText}>Facebook</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => handleOpenSocial(SOCIAL_LINKS.tiktok)} activeOpacity={0.7}>
            <Music2 size={22} color="#374151" />
            <Text style={styles.itemText}>TikTok</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={() => handleOpenSocial(SOCIAL_LINKS.kwai)} activeOpacity={0.7}>
            <Clapperboard size={22} color="#374151" />
            <Text style={styles.itemText}>Kwai</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>Conta</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Trash2 size={22} color="#dc2626" />
            <Text style={[styles.itemText, { color: '#dc2626' }]}>Excluir Conta</Text>
          </TouchableOpacity>
          <View style={styles.sep} />
          <TouchableOpacity style={styles.item} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={22} color="#dc2626" />
            <Text style={[styles.itemText, { color: '#dc2626' }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: '#f0f2f5',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '700',
    color: '#4b5563',
  },
  cameraTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f2f5',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 20,
    marginBottom: 6,
    marginTop: 18,
  },
  group: {
    backgroundColor: '#ffffff',
    marginHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1d5db',
    marginLeft: 58,
  },
  securityCodeInline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: 3,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  securityCodeInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 12,
    textAlign: 'center',
    width: '100%',
  },
  modalSaveBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    marginTop: 16,
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCancelBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
});

