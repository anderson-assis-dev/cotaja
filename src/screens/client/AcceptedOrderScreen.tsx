import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Image, FlatList, KeyboardAvoidingView, Platform, Modal, StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Clock, Check, CheckCheck, Send, RotateCcw, AlertCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  chatService, orderActionService, orderService,
  Message, Order
} from '../../services/api';
import { SkeletonBlock } from '../../components/Skeleton';
import { OrderTimeline } from '../../components/OrderTimeline';

type RouteParams = {
  AcceptedOrder: { orderId: number };
};

type TabType = 'chat' | 'schedule' | 'info';

interface LocalMessage extends Message {
  _status?: 'sending' | 'sent' | 'read' | 'error';
  _tempId?: string;
}

export default function AcceptedOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AcceptedOrder'>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const flatListRef = useRef<FlatList>(null);

  const orderId = route.params?.orderId;

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScheduling, setIsScheduling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isClient = user?.id === order?.client_id;
  const isProvider = user?.id === order?.provider_id;

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    return () => StatusBar.setBarStyle('dark-content', true);
  }, []);

  const loadOrder = useCallback(async () => {
    try {
      const response = await orderService.getOrder(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    }
  }, [orderId]);

  const loadMessages = useCallback(async () => {
    try {
      const response = await chatService.getMessages(orderId);
      if (response.success) {
        const serverMessages: LocalMessage[] = response.data.messages.map(msg => ({
          ...msg,
          _status: msg.read_at ? 'read' : 'sent',
        }));
        setMessages(prev => {
          const pendingMsgs = prev.filter(m => m._status === 'sending' || m._status === 'error');
          const serverIds = new Set(serverMessages.map(m => m.id));
          const stillPending = pendingMsgs.filter(m => !serverIds.has(m.id));
          return [...serverMessages, ...stillPending];
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }, [orderId]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadOrder(), loadMessages()]);
      setIsLoading(false);
    };
    if (orderId) init();
  }, [orderId, loadOrder, loadMessages]);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [activeTab, loadMessages]);

  useFocusEffect(
    useCallback(() => {
      if (orderId) {
        loadOrder();
        loadMessages();
      }
    }, [orderId, loadOrder, loadMessages])
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    const text = messageText.trim();
    const tempId = `temp_${Date.now()}`;

    const optimisticMessage: LocalMessage = {
      id: Date.now(),
      order_id: orderId,
      sender_id: String(user?.id),
      receiver_id: '',
      content: text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _status: 'sending',
      _tempId: tempId,
    };

    setMessageText('');
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    setIsSending(true);
    try {
      const response = await chatService.sendMessage(orderId, text);
      if (response.success) {
        setMessages(prev =>
          prev.map(m =>
            m._tempId === tempId
              ? { ...response.data, _status: 'sent' as const }
              : m
          )
        );
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m._tempId === tempId
            ? { ...m, _status: 'error' as const }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryMessage = async (tempId: string) => {
    const failedMsg = messages.find(m => m._tempId === tempId);
    if (!failedMsg) return;

    setMessages(prev =>
      prev.map(m =>
        m._tempId === tempId ? { ...m, _status: 'sending' as const } : m
      )
    );

    try {
      const response = await chatService.sendMessage(orderId, failedMsg.content);
      if (response.success) {
        setMessages(prev =>
          prev.map(m =>
            m._tempId === tempId
              ? { ...response.data, _status: 'sent' as const }
              : m
          )
        );
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m._tempId === tempId
            ? { ...m, _status: 'error' as const }
            : m
        )
      );
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      showError('Informe o motivo do cancelamento.');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await orderActionService.cancelOrder(orderId, cancelReason.trim());
      if (response.success) {
        setShowCancelModal(false);
        showSuccess('O pedido foi cancelado com sucesso.');
        navigation.popToTop();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Erro ao cancelar pedido.';
      showError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleProposeSchedule = async () => {
    if (selectedDate <= new Date()) {
      showError('Selecione uma data e horário futuros.');
      return;
    }

    setIsScheduling(true);
    try {
      const response = await orderActionService.proposeSchedule(orderId, selectedDate.toISOString());
      if (response.success) {
        setOrder(response.data);
        setShowDatePicker(false);
        setShowTimePicker(false);
        showSuccess('Aguardando confirmação da outra parte.');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Erro ao propor agendamento.';
      showError(msg);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleConfirmSchedule = async () => {
    setIsConfirming(true);
    try {
      const response = await orderActionService.confirmSchedule(orderId);
      if (response.success) {
        setOrder(response.data);
        showSuccess(response.message);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Erro ao confirmar agendamento.';
      showError(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!orderId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="error-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Pedido não encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <SkeletonBlock width={24} height={24} borderRadius={12} style={{ opacity: 0.4 }} />
          <View style={{ flex: 1, marginHorizontal: 12, gap: 6 }}>
            <SkeletonBlock width="60%" height={16} borderRadius={6} style={{ opacity: 0.4 }} />
            <SkeletonBlock width="40%" height={12} borderRadius={5} style={{ opacity: 0.3 }} />
          </View>
          <SkeletonBlock width={80} height={24} borderRadius={12} style={{ opacity: 0.3 }} />
        </View>
        <View style={styles.tabBar}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.tab}>
              <SkeletonBlock width={60} height={14} borderRadius={6} />
            </View>
          ))}
        </View>
        <View style={{ flex: 1, padding: 16, gap: 10, justifyContent: 'flex-end' }}>
          <SkeletonBlock width="55%" height={44} borderRadius={16} style={{ alignSelf: 'flex-start' }} />
          <SkeletonBlock width="65%" height={44} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
          <SkeletonBlock width="45%" height={44} borderRadius={16} style={{ alignSelf: 'flex-start' }} />
          <SkeletonBlock width="70%" height={60} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
          <SkeletonBlock width="50%" height={44} borderRadius={16} style={{ alignSelf: 'flex-start' }} />
          <SkeletonBlock width="60%" height={44} borderRadius={16} style={{ alignSelf: 'flex-end' }} />
        </View>
        <View style={[styles.chatInputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <SkeletonBlock width="82%" height={42} borderRadius={20} />
          <SkeletonBlock width={42} height={42} borderRadius={21} />
        </View>
      </View>
    );
  }

  if (order?.status === 'cancelled') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{order.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Icon name="cancel" size={64} color="#ef4444" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#ef4444', marginTop: 16 }}>Pedido Cancelado</Text>
          {order.cancel_reason && (
            <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Motivo: {order.cancel_reason}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const otherPartyName = isClient ? order?.provider?.name : order?.client?.name;
  const otherPartyAvatar = isClient
    ? (order?.provider as any)?.avatar_base64
    : (order?.client as any)?.avatar_base64;

  const scheduleConfirmedByMe = isClient
    ? order?.schedule_confirmed_by_client
    : order?.schedule_confirmed_by_provider;
  const scheduleConfirmedByOther = isClient
    ? order?.schedule_confirmed_by_provider
    : order?.schedule_confirmed_by_client;
  const bothConfirmed = order?.schedule_confirmed_by_client && order?.schedule_confirmed_by_provider;

  const formatScheduleDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: LocalMessage }) => {
    const isMe = String(item.sender_id) === String(user?.id);
    const isError = item._status === 'error';

    const iconColor = isMe ? 'rgba(255,255,255,0.75)' : '#9ca3af';
    const readColor = isMe ? '#c7d2fe' : '#6366f1';

    const renderStatusIcon = () => {
      const status = item._status || (item.read_at ? 'read' : 'sent');
      switch (status) {
        case 'sending':
          return <Clock size={13} color={iconColor} />;
        case 'error':
          return <AlertCircle size={13} color="#fca5a5" />;
        case 'read':
          return <CheckCheck size={13} color={readColor} />;
        case 'sent':
        default:
          return <Check size={13} color={iconColor} />;
      }
    };

    return (
      <View style={isError ? styles.errorMessageWrapper : undefined}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessage : styles.otherMessage,
          isError && styles.errorMessage,
        ]}>
          {!isMe && (
            <Text style={styles.messageSenderName}>{item.sender?.name || 'Usuário'}</Text>
          )}
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <View style={[styles.messageFooter, isMe ? styles.messageFooterMine : styles.messageFooterOther]}>
            <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
              {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && renderStatusIcon()}
          </View>
        </View>
        {isError && item._tempId && (
          <View style={styles.errorActions}>
            <Text style={styles.errorLabel}>Falha ao enviar</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => handleRetryMessage(item._tempId!)}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color="#4f46e5" />
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderChatTab = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => (item as LocalMessage)._tempId || item.id.toString()}
        renderItem={renderMessage}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Icon name="chat-bubble-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyChatText}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptyChatSubtext}>
              Inicie uma conversa com {isClient ? 'o prestador' : 'o cliente'}
            </Text>
          </View>
        }
      />
      <View style={[styles.chatInputContainer, { paddingBottom: 15 }]}>
        <TextInput
          style={styles.chatInput}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#9ca3af"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderScheduleTab = () => (
    <ScrollView style={styles.scheduleContainer} contentContainerStyle={{ padding: 20 }}>

      {order?.scheduled_date ? (
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Icon name="event" size={24} color={bothConfirmed ? '#10b981' : '#f59e0b'} />
            <Text style={[styles.scheduleTitle, { color: bothConfirmed ? '#10b981' : '#f59e0b' }]}>
              {bothConfirmed ? 'Agendamento Confirmado' : 'Agendamento Pendente'}
            </Text>
          </View>

          <View style={styles.scheduleDateBox}>
            <Icon name="schedule" size={20} color="#4f46e5" />
            <Text style={styles.scheduleDateText}>{formatScheduleDate(order.scheduled_date)}</Text>
          </View>

          <View style={styles.confirmationStatus}>
            <View style={styles.confirmRow}>
              <Icon name={order.schedule_confirmed_by_client ? 'check-circle' : 'radio-button-unchecked'}
                size={20} color={order.schedule_confirmed_by_client ? '#10b981' : '#d1d5db'} />
              <Text style={styles.confirmText}>Cliente {order.schedule_confirmed_by_client ? 'confirmou' : 'pendente'}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Icon name={order.schedule_confirmed_by_provider ? 'check-circle' : 'radio-button-unchecked'}
                size={20} color={order.schedule_confirmed_by_provider ? '#10b981' : '#d1d5db'} />
              <Text style={styles.confirmText}>Prestador {order.schedule_confirmed_by_provider ? 'confirmou' : 'pendente'}</Text>
            </View>
          </View>

          {!scheduleConfirmedByMe && (
            <TouchableOpacity
              style={styles.confirmScheduleBtn}
              onPress={handleConfirmSchedule}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#ffffff" />
                  <Text style={styles.confirmScheduleBtnText}>Confirmar Agendamento</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {bothConfirmed && (
            <View style={styles.reminderNote}>
              <Icon name="notifications-active" size={16} color="#6b7280" />
              <Text style={styles.reminderNoteText}>
                Você receberá lembretes 1 dia e 1 hora antes do serviço
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noScheduleCard}>
          <Icon name="event-available" size={48} color="#d1d5db" />
          <Text style={styles.noScheduleText}>Nenhum agendamento definido</Text>
          <Text style={styles.noScheduleSubtext}>
            Proponha uma data e horário para a realização do serviço
          </Text>
        </View>
      )}


      <View style={styles.proposeScheduleCard}>
        <Text style={styles.proposeTitle}>
          {order?.scheduled_date ? 'Propor Nova Data' : 'Agendar Serviço'}
        </Text>

        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
          <Icon name="calendar-today" size={20} color="#4f46e5" />
          <Text style={styles.datePickerBtnText}>
            {selectedDate > new Date()
              ? selectedDate.toLocaleDateString('pt-BR')
              : 'Selecionar data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
          <Icon name="access-time" size={20} color="#4f46e5" />
          <Text style={styles.datePickerBtnText}>
            {selectedDate > new Date()
              ? selectedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : 'Selecionar horário'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.proposeBtn, isScheduling && { opacity: 0.7 }]}
          onPress={handleProposeSchedule}
          disabled={isScheduling}
        >
          {isScheduling ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Icon name="event-note" size={20} color="#ffffff" />
              <Text style={styles.proposeBtnText}>Propor Agendamento</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" visible={showDatePicker}>
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerToolbar}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerToolbarCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerToolbarTitle}>Selecionar Data</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerToolbarDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  locale="pt-BR"
                  style={{ width: '100%' }}
                  onChange={(_, date) => {
                    if (date) {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setSelectedDate(newDate);
                    }
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setSelectedDate(newDate);
              }
            }}
          />
        )
      )}

      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" visible={showTimePicker}>
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerToolbar}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerToolbarCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerToolbarTitle}>Selecionar Horário</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerToolbarDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  locale="pt-BR"
                  style={{ width: '100%' }}
                  onChange={(_, date) => {
                    if (date) {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(date.getHours(), date.getMinutes());
                      setSelectedDate(newDate);
                    }
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) {
                const newDate = new Date(selectedDate);
                newDate.setHours(date.getHours(), date.getMinutes());
                setSelectedDate(newDate);
              }
            }}
          />
        )
      )}
    </ScrollView>
  );

  const renderInfoTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>

      <OrderTimeline
        apiStatus={(order?.status as any) || 'in_progress'}
        hasProposals={(order?.proposals?.length || 0) > 0}
        hasAcceptedProposal={!!order?.accepted_proposal_id}
        hasScheduledDate={!!order?.scheduled_date}
        bothScheduleConfirmed={!!(order?.schedule_confirmed_by_client && order?.schedule_confirmed_by_provider)}
        createdAt={order?.created_at}
      />

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{order?.title}</Text>
        <Text style={styles.infoCategory}>{order?.category}</Text>
        <Text style={styles.infoDescription}>{order?.description}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="attach-money" size={18} color="#10b981" />
            <Text style={styles.infoLabel}>Orçamento</Text>
            <Text style={styles.infoValue}>R$ {Number(order?.budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="schedule" size={18} color="#3b82f6" />
            <Text style={styles.infoLabel}>Prazo</Text>
            <Text style={styles.infoValue}>{order?.deadline} dias</Text>
          </View>
        </View>
      </View>


      <View style={styles.infoCard}>
        <Text style={styles.infoSectionTitle}>{isClient ? 'Prestador' : 'Cliente'}</Text>
        <View style={styles.partyRow}>
          {otherPartyAvatar ? (
            <Image source={{ uri: otherPartyAvatar }} style={styles.partyAvatar} />
          ) : (
            <View style={styles.partyAvatarPlaceholder}>
              <Icon name="person" size={24} color="#9ca3af" />
            </View>
          )}
          <Text style={styles.partyName}>{otherPartyName || 'Não disponível'}</Text>
        </View>
      </View>


      <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => setShowCancelModal(true)}>
        <Icon name="cancel" size={20} color="#ef4444" />
        <Text style={styles.cancelOrderBtnText}>Cancelar Pedido</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{order?.title || 'Pedido'}</Text>
          <Text style={styles.headerSubtitle}>{otherPartyName || ''}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Em andamento</Text>
        </View>
      </View>


      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Icon name="chat" size={20} color={activeTab === 'chat' ? '#4f46e5' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => setActiveTab('schedule')}
        >
          <Icon name="event" size={20} color={activeTab === 'schedule' ? '#4f46e5' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>Agendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Icon name="info" size={20} color={activeTab === 'info' ? '#4f46e5' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
        </TouchableOpacity>
      </View>


      {activeTab === 'chat' && renderChatTab()}
      {activeTab === 'schedule' && renderScheduleTab()}
      {activeTab === 'info' && renderInfoTab()}


      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Pedido</Text>
            <Text style={styles.modalSubtitle}>
              Informe o motivo do cancelamento. O {isClient ? 'prestador' : 'cliente'} será notificado.
            </Text>

            <TextInput
              style={styles.cancelInput}
              placeholder="Motivo do cancelamento..."
              placeholderTextColor="#9ca3af"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, isCancelling && { opacity: 0.7 }]}
                onPress={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirmar Cancelamento</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowCancelModal(false); setCancelReason(''); }}
              >
                <Text style={styles.modalCancelBtnText}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  backBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#4f46e5',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6,
  },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  activeTabText: { color: '#4f46e5', fontWeight: '600' },

  chatList: { flex: 1 },
  chatContent: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '80%', marginBottom: 8, borderRadius: 16, padding: 12 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#4f46e5', borderBottomRightRadius: 4 },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  errorMessage: { backgroundColor: '#4f46e5', opacity: 0.7 },
  errorMessageWrapper: { alignSelf: 'flex-end', maxWidth: '80%' },
  errorActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4, marginBottom: 8, paddingRight: 4 },
  errorLabel: { fontSize: 12, color: '#ef4444', fontWeight: '500' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  retryText: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
  messageSenderName: { fontSize: 12, fontWeight: '600', color: '#4f46e5', marginBottom: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#ffffff' },
  otherMessageText: { color: '#1f2937' },
  messageTime: { fontSize: 11, marginTop: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  otherMessageTime: { color: '#9ca3af' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  messageFooterMine: { justifyContent: 'flex-end' },
  messageFooterOther: { justifyContent: 'flex-start' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyChatText: { fontSize: 16, fontWeight: '600', color: '#9ca3af', marginTop: 12 },
  emptyChatSubtext: { fontSize: 14, color: '#d1d5db', marginTop: 4 },
  chatInputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingTop: 12, paddingHorizontal: 12,
    backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8,
  },
  chatInput: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, color: '#1f2937', maxHeight: 100,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#4f46e5',
    justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#c7d2fe' },

  scheduleContainer: { flex: 1 },
  scheduleCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 20,
    marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  scheduleTitle: { fontSize: 18, fontWeight: '700' },
  scheduleDateBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#eef2ff', borderRadius: 8, padding: 12, marginBottom: 16,
  },
  scheduleDateText: { fontSize: 16, fontWeight: '600', color: '#4f46e5' },
  confirmationStatus: { gap: 8, marginBottom: 16 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmText: { fontSize: 14, color: '#4b5563' },
  confirmScheduleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 14,
  },
  confirmScheduleBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  reminderNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  reminderNoteText: { fontSize: 12, color: '#6b7280', flex: 1 },
  noScheduleCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 32,
    alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  noScheduleText: { fontSize: 16, fontWeight: '600', color: '#9ca3af', marginTop: 12 },
  noScheduleSubtext: { fontSize: 14, color: '#d1d5db', marginTop: 4, textAlign: 'center' },
  proposeScheduleCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  proposeTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f3f4f6', borderRadius: 10, padding: 14, marginBottom: 12,
  },
  datePickerBtnText: { fontSize: 15, color: '#4b5563' },
  proposeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 14, marginTop: 4,
  },
  proposeBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  infoTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  infoCategory: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 12 },
  infoDescription: { fontSize: 15, color: '#374151', lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  infoItem: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  infoLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  infoSectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partyAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb' },
  partyAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },
  partyName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cancelOrderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, paddingVertical: 14, marginTop: 8,
  },
  cancelOrderBtnText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },

  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerToolbarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  pickerToolbarCancel: {
    fontSize: 15,
    color: '#6b7280',
  },
  pickerToolbarDone: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4f46e5',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  cancelInput: {
    backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16,
    fontSize: 15, color: '#1f2937', textAlignVertical: 'top', minHeight: 100,
  },
  modalActions: { flexDirection: 'column', gap: 10, marginTop: 20 },
  modalCancelBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
  },
  modalCancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  modalConfirmBtn: {
    alignItems: 'center', paddingVertical: 16,
    borderRadius: 10, backgroundColor: '#ef4444',
  },
  modalConfirmBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
