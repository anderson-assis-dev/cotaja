import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleRegister = () => {
    if (!nome || !email || !senha || !confirmarSenha || !telefone) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    // Simulação de cadastro bem-sucedido
    Alert.alert('Sucesso', 'Cadastro realizado com sucesso!', [
      {
        text: 'OK',
        onPress: () => navigation.navigate('ProfileSelection' as never)
      }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600">
      <View className="p-6">
        <Text className="text-3xl font-bold text-white text-center mb-8">Criar Conta</Text>

        <View className="bg-white rounded-xl p-6 shadow-xl">
          <Text className="text-lg font-semibold mb-2">Nome Completo</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite seu nome completo"
            value={nome}
            onChangeText={setNome}
          />

          <Text className="text-lg font-semibold mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="text-lg font-semibold mb-2">Telefone</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite seu telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <Text className="text-lg font-semibold mb-2">Senha</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <Text className="text-lg font-semibold mb-2">Confirmar Senha</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Confirme sua senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
          />

          <TouchableOpacity
            className="bg-indigo-600 rounded-lg p-4 mb-4"
            onPress={handleRegister}
          >
            <Text className="text-center text-white font-bold text-lg">Cadastrar</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600">Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-indigo-600 font-semibold">Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 