import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_PREFERENCE_KEY = 'biometric_preference';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

class BiometricService {
  private rnBiometrics: ReactNativeBiometrics | null = null;
  private isLibraryAvailable: boolean = false;

  constructor() {
    try {
      if (ReactNativeBiometrics && typeof ReactNativeBiometrics === 'function') {
        this.rnBiometrics = new ReactNativeBiometrics({
          allowDeviceCredentials: true,
        });
        this.isLibraryAvailable = true;
      } else {
        console.warn('ReactNativeBiometrics library is not properly linked');
        this.isLibraryAvailable = false;
      }
    } catch (error) {
      console.error('Error initializing ReactNativeBiometrics:', error);
      this.rnBiometrics = null;
      this.isLibraryAvailable = false;
    }
  }

  async isBiometricSupported(): Promise<boolean> {
    try {
      if (!this.isLibraryAvailable || !this.rnBiometrics) {
        console.warn('ReactNativeBiometrics not initialized or not linked properly');
        return false;
      }
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  async getBiometricType(): Promise<string | null> {
    try {
      if (!this.rnBiometrics) {
        console.warn('ReactNativeBiometrics not initialized');
        return null;
      }
      const { biometryType } = await this.rnBiometrics.isSensorAvailable();
      return biometryType || null;
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return null;
    }
  }

  async saveBiometricPreference(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving biometric preference:', error);
      throw error;
    }
  }

  async getBiometricPreference(): Promise<boolean | null> {
    try {
      const preference = await AsyncStorage.getItem(BIOMETRIC_PREFERENCE_KEY);
      const parsed = preference ? JSON.parse(preference) : null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  async saveCredentialsForBiometric(email: string, password: string): Promise<boolean> {
    try {
      if (!this.isLibraryAvailable || !this.rnBiometrics) {
        console.warn('ReactNativeBiometrics not initialized, using fallback method');
        const credentials = {
          email,
          password,
          timestamp: Date.now(),
        };

        await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify({
          payload: JSON.stringify(credentials),
          hasCredentials: true,
          fallback: true,
        }));
        return true;
      }

      const credentials = {
        email,
        password,
        timestamp: Date.now(),
      };

      await this.rnBiometrics.createKeys();

      const payload = JSON.stringify(credentials);
      const { success, signature } = await this.rnBiometrics.createSignature({
        promptMessage: 'Confirme sua identidade para salvar as credenciais',
        payload,
      });

      if (success && signature) {
        await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify({
          payload,
          signature,
          hasCredentials: true,
          fallback: false,
        }));
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<{ success: boolean }> {
    try {

      if (!this.isLibraryAvailable || !this.rnBiometrics) {
        console.warn('ReactNativeBiometrics not available, checking if biometric is supported on device');

        try {
          if (ReactNativeBiometrics && typeof ReactNativeBiometrics === 'function') {
            this.rnBiometrics = new ReactNativeBiometrics({
              allowDeviceCredentials: true,
            });
            this.isLibraryAvailable = true;
          } else {
            return { success: false };
          }
        } catch (reinitError) {
          return { success: false };
        }
      }

      const { available, biometryType } = await this.rnBiometrics!.isSensorAvailable();

      if (!available) {
        return { success: false };
      }

      const result = await this.rnBiometrics!.simplePrompt({
        promptMessage: 'Use sua biometria para fazer login',
        fallbackPromptMessage: 'Use sua senha do dispositivo'
      });

      return { success: result.success };
    } catch (error: any) {

      return { success: false };
    }
  }

  async hasBiometricCredentials(): Promise<boolean> {
    try {
      const storedData = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
      if (!storedData) {
        return false;
      }

      const { hasCredentials } = JSON.parse(storedData);
      return hasCredentials === true;
    } catch (error) {
      return false;
    }
  }

  async clearBiometricData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(BIOMETRIC_PREFERENCE_KEY),
        AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY),
      ]);

      if (this.rnBiometrics) {
        await this.rnBiometrics.deleteKeys();
      }
    } catch (error) {
    }
  }

  async resetBiometricPreference(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_PREFERENCE_KEY);
    } catch (error) {
    }
  }

  async debugBiometricState(): Promise<void> {
    try {
      const preference = await this.getBiometricPreference();
      const hasCredentials = await this.hasBiometricCredentials();
      const isSupported = await this.isBiometricSupported();

    } catch (error) {
    }
  }
}

export default new BiometricService();