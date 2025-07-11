import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { TextInputMask } from 'react-native-masked-text';
import { CommonActions } from '@react-navigation/native';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register, isLoading, logout } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha || !phone) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await register(nome, email, phone, senha, confirmarSenha);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao realizar cadastro');
    }
  };


  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600" style={{ paddingTop: insets.top }}>
      <View className="p-6">
        
        <View className="items-center">
          <Image source={require('../../../assets/logo.png')} className="w-80 h-40" resizeMode="contain" />
        </View>
        <Text className="text-3xl font-bold text-black text-center mb-8">Criar Conta</Text>

        <View className="bg-white rounded-xl p-6 shadow-xl">
          <Text className="text-lg font-semibold mb-2">Nome Completo</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite seu nome completo"
            value={nome}
            onChangeText={setNome}
            editable={!isLoading}
          />

          <Text className="text-lg font-semibold mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <Text className="text-lg font-semibold mb-2">Telefone</Text>
          <TextInputMask
            type={'cel-phone'}
            options={{
              maskType: 'BRL',
              withDDD: true,
              dddMask: '(99) '
            }}
            value={phone}
            onChangeText={setPhone}
            placeholder="(99) 99999-9999"
            className="border border-gray-300 rounded-lg p-3 mb-4" // MESMA CLASSE DOS OUTROS INPUTS
            keyboardType="phone-pad"
            editable={!isLoading}
          />

          <Text className="text-lg font-semibold mb-2">Senha</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-4"
            placeholder="Digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            editable={!isLoading}
          />

          <Text className="text-lg font-semibold mb-2">Confirmar Senha</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Confirme sua senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            className={`rounded-lg p-4 mb-4 ${isLoading ? 'bg-gray-400' : 'bg-indigo-600'}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-center text-white font-bold text-lg ml-2">Cadastrando...</Text>
              </View>
            ) : (
              <Text className="text-center text-white font-bold text-lg">Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600">Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
              <Text className="text-indigo-600 font-semibold">Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 