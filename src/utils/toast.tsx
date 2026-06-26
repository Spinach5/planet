import { createContext, useContext, useState, useCallback, useRef, type ReactNode, useEffect, useMemo } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
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
  const [message, setMessage] = useState('');
  const [toastColor, setToastColor] = useState(TOAST_COLORS.info);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const translateY = useMemo(() => new Animated.Value(-20), []);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(({ message: msg, type = 'info', duration = 2000 }: ToastOptions) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setMessage(msg);
    setToastColor(TOAST_COLORS[type]);

    // Animate in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, duration);
  }, [opacity, translateY]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const topOffset = Math.max(insets.top, 15) + 8;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          st.toast,
          {
            backgroundColor: toastColor,
            top: topOffset,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={st.text}>{message}</Text>
      </Animated.View>
    </ToastContext.Provider>
  );
}

const st = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
