import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import biometricService from '../services/biometricService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanFace, Fingerprint } from 'lucide-react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading, loginWithBiometric, hasBiometricCredentials } = useAuth();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha,setShowSenha]=useState(false);
  const [biometricActivated, setBiometricActivated] = useState(false);
  const [biometricType, setBiometricType] = useState<'Fingerprint' | 'FaceID' | null>(null);

  useEffect(() => {
    const checkBiometricStatus = async () => {
      try {
        const isSupported = await biometricService.isBiometricSupported();
        if (isSupported) {
          const type = await biometricService.getBiometricType();
          setBiometricType(type == 'FaceID' ? 'FaceID' : 'Fingerprint');
        } else {
          setBiometricType(null);
        }
        const activated = await AsyncStorage.getItem('biometryactivated');
        setBiometricActivated(activated === 'true');
      } catch (error) {
        console.error('Error checking biometric status:', error);
      }
    };

    checkBiometricStatus();
  }, []);

  useEffect(() => {
    const recheckBiometric = async () => {
      try {
        const activated = await AsyncStorage.getItem('biometryactivated');
        setBiometricActivated(activated === 'true');
      } catch (error) {
        console.error('Error re-checking biometric status:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', recheckBiometric);
    return unsubscribe;
  }, [navigation]);

  const handleBiometricLogin = async () => {
    await loginWithBiometric();
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    try {
      await login(email, senha);
    } catch (error: any) {
      let errorMessage = 'Email ou senha inválidos';

      if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.outer}>
            <View style={[styles.header,{paddingTop:insets.top}]}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.content}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Bem-vindo de volta</Text>
                <Text style={styles.subtitle}>Entre com seu email e senha</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Icon name="mail-outline" size={20} color="#6b7280" />
                  <TextInput style={styles.input} placeholder="Digite seu email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} autoComplete="email" />
                </View>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputRow}>
                  <Icon name="lock-outline" size={20} color="#6b7280" />
                  <TextInput style={styles.input} placeholder="Digite sua senha" placeholderTextColor="#9ca3af" value={senha} onChangeText={setSenha} secureTextEntry={!showSenha} editable={!isLoading} autoComplete="password" />
                  <TouchableOpacity onPress={()=>setShowSenha(v=>!v)} disabled={isLoading} style={styles.eyeButton}>
                    <Icon name={showSenha?'visibility':'visibility-off'} size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton} disabled={isLoading}>
                  <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton,isLoading&&styles.primaryButtonDisabled]} onPress={handleLogin} disabled={isLoading}>
                  {isLoading?(
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.primaryButtonText}>Entrando...</Text>
                    </View>
                  ):(
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>
                {biometricActivated&&biometricType!==null?(
                  <>
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>ou</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    <TouchableOpacity style={[styles.secondaryButton,isLoading&&styles.secondaryButtonDisabled]} onPress={handleBiometricLogin} disabled={isLoading}>
                      {biometricType==='FaceID'?<ScanFace size={20} color="#4f46e5" />:<Fingerprint size={20} color="#4f46e5" />}
                      <Text style={styles.secondaryButtonText}>{biometricType==='FaceID'?'Entrar com Face ID':'Entrar com Touch ID'}</Text>
                    </TouchableOpacity>
                  </>
                ):null}
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>Não tem uma conta? </Text>
                  <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                    <Text style={styles.registerLink}>Cadastre-se</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{height:insets.bottom+24}} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  outer:{
    flex: 1,
  },
  header:{
    paddingHorizontal:24,
    paddingBottom:26,
    alignItems:'center',
  },
  logo: {
    width: 270,
    height: 94,
    tintColor:'#ffffff',
    left: 15,
    marginBottom: -15,
  },
  headerTitle:{
    fontSize:34,
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
  headerContent: {
    alignItems:'flex-start',
    marginBottom:5,
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
  title: {
    fontSize:22,
    fontWeight:'800',
    color:'#111827',
  },
  subtitle:{
    color:'#6b7280',
    marginTop:6,
    marginBottom:18,
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
  eyeButton:{
    paddingLeft:10,
  },
  forgotPasswordButton: {
    marginBottom:18,
  },
  forgotPasswordText: {
    color:'#4f46e5',
    textAlign:'right',
    fontWeight:'700',
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop:16,
  },
  registerText: {
    color: '#6b7280',
  },
  registerLink: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  secondaryButton:{
    borderRadius:12,
    borderWidth:1,
    borderColor:'#e5e7eb',
    backgroundColor:'#ffffff',
    paddingVertical:12,
    paddingHorizontal:12,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap:10,
  },
  secondaryButtonDisabled:{
    opacity:0.6,
  },
  secondaryButtonText:{
    color:'#4f46e5',
    fontWeight:'800',
  },
});
