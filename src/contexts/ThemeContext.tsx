import React, { createContext, useContext, ReactNode } from 'react';
import { useSettingsStore, ThemeColors } from '../store/settingsStore';

// Re-export ThemeColors for use in other files
export type { ThemeColors };

interface ThemeContextType {
  colors: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

// Default theme colors - used as fallback if store isn't ready
const defaultLightTheme = {
  primary: '#007AFF',
  secondary: '#007AFF',
  background: '#ffffff',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
} as ThemeColors;

const defaultDarkTheme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  border: '#38383A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',
} as ThemeColors;

// Provide a default context value to prevent crashes during initialization
const defaultContextValue: ThemeContextType = {
  colors: defaultLightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Start with safe defaults - don't access store during initial render
  const [themeColors, setThemeColors] = React.useState<ThemeColors>(defaultLightTheme);
  const [currentDarkMode, setCurrentDarkMode] = React.useState(false);
  const [storeReady, setStoreReady] = React.useState(false);

  // Initialize store access after mount - this prevents issues in release builds
  React.useEffect(() => {
    let store: ReturnType<typeof useSettingsStore> | null = null;
    let darkMode = false;
    let getThemeColors = () => defaultLightTheme;
    
    try {
      store = useSettingsStore();
      if (store) {
        darkMode = store.darkMode ?? false;
        getThemeColors = store.getThemeColors ?? (() => defaultLightTheme);
        
        // Update state with store values
        setCurrentDarkMode(darkMode);
        try {
          const colors = getThemeColors();
          if (colors && typeof colors === 'object' && colors.primary) {
            setThemeColors(colors);
          }
        } catch (error) {
          console.warn('ThemeProvider: getThemeColors failed, using default', error);
          setThemeColors(darkMode ? defaultDarkTheme : defaultLightTheme);
        }
        setStoreReady(true);
      }
    } catch (error) {
      // Store not ready - keep defaults
      console.warn('ThemeProvider: Store hook failed, using defaults', error);
      setStoreReady(false);
    }
  }, []);

  // Subscribe to store changes for dark mode - only after store is ready
  React.useEffect(() => {
    if (!storeReady) return;
    
    try {
      const unsubscribe = useSettingsStore.subscribe(
        (state) => {
          try {
            const newDarkMode = state?.darkMode ?? false;
            setCurrentDarkMode(newDarkMode);
            const colors = state?.getThemeColors?.();
            if (colors && typeof colors === 'object' && colors.primary) {
              setThemeColors(colors);
            } else {
              setThemeColors(newDarkMode ? defaultDarkTheme : defaultLightTheme);
            }
          } catch (error) {
            console.warn('ThemeProvider: Store subscription error', error);
          }
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn('ThemeProvider: Failed to subscribe to store', error);
    }
  }, [storeReady]);

  const toggleTheme = React.useCallback(() => {
    try {
      const store = useSettingsStore.getState();
      if (store?.toggleDarkMode) {
        store.toggleDarkMode();
      }
    } catch (error) {
      console.warn('ThemeProvider: toggleTheme failed', error);
    }
  }, []);
  
  const contextValue: ThemeContextType = {
    colors: themeColors,
    isDarkMode: currentDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined || !context || !context.colors) {
    // Return default theme if context isn't ready yet (can happen in release builds during initialization)
    console.warn('useTheme: Context not ready, returning default theme');
    return {
      colors: defaultLightTheme,
      isDarkMode: false,
      toggleTheme: () => {},
    };
  }
  return context;
};