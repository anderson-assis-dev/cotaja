import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../contexts/ToastContext';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const insets = useSafeAreaInsets();

  const handleResetPassword = () => {
    if (!email) {
      showError('Por favor, digite seu email');
      return;
    }

    // Simulação de envio de email de recuperação
    showSuccess('Se este email estiver cadastrado, você receberá as instruções para redefinir sua senha', 5000);
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Recuperar Senha
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.description}>
            Digite seu email cadastrado para receber as instruções de recuperação de senha
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
          >
            <Text style={styles.buttonText}>
              Enviar Instruções
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Voltar para o Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1', // indigo-500 to purple-600 gradient
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
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
  description: {
    color: '#6b7280', // gray-600
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4f46e5', // indigo-600
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  backText: {
    color: '#4f46e5', // indigo-600
    textAlign: 'center',
  },
});