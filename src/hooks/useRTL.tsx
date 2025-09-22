import { useEffect } from 'react';

export const useRTL = () => {
  useEffect(() => {
    // إضافة اتجاه RTL للجسم الرئيسي
    document.body.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    
    // إضافة فئات CSS لتحسين اتجاه النص
    document.body.classList.add('arabic-text');
    
    return () => {
      // تنظيف عند إلغاء التحميل
      document.body.removeAttribute('dir');
      document.documentElement.removeAttribute('lang');
      document.body.classList.remove('arabic-text');
    };
  }, []);
};