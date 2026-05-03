import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  suffix?: string;       // e.g. 'kg', 'cm', 'years'
  error?: string;
}

export function Input({ label, suffix, error, ...textInputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <TextInput
          {...textInputProps}
          placeholderTextColor={Colors.textDim}
          style={styles.input}
          selectionColor={Colors.primary}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: {
    ...Typography.micro,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  fieldError: { borderColor: Colors.danger },
  input: {
    flex: 1,
    color: Colors.text,
    ...Typography.h2,
    fontWeight: '500',
  },
  suffix: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
