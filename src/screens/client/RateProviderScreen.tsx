import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ratingService } from '../../services/api';

export default function RateProviderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { companyToRate } = (route.params as any) || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  if (!companyToRate) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Nenhuma empresa selecionada para avaliar.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação Incompleta', 'Por favor, selecione pelo menos uma estrela.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const providerId = String(companyToRate.id);
      const response = await ratingService.createProviderRating(providerId, { rating, comment, attachments });
      if (response.success) {
        Alert.alert('Avaliação Enviada', 'Obrigado por seu feedback!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível enviar sua avaliação');
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível enviar sua avaliação');
    } finally {
      setSubmitting(false);
    }
  };
  const handleCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments([...attachments, { uri: asset.uri!, name: asset.fileName!, type: asset.type! }]);
    }
  };
  const handleGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7, selectionLimit: 5 });
    if (result.assets && result.assets.length > 0) {
      const newAssets = result.assets.map(asset => ({ uri: asset.uri!, name: asset.fileName!, type: asset.type! }));
      setAttachments([...attachments, ...newAssets]);
    }
  };
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  return (
    <View style={styles.outer}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Avaliar Empresa</Text>
          <Text style={styles.headerSubtitle}>Envie sua nota e experiência</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.ratingCard}>
            <View style={styles.companyHeader}>
              <Image source={companyToRate.image} style={styles.companyAvatar} />
              <View>
                <Text style={styles.companyName}>{companyToRate.name}</Text>
                <Text style={styles.companyCategory}>{companyToRate.category}</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Sua Nota</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton} disabled={submitting}>
                  <Icon name="star" size={40} color={star <= rating ? '#f59e0b' : '#d1d5db'} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Sua Experiência</Text>
            <TextInput style={styles.commentInput} placeholder="Descreva como foi o serviço..." value={comment} onChangeText={setComment} multiline textAlignVertical="top" editable={!submitting} />
            <Text style={styles.sectionTitle}>Anexar Fotos</Text>
            <View style={styles.attachmentButtons}>
              <TouchableOpacity onPress={handleCamera} style={styles.attachmentButton} disabled={submitting}>
                <Icon name="photo-camera" size={30} color="#4f46e5" />
                <Text style={styles.attachmentButtonText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGallery} style={styles.attachmentButton} disabled={submitting}>
                <Icon name="photo-library" size={30} color="#4f46e5" />
                <Text style={styles.attachmentButtonText}>Galeria</Text>
              </TouchableOpacity>
            </View>
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((file, index) => (
                  <View key={`${file.uri}-${index}`} style={styles.attachmentItem}>
                    <Image source={{ uri: file.uri }} style={styles.attachmentThumbnail} />
                    <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(index)} style={styles.removeButton} disabled={submitting}>
                      <Icon name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>Enviar Avaliação</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={submitting}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#4f46e5',
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  content: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    minHeight: 500,
  },
  ratingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  companyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  companyCategory: {
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#4b5563',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    marginHorizontal: 8,
  },
  commentInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    height: 128,
    textAlignVertical: 'top',
  },
  attachmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attachmentButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  attachmentButtonText: {
    fontSize: 12,
    color: '#4f46e5',
    marginTop: 4,
  },
  attachmentsList: {
    marginBottom: 16,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
  },
  attachmentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  attachmentName: {
    flex: 1,
    color: '#4b5563',
  },
  removeButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 16,
  },
  submitButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelText: {
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
  },
  errorButton: {
    marginTop: 16,
  },
  errorButtonText: {
    color: '#4f46e5',
  },
}); 