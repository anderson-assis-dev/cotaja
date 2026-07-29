import React, { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LivenessScreen, { LivenessResultData, LIVENESS_UNSUPPORTED_KEY } from '../screens/auth/LivenessScreen';

/**
 * Exibe a verificação de liveness (anti-robô) para usuários já cadastrados que
 * ainda não a realizaram, logo após o login (por senha ou biometria). O usuário
 * pode adiar ("Agora não") e continuar usando o app; nesse caso a verificação
 * volta a ser pedida na próxima abertura/login (o adiamento vale só para a
 * sessão atual). Dispositivos onde o modelo não carrega são liberados para não
 * travar o acesso.
 */
const LivenessGate: React.FC = () => {
  const { user, submitLiveness } = useAuth();
  const { showSuccess } = useToast();
  const [deferred, setDeferred] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  // Aparelhos onde o modelo já falhou antes: não pedimos liveness de novo.
  useEffect(() => {
    AsyncStorage.getItem(LIVENESS_UNSUPPORTED_KEY)
      .then((v) => setUnsupported(v === 'true'))
      .catch(() => {});
  }, [user]);

  const needsLiveness =
    !!user &&
    !!user.profile_type &&
    !user.liveness_verified &&
    !deferred &&
    !submitting &&
    !unsupported;

  const handleComplete = async (result: LivenessResultData) => {
    if (result.loadFailed) {
      // Device incompatível: não trava o usuário e não pede de novo.
      setUnsupported(true);
      return;
    }
    if (!result.isLive) {
      // A própria tela cuida do retry; só chega aqui em sucesso ou loadFailed.
      return;
    }
    setSubmitting(true);
    await submitLiveness(result.confidence, result.imageBase64);
    setSubmitting(false);
    showSuccess('Identidade verificada com sucesso!');
  };

  const handleCancel = () => setDeferred(true);

  return (
    <Modal visible={needsLiveness} animationType="slide" onRequestClose={handleCancel}>
      <LivenessScreen
        allowCancel
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default LivenessGate;
