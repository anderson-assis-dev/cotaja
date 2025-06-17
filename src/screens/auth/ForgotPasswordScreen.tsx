import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, digite seu email');
      return;
    }

    // Simulação de envio de email de recuperação
    Alert.alert(
      'Email Enviado',
      'Se este email estiver cadastrado em nossa base, você receberá as instruções para redefinir sua senha.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-white text-center mb-8">
          Recuperar Senha
        </Text>

        <View className="bg-white rounded-xl p-6 shadow-xl">
          <Text className="text-gray-600 text-center mb-6">
            Digite seu email cadastrado para receber as instruções de recuperação de senha
          </Text>

          <Text className="text-lg font-semibold mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4 mb-4"
            onPress={handleResetPassword}
          >
            <Text className="text-center text-white font-bold text-lg">
              Enviar Instruções
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Text className="text-indigo-600 text-center">Voltar para o Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
} 