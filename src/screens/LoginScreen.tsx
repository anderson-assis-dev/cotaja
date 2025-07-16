import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      console.log('🔄 Iniciando login...', { email });
      await login(email, senha);
      console.log('✅ Login concluído com sucesso');
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      let errorMessage = 'Email ou senha inválidos';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro de Login', errorMessage);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <Image 
        source={require('../../assets/logo.png')} 
        className="w-100 h-32 "
        resizeMode="contain"
      />

      <View className="bg-white rounded-xl w-full p-6 shadow-xl">
        <Text className="text-2xl font-bold text-center mb-6">Bem-vindo de volta!</Text>

        <Text className="text-lg font-semibold mb-2">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Digite seu email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          autoComplete="email"
        />

        <Text className="text-lg font-semibold mb-2">Senha</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          editable={!isLoading}
          autoComplete="password"
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          className="mb-6"
          disabled={isLoading}
        >
          <Text className="text-indigo-600 text-right">Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`rounded-lg p-4 mb-4 ${isLoading ? 'bg-gray-400' : 'bg-indigo-600'}`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-center text-white font-bold text-lg ml-2">Entrando...</Text>
            </View>
          ) : (
            <Text className="text-center text-white font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-600">Não tem uma conta? </Text>
          <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
            <Text className="text-indigo-600 font-semibold">Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
