import { useEffect, useState } from 'react';

/**
 * مركز إدارة الثيم (المظهر الفاتح/الداكن)
 * يطبق الثيم تلقائيًا على كامل التطبيق عبر CSS Variables
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // قراءة من localStorage أو تفضيلات النظام
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    // استخدام تفضيل النظام كـ fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // إزالة الثيم القديم
    root.removeAttribute('data-theme');
    root.classList.remove('light', 'dark');
    
    // تطبيق الثيم الجديد على كلا النظامين (class & data-theme)
    root.setAttribute('data-theme', theme);
    root.classList.add(theme);
    
    // حفظ في localStorage للاستمرارية
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { 
    theme, 
    toggleTheme, 
    isDarkMode: theme === 'dark',
    setTheme 
  };
};
