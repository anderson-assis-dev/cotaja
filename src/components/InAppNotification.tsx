import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, DeviceEventEmitter,
} from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationRef } from '../navigation/navigationRef';
import { useAuth } from '../contexts/AuthContext';

export interface InAppNotificationData {
  title: string;
  message: string;
  type?: string;
  order_id?: number;
}

export const IN_APP_NOTIFICATION_EVENT = 'in_app_notification';

const InAppNotification: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<InAppNotificationData | null>(null);
  const translateY = useRef(new Animated.Value(-140)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNotifRef = useRef<InAppNotificationData | null>(null);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(translateY, {
      toValue: -140,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
      currentNotifRef.current = null;
    });
  }, [translateY]);

  const show = useCallback((data: InAppNotificationData) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    currentNotifRef.current = data;
    setNotification(data);
    translateY.setValue(-140);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    timerRef.current = setTimeout(dismiss, 4500);
  }, [translateY, dismiss]);

  const handleTap = useCallback(() => {
    const notif = currentNotifRef.current;
    dismiss();
    if (notif?.type === 'chat_message' && notif?.order_id) {
      const orderId = notif.order_id;
      if (!navigationRef.isReady()) return;
      try {
        if (user?.profile_type === 'provider') {
          (navigationRef as any).navigate('Provider', {
            screen: 'MyServicesTab',
            params: { screen: 'AcceptedOrder', params: { orderId }, initial: false },
          });
        } else {
          (navigationRef as any).navigate('Client', {
            screen: 'MyOrdersTab',
            params: { screen: 'AcceptedOrder', params: { orderId }, initial: false },
          });
        }
      } catch (e) {
        console.log('[InAppNotification] Erro ao navegar:', e);
      }
    }
  }, [dismiss, user]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(IN_APP_NOTIFICATION_EVENT, show);
    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Animated.View
        pointerEvents={notification ? 'box-none' : 'none'}
        style={[
          styles.bannerWrapper,
          { top: insets.top + 8, transform: [{ translateY }] },
        ]}
      >
        <TouchableOpacity
          style={styles.banner}
          onPress={handleTap}
          activeOpacity={0.9}
        >
          <View style={styles.iconBox}>
            <MessageSquare size={18} color="#ffffff" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.title} numberOfLines={1}>
              {notification?.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification?.message}
            </Text>
          </View>
          <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
  },
  closeBtn: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    paddingLeft: 4,
  },
});

export default InAppNotification;
