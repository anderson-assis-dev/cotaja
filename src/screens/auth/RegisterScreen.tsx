import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { TextInputMask } from 'react-native-masked-text';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register, isLoading, logout, updateProfileType } = useAuth();
  const { showError, showSuccess } = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [phone, setPhone] = useState('');
  const [profileType, setProfileType] = useState<'client' | 'provider' | ''>('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const nomeInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<any>(null);
  const senhaInputRef = useRef<TextInput>(null);
  const confirmarSenhaInputRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha || !phone || !profileType) {
      showError('Por favor, preencha todos os campos e selecione o tipo de perfil');
      return;
    }

    if (senha !== confirmarSenha) {
      showError('As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const success = await register(nome, email, phone, senha, confirmarSenha, profileType);
      // Account created — needs email activation before login
      showSuccess('Cadastro realizado! Verifique seu email para ativar sua conta.', 6000);
      navigation.navigate('Login');
    } catch (error: any) {
      showError(error.message || 'Erro ao realizar cadastro');
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent,{paddingBottom:insets.bottom+24}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.outer}>
          <View style={[styles.header,{paddingTop:insets.top+20}]}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headerTitle}>Criar conta</Text>
            <Text style={styles.headerSubtitle}>É rápido e leva menos de 1 minuto</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.label}>Nome completo</Text>
              <View style={styles.inputRow}>
                <Icon name="person-outline" size={20} color="#6b7280" />
                <TextInput ref={nomeInputRef} style={styles.input} placeholder="Digite seu nome completo" placeholderTextColor="#9ca3af" value={nome} onChangeText={setNome} editable={!isLoading} returnKeyType="next" onSubmitEditing={() => emailInputRef.current?.focus()} />
              </View>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Icon name="mail-outline" size={20} color="#6b7280" />
                <TextInput ref={emailInputRef} style={styles.input} placeholder="Digite seu email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} returnKeyType="next" onSubmitEditing={() => phoneInputRef.current?.getElement()?.focus()} />
              </View>
              <Text style={styles.label}>Tipo de perfil</Text>
              <View style={styles.profileSelection}>
                <TouchableOpacity style={[styles.profileOption,profileType==='client'&&styles.profileOptionSelected]} onPress={() => setProfileType('client')} disabled={isLoading}>
                  <View style={styles.profileOptionContent}>
                    <Icon name="person" size={22} color={profileType==='client'?'#4f46e5':'#6b7280'} />
                    <Text style={[styles.profileOptionText,profileType==='client'&&styles.profileOptionTextSelected]}>Cliente</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.profileOption,profileType==='provider'&&styles.profileOptionSelected]} onPress={() => setProfileType('provider')} disabled={isLoading}>
                  <View style={styles.profileOptionContent}>
                    <Icon name="work" size={22} color={profileType==='provider'?'#4f46e5':'#6b7280'} />
                    <Text style={[styles.profileOptionText,profileType==='provider'&&styles.profileOptionTextSelected]}>Prestador</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputRow}>
                <Icon name="phone" size={20} color="#6b7280" />
                <TextInputMask ref={phoneInputRef} type={'cel-phone'} options={{maskType:'BRL',withDDD:true,dddMask:'(99) '}} value={phone} onChangeText={setPhone} placeholder="(99) 99999-9999" placeholderTextColor="#9ca3af" style={styles.input} keyboardType="phone-pad" editable={!isLoading} returnKeyType="next" onSubmitEditing={() => senhaInputRef.current?.focus()} />
              </View>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <Icon name="lock-outline" size={20} color="#6b7280" />
                <TextInput ref={senhaInputRef} style={styles.input} placeholder="Digite sua senha" placeholderTextColor="#9ca3af" value={senha} onChangeText={setSenha} secureTextEntry={!showSenha} editable={!isLoading} returnKeyType="next" onSubmitEditing={() => confirmarSenhaInputRef.current?.focus()} />
                <TouchableOpacity onPress={() => setShowSenha(v => !v)} style={styles.eyeButton} disabled={isLoading}>
                  <Icon name={showSenha ? 'visibility' : 'visibility-off'} size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Confirmar senha</Text>
              <View style={styles.inputRow}>
                <Icon name="lock-outline" size={20} color="#6b7280" />
                <TextInput ref={confirmarSenhaInputRef} style={styles.input} placeholder="Confirme sua senha" placeholderTextColor="#9ca3af" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry={!showConfirmarSenha} editable={!isLoading} returnKeyType="done" onSubmitEditing={handleRegister} />
                <TouchableOpacity onPress={() => setShowConfirmarSenha(v => !v)} style={styles.eyeButton} disabled={isLoading}>
                  <Icon name={showConfirmarSenha ? 'visibility' : 'visibility-off'} size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.primaryButton,isLoading&&styles.primaryButtonDisabled]} onPress={handleRegister} disabled={isLoading}>
                {isLoading?(
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
                <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
                  <Text style={styles.loginLink}>Faça login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  scroll:{
    flex:1,
  },
  scrollContent:{
    flexGrow:1,
  },
  logo: {
    width: 190,
    height: 64,
    tintColor:'#ffffff',
  },
  outer:{
    flex:1,
  },
  header:{
    paddingHorizontal:24,
    paddingBottom:26,
    alignItems:'center',
  },
  headerTitle:{
    fontSize:24,
    fontWeight:'900',
    color:'#ffffff',
    marginTop:10,
    letterSpacing:-0.5,
    textAlign:'center',
    width:'100%',
  },
  headerSubtitle:{
    color:'rgba(255,255,255,0.85)',
    fontSize:14,
    marginTop:4,
    textAlign:'center',
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
});