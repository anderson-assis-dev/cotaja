import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = () => {
    if (email === 'admin@admin.com' && senha === '123456') {
      navigation.navigate('Home' as never);
    } else {
      Alert.alert('Erro', 'Email ou senha inválidos');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <Text className="text-4xl font-bold text-white mb-8">MeuApp</Text>

      <View className="bg-white rounded-xl w-full p-6 shadow-xl">
        <Text className="text-xl font-semibold mb-2">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Digite seu email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="text-xl font-semibold mb-2">Senha</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 mb-6"
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg p-4"
          onPress={handleLogin}
        >
          <Text className="text-center text-white font-bold text-lg">Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
