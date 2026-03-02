import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InitialScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { tintColor: 'white' }]}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Bem-vindo ao Cotaja
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonTitle}>
            Sou Cliente
          </Text>
          <Text style={styles.buttonSubtitle}>
            Quero contratar serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonTitle}>
            Sou Prestador
          </Text>
          <Text style={styles.buttonSubtitle}>
            Quero oferecer serviços
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 192,
    height: 192,
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    marginBottom: 24,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
  },
  buttonSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});