import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeState {
  isDarkMode: boolean;
}

interface ThemeContextType {
  theme: ThemeState;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>({ isDarkMode: false });
  
  const toggleDarkMode = () => {
    setTheme(prev => ({ isDarkMode: !prev.isDarkMode }));
  };
  
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme({ isDarkMode: prefersDark });
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem('theme', JSON.stringify(theme));
      
      if (theme.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};