import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('nutricare_dark') === 'true';
  });
  
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('nutricare_contrast') === 'true';
  });

  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem('nutricare_largetext') === 'true';
  });

  // Apply dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nutricare_dark', darkMode);
  }, [darkMode]);

  // Apply high contrast
  useEffect(() => {
    const root = window.document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('nutricare_contrast', highContrast);
  }, [highContrast]);

  // Apply large text
  useEffect(() => {
    const root = window.document.documentElement;
    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    localStorage.setItem('nutricare_largetext', largeText);
  }, [largeText]);

  return (
    <ThemeContext.Provider value={{ 
      darkMode, setDarkMode, 
      highContrast, setHighContrast, 
      largeText, setLargeText 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
