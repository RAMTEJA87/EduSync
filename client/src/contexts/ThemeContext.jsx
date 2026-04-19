import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // 1. Initialize state directly from localStorage or default to 'system'
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system';
        }
        return 'system';
    });

    const [isDarkMode, setIsDarkMode] = useState(false);

    // 2. Create a robust setter that updates localStorage immediately
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // 3. Centralized effect to apply theme changes and listen for system preference
    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let darkMode = false;
            
            if (theme === 'dark') {
                darkMode = true;
            } else if (theme === 'light') {
                darkMode = false;
            } else { // system
                darkMode = mediaQuery.matches;
            }

            if (darkMode) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            
            setIsDarkMode(darkMode);
        };

        // Apply immediately
        applyTheme();

        // Listen for system theme changes
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                applyTheme();
            }
        };

        // Add event listener (supports older and newer browsers)
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
        } else {
            mediaQuery.addListener(handleSystemThemeChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleSystemThemeChange);
            } else {
                mediaQuery.removeListener(handleSystemThemeChange);
            }
        };
    }, [theme]);
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
