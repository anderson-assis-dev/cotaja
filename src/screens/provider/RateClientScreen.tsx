import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';

// Navigation types
type RootStackParamList = {
  MyServices: undefined;
  [key: string]: any;
};

type RateClientScreenNavigationProp = NavigationProp<RootStackParamList>;

// TypeScript interfaces
interface Client {
  name: string;
  avatar: any; // For require() images
}

interface MockService {
  id: string;
  title: string;
  client: Client;
  date: string;
}

// Mock data for example
const mockService: MockService = {
  id: '1',
  title: 'Pintura de apartamento',
  client: {
    name: 'Maria Silva',
    avatar: require('../../../assets/splash-icon.png'),
  },
  date: '15/03/2024',
};

export default function RateClientScreen() {
  const navigation = useNavigation<RateClientScreenNavigationProp>();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Erro', 'Por favor, selecione uma avaliação');
      return;
    }

    // Simulation of rating submission
    Alert.alert(
      'Sucesso',
      'Avaliação enviada com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MyServices'),
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Avaliar Cliente</Text>

        <View style={styles.card}>
          <View style={styles.clientInfo}>
            <Image
              source={mockService.client.avatar}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.clientName}>{mockService.client.name}</Text>
              <Text style={styles.serviceTitle}>{mockService.title}</Text>
              <Text style={styles.serviceDate}>{mockService.date}</Text>
            </View>
          </View>

          <Text style={styles.ratingLabel}>Sua Avaliação</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={styles.starText}>
                  <Star size={32} color="#fbbf24" fill={star <= rating ? '#fbbf24' : 'none'} />
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.commentLabel}>Comentário (opcional)</Text>

          <TextInput
            style={styles.commentInput}
            placeholder="Conte-nos sobre sua experiência com o cliente"
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              Enviar Avaliação
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// StyleSheet definitions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 24,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  serviceTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  serviceDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    marginHorizontal: 8,
  },
  starText: {
    fontSize: 32,
    color: '#fbbf24',
  },
  commentLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    height: 128,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    textAlign: 'center',
  },
});