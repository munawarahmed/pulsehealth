import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

export type ToastVariant = 'success' | 'info' | 'warn';

interface ToastItem {
  id: number;
  message: string;
  hint?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, opts?: { hint?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, opts?: { hint?: string; variant?: ToastVariant }) => {
    const next: ToastItem = {
      id: ++counter,
      message,
      hint: opts?.hint,
      variant: opts?.variant ?? 'success',
    };
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setItem(next);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    dismissTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start(() => setItem(null));
    }, 2500);
  }, [opacity, translateY]);

  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {item && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.toast, variantStyles[item.variant]]}>
            <Text style={styles.message}>{item.message}</Text>
            {item.hint && <Text style={styles.hint}>{item.hint}</Text>}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const variantStyles = StyleSheet.create({
  success: { borderColor: Colors.primary },
  info:    { borderColor: Colors.data },
  warn:    { borderColor: Colors.warn },
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  toast: {
    minWidth: 240,
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  message: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  hint: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
});
