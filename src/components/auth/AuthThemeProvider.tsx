import React, { useEffect } from 'react';

interface AuthThemeProviderProps {
  children: React.ReactNode;
}

/**
 * AuthThemeProvider Component
 * 
 * Forces light theme for authentication pages
 * Prevents dark mode from affecting login/auth screens
 */
export const AuthThemeProvider: React.FC<AuthThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    // Force light theme for auth pages
    const htmlElement = document.documentElement;
    const originalClass = htmlElement.className;
    
    // Remove dark class and add light-only class
    htmlElement.classList.remove('dark');
    htmlElement.classList.add('auth-light-only');
    
    // Cleanup function to restore original theme when leaving auth page
    return () => {
      htmlElement.classList.remove('auth-light-only');
      // Don't restore dark mode here - let ThemeProvider handle it
    };
  }, []);

  return (
    <div className="auth-container">
      {children}
    </div>
  );
};