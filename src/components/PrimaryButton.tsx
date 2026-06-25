import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /**
   * `primary`: CTA rojo coral (alto, con sombra roja). `secondary`: acción suave
   * tipo "Ya tengo cuenta" (transparente, texto gris). `danger`: acción
   * destructiva (rojo error).
   */
  variant?: Variant;
  /** Mantengo `outline` como alias de `secondary` por compatibilidad. */
  icon?: string;
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  style,
}: Props) {
  const isSecondary = variant === 'secondary';

  if (isSecondary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        hitSlop={8}
        style={({ pressed }) => [
          styles.secondary,
          { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <Text style={styles.secondaryText}>
            {icon ? `${icon}  ` : ''}
            {title}
          </Text>
        )}
      </Pressable>
    );
  }

  const isDanger = variant === 'danger';
  const bg = disabled ? colors.primaryDisabled : isDanger ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        // La sombra roja solo tiene sentido sobre el rojo y cuando está activo.
        !disabled && shadows.button,
        { backgroundColor: bg, opacity: pressed && !disabled ? 0.9 : 1 },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={styles.text}>
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: spacing.buttonHeight,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.buttonPaddingH,
  },
  pressed: { transform: [{ scale: 0.99 }] },
  text: {
    ...typography.button,
    color: colors.onPrimary,
  },
  secondary: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.buttonPaddingH,
  },
  secondaryText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
