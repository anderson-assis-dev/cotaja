import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { TextInputMask } from 'react-native-masked-text';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register, isLoading, logout, updateProfileType } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [phone, setPhone] = useState('');
  const [profileType, setProfileType] = useState<'client' | 'provider' | ''>('');

  const nomeInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<any>(null);
  const senhaInputRef = useRef<TextInput>(null);
  const confirmarSenhaInputRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha || !phone || !profileType) {
      console.log('Erro: Por favor, preencha todos os campos e selecione o tipo de perfil');
      return;
    }

    if (senha !== confirmarSenha) {
      console.log('Erro: As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      console.log('Erro: A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const success = await register(nome, email, phone, senha, confirmarSenha, profileType);
      // Profile type is now sent directly during registration
    } catch (error: any) {
      console.log('Erro ao realizar cadastro:', error.message || error);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/logo.png')} style={[styles.logo, { tintColor: 'white' }]} resizeMode="contain" />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            ref={nomeInputRef}
            style={styles.input}
            placeholder="Digite seu nome completo"
            value={nome}
            onChangeText={setNome}
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => phoneInputRef.current?.getElement()?.focus()}
          />

          <Text style={styles.label}>Tipo de Perfil</Text>
          <View style={styles.profileSelection}>
            <TouchableOpacity
              style={[
                styles.profileOption,
                profileType === 'client' && styles.profileOptionSelected
              ]}
              onPress={() => setProfileType('client')}
              disabled={isLoading}
            >
              <View style={styles.profileOptionContent}>
                <Icon
                  name="person"
                  size={24}
                  color={profileType === 'client' ? '#4f46e5' : '#6b7280'}
                />
                <Text style={[
                  styles.profileOptionText,
                  profileType === 'client' && styles.profileOptionTextSelected
                ]}>
                  Cliente
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profileOption,
                profileType === 'provider' && styles.profileOptionSelected
              ]}
              onPress={() => setProfileType('provider')}
              disabled={isLoading}
            >
              <View style={styles.profileOptionContent}>
                <Icon
                  name="work"
                  size={24}
                  color={profileType === 'provider' ? '#16a34a' : '#6b7280'}
                />
                <Text style={[
                  styles.profileOptionText,
                  profileType === 'provider' && styles.profileOptionTextSelected
                ]}>
                  Prestador
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Telefone</Text>
          <TextInputMask
            ref={phoneInputRef}
            type={'cel-phone'}
            options={{
              maskType: 'BRL',
              withDDD: true,
              dddMask: '(99) '
            }}
            value={phone}
            onChangeText={setPhone}
            placeholder="(99) 99999-9999"
            style={styles.input}
            keyboardType="phone-pad"
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => senhaInputRef.current?.focus()}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            ref={senhaInputRef}
            style={styles.input}
            placeholder="Digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            editable={!isLoading}
            returnKeyType="next"
            onSubmitEditing={() => confirmarSenhaInputRef.current?.focus()}
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            ref={confirmarSenhaInputRef}
            style={[styles.input, styles.lastInput]}
            placeholder="Confirme sua senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            style={[styles.button, isLoading ? styles.buttonDisabled : styles.buttonEnabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Cadastrando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
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
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1', // indigo-500 gradient start
  },
  content: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 128,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 4,
    },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 5,
    right: -28
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  lastInput: {
    marginBottom: 24,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  buttonEnabled: {
    backgroundColor: '#4f46e5',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  profileOptionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#f3f4f6',
  },
  profileOptionContent: {
    alignItems: 'center',
    gap: 8,
  },
  profileOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  profileOptionTextSelected: {
    color: '#4f46e5',
  },
});