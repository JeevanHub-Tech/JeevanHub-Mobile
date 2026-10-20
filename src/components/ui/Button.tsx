// src/components/ui/Button.tsx
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Shadows } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  ...props
}) => {
  const isActionDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isActionDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        variant === 'primary' && Shadows.button,
        isActionDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.cream : Colors.olive}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_size_${size}`],
            isActionDisabled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.oliveAction,
  },
  secondary: {
    backgroundColor: Colors.sagePale,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.olive,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  size_lg: {
    paddingVertical: 18,
    paddingHorizontal: 28,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text_primary: {
    color: Colors.cream,
  },
  text_secondary: {
    color: Colors.oliveDeep,
  },
  text_outline: {
    color: Colors.olive,
  },
  text_danger: {
    color: Colors.surface,
  },
  text_size_sm: {
    fontSize: 13,
  },
  text_size_md: {
    fontSize: 15,
  },
  text_size_lg: {
    fontSize: 17,
  },
  textDisabled: {
    opacity: 0.8,
  },
});
