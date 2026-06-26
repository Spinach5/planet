import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: (_options: ToastOptions) => {
    // Default no-op, replaced by ToastProvider
  },
});

/**
 * Hook to show toast/snackbar messages.
 * Replaces Taro's Taro.showToast().
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast({ message: '操作成功', type: 'success' });
 */
export function useToast() {
  return useContext(ToastContext);
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#2e7d32',
  error: '#d32f2f',
  info: '#0288d1',
  warning: '#ed6c02',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [toastColor, setToastColor] = useState(TOAST_COLORS.info);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(({ message: msg, type = 'info', duration = 2000 }: ToastOptions) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setMessage(msg);
    setToastColor(TOAST_COLORS[type]);
    setVisible(true);

    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, duration);
  }, []);

  const topOffset = Platform.OS === 'ios' ? insets.top + 8 : (insets.top || 24) + 8;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={2000}
        style={[styles.snackbar, { backgroundColor: toastColor, top: topOffset }]}
        theme={{ colors: { inverseSurface: '#ffffff', inverseOnSurface: '#ffffff' } }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    borderRadius: 8,
    zIndex: 9999,
  },
});
