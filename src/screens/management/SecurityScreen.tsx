import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/api';
import { useStatusBarOverlay } from '../../hooks/useStatusBarOverlay';
import { StatusBarOverlay } from '../../components/StatusBarOverlay';

type Step = 'request' | 'verify';

export default function SecurityScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showStatusBarOverlay, statusBarOpacity, handleScroll } = useStatusBarOverlay();

  const [step, setStep] = useState<Step>('request');
  const [requesting, setRequesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOtp = async () => {
    try {
      setRequesting(true);
      await authService.requestOtp();
      showSuccess('Código enviado para o seu email!');
      setStep('verify');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao enviar código.');
    } finally {
      setRequesting(false);
    }
  };

  const handleChangePassword = async () => {
    if (otp.length !== 6) {
      showError('Digite o código de 6 dígitos.');
      return;
    }
    if (newPassword.length < 6) {
      showError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('As senhas não coincidem.');
      return;
    }
    try {
      setSaving(true);
      await authService.changePasswordWithOtp(otp, newPassword);
      showSuccess('Senha alterada com sucesso!');
      navigation.goBack();
    } catch (error: any) {
      showError(error.response?.data?.message || 'Erro ao alterar senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ArrowLeft size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Segurança</Text>
        </View>

        <View style={styles.content}>
          {step === 'request' ? (
            <>
              <View style={styles.infoCard}>
                <ShieldCheck size={32} color="#4f46e5" style={{ marginBottom: 12 }} />
                <Text style={styles.infoTitle}>Alterar Senha</Text>
                <Text style={styles.infoText}>
                  Enviaremos um código de verificação para o seu email. Use-o para confirmar a troca de senha.
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Email cadastrado</Text>
              <View style={styles.card}>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <Mail size={18} color="#9ca3af" />
                  </View>
                  <Text style={styles.emailText}>{user?.email}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, requesting && styles.btnDisabled]}
                onPress={handleRequestOtp}
                activeOpacity={0.8}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Enviar código de verificação</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.infoCard}>
                <KeyRound size={32} color="#4f46e5" style={{ marginBottom: 12 }} />
                <Text style={styles.infoTitle}>Verifique seu email</Text>
                <Text style={styles.infoText}>
                  Digite o código de 6 dígitos enviado para{' '}
                  <Text style={styles.emailHighlight}>{user?.email}</Text> e defina sua nova senha.
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Código de verificação</Text>
              <View style={styles.card}>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <KeyRound size={18} color="#4f46e5" />
                  </View>
                  <View style={styles.fieldBody}>
                    <Text style={styles.fieldLabel}>Código OTP</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      value={otp}
                      onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Nova senha</Text>
              <View style={styles.card}>
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <KeyRound size={18} color="#4f46e5" />
                  </View>
                  <View style={styles.fieldBody}>
                    <Text style={styles.fieldLabel}>Nova senha</Text>
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity onPress={() => setShowNewPassword(v => !v)} activeOpacity={0.7}>
                    {showNewPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>
                <View style={styles.sep} />
                <View style={styles.field}>
                  <View style={styles.fieldIcon}>
                    <KeyRound size={18} color="#4f46e5" />
                  </View>
                  <View style={styles.fieldBody}>
                    <Text style={styles.fieldLabel}>Confirmar senha</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repita a nova senha"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} activeOpacity={0.7}>
                    {showConfirmPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, saving && styles.btnDisabled]}
                onPress={handleChangePassword}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Alterar senha</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => { setStep('request'); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.resendBtnText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <StatusBarOverlay
        show={showStatusBarOverlay}
        opacity={statusBarOpacity}
        backgroundColor="#fff"
      />
    </KeyboardAvoidingView>
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
  infoCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#4f46e5',
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
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#4f46e5',
  },
  emailText: {
    fontSize: 15,
    color: '#6b7280',
    flex: 1,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 66,
  },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 52,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendBtnText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
});
