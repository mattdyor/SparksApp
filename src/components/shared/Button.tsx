import React from 'react';
import styled from 'styled-components/native';
import { TouchableOpacityProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// Inline theme values to avoid module-level imports that can fail in release builds
const THEME_VALUES = {
  primary: '#007AFF',
  secondary: '#5856D6',
  borderRadius: 8,
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.22,
  shadowRadius: 2,
  elevation: 2,
};

const getButtonStyles = (variant: ButtonVariant, size: ButtonSize) => {
  const variants = {
    primary: {
      backgroundColor: THEME_VALUES.primary,
      borderColor: THEME_VALUES.primary,
      textColor: '#ffffff',
    },
    secondary: {
      backgroundColor: THEME_VALUES.secondary,
      borderColor: THEME_VALUES.secondary,
      textColor: '#ffffff',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: THEME_VALUES.primary,
      textColor: THEME_VALUES.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: THEME_VALUES.primary,
    },
  };

  const sizes = {
    small: {
      paddingVertical: THEME_VALUES.spacing.sm,
      paddingHorizontal: THEME_VALUES.spacing.md,
      fontSize: 14,
    },
    medium: {
      paddingVertical: THEME_VALUES.spacing.md,
      paddingHorizontal: THEME_VALUES.spacing.lg,
      fontSize: 16,
    },
    large: {
      paddingVertical: THEME_VALUES.spacing.lg,
      paddingHorizontal: THEME_VALUES.spacing.xl,
      fontSize: 18,
    },
  };

  return {
    ...variants[variant],
    ...sizes[size],
  };
};

const StyledButton = styled.TouchableOpacity<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth: boolean;
}>`
  ${({ variant, size }) => {
    const styles = getButtonStyles(variant, size);
    return `
      background-color: ${styles.backgroundColor};
      border-color: ${styles.borderColor};
      padding-vertical: ${styles.paddingVertical}px;
      padding-horizontal: ${styles.paddingHorizontal}px;
    `;
  }}
  border-width: 1px;
  border-radius: ${THEME_VALUES.borderRadius}px;
  align-items: center;
  justify-content: center;
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  shadow-color: ${THEME_VALUES.shadowColor};
  shadow-offset: ${THEME_VALUES.shadowOffset.width}px ${THEME_VALUES.shadowOffset.height}px;
  shadow-opacity: ${THEME_VALUES.shadowOpacity};
  shadow-radius: ${THEME_VALUES.shadowRadius}px;
  elevation: ${THEME_VALUES.elevation};
`;

const ButtonText = styled.Text<{ variant: ButtonVariant; size: ButtonSize }>`
  ${({ variant, size }) => {
    const styles = getButtonStyles(variant, size);
    return `
      color: ${styles.textColor};
      font-size: ${styles.fontSize}px;
    `;
  }}
  font-weight: 600;
  text-align: center;
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      {...props}
    >
      <ButtonText variant={variant} size={size}>
        {children}
      </ButtonText>
    </StyledButton>
  );
};