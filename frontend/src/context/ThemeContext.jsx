import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark' });

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Lock dark mode — always
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
