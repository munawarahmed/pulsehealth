import React, { useRef } from 'react';
import {
  Pressable, Text, StyleSheet, ActivityIndicator, View, Animated, Platform,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Press-scale micro-animation: 1.0 → 0.97 on press-in, ease back on release.
 * Skips native driver on web (Animated has limited transform support there
 * but easing in JS still looks correct on the OLED-dark surfaces).
 */
export function Button({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const isPrimary = variant === 'primary';
  const isInactive = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;
  const useNative = Platform.OS !== 'web';

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: useNative,
      speed: 40,
      bounciness: 0,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: useNative,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isInactive}
        style={[
          styles.base,
          isPrimary ? styles.primary : styles.ghost,
          isInactive && styles.disabled,
        ]}
      >
        <View style={styles.row}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={isPrimary ? Colors.bg : Colors.primary}
              style={{ marginRight: Spacing.sm }}
            />
          )}
          <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primary: { backgroundColor: Colors.primary },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { ...Typography.h2 },
  labelPrimary: { color: Colors.bg },
  labelGhost: { color: Colors.text },
});
