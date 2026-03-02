import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugAsyncStorage = async () => {
  try {
    console.log('🔍 Debug do AsyncStorage:');

    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 Todas as chaves:', keys);

    const onboardingStatus = await AsyncStorage.getItem('onboarding_completed');
    console.log('📱 onboarding_completed:', onboardingStatus);

    const values = await AsyncStorage.multiGet(keys);
    console.log('📦 Todos os valores:', values);

  } catch (error) {
    console.error('❌ Erro ao debuggar AsyncStorage:', error);
  }
};

export const clearOnboardingForTesting = async () => {
  try {
    console.log('🧹 Limpando onboarding para teste...');
    await AsyncStorage.removeItem('onboarding_completed');
    console.log('✅ Onboarding removido');
  } catch (error) {
    console.error('❌ Erro ao limpar onboarding:', error);
  }
};