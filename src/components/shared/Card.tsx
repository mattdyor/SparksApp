import React from 'react';
import styled from 'styled-components/native';
import { ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

// Inline theme values to avoid module-level imports that can fail in release builds
const THEME_VALUES = {
  surface: '#ffffff',
  borderRadius: 8,
  spacing: { sm: 8, md: 16, lg: 24 },
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.22,
  shadowRadius: 2,
  elevation: 2,
};

const StyledCard = styled.View<{ padding: string; shadow: boolean }>`
  background-color: ${THEME_VALUES.surface};
  border-radius: ${THEME_VALUES.borderRadius}px;
  ${({ padding }) => {
    const paddingMap: Record<string, number> = { sm: THEME_VALUES.spacing.sm, md: THEME_VALUES.spacing.md, lg: THEME_VALUES.spacing.lg };
    const paddingValue = paddingMap[padding] || THEME_VALUES.spacing.md;
    return `padding: ${paddingValue}px;`;
  }}
  ${({ shadow }) => shadow && `
    shadow-color: ${THEME_VALUES.shadowColor};
    shadow-offset: ${THEME_VALUES.shadowOffset.width}px ${THEME_VALUES.shadowOffset.height}px;
    shadow-opacity: ${THEME_VALUES.shadowOpacity};
    shadow-radius: ${THEME_VALUES.shadowRadius}px;
    elevation: ${THEME_VALUES.elevation};
  `}
`;

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = true,
  ...props
}) => {
  return (
    <StyledCard padding={padding} shadow={shadow} {...props}>
      {children}
    </StyledCard>
  );
};