import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = () => {
    if (email === 'admin@admin.com' && senha === '123456') {
      navigation.navigate('Home' as never);
    } else {
      Alert.alert('Erro', 'Email ou senha inválidos');
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
        className="w-32 h-32 mb-8"
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
        />

        <Text className="text-lg font-semibold mb-2">Senha</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          className="mb-6"
        >
          <Text className="text-indigo-600 text-right">Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4 mb-4"
          onPress={handleLogin}
        >
          <Text className="text-center text-white font-bold text-lg">Entrar</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-600">Não tem uma conta? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text className="text-indigo-600 font-semibold">Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
