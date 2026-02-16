import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from '../components/Toast';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextData {
  showToast: (config: ToastConfig) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(4000);

  const showToast = ({ message, type, duration = 4000 }: ToastConfig) => {
    setMessage(message);
    setType(type);
    setDuration(duration);
    setVisible(true);
  };

  const showSuccess = (message: string, duration = 4000) => {
    showToast({ message, type: 'success', duration });
  };

  const showError = (message: string, duration = 4000) => {
    showToast({ message, type: 'error', duration });
  };

  const showWarning = (message: string, duration = 4000) => {
    showToast({ message, type: 'warning', duration });
  };

  const showInfo = (message: string, duration = 4000) => {
    showToast({ message, type: 'info', duration });
  };

  const handleHide = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Toast
        message={message}
        type={type}
        visible={visible}
        onHide={handleHide}
        duration={duration}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
