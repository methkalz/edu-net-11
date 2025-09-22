import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export const useSiteSettings = () => {
  useEffect(() => {
    // تطبيق إعدادات الموقع المحفوظة عند تحميل الصفحة
    const applySiteSettings = () => {
      try {
        const siteSettings = localStorage.getItem('site_settings');
        if (siteSettings) {
          const settings = JSON.parse(siteSettings);
          
          // تحديث عنوان الصفحة
          if (settings.site_title) {
            document.title = settings.site_title;
          }
          
          // تحديث الوصف
          if (settings.site_description) {
            const descriptionMeta = document.querySelector('meta[name="description"]');
            if (descriptionMeta) {
              descriptionMeta.setAttribute('content', settings.site_description);
            }
          }
          
          // تحديث الفافيكون
          if (settings.favicon_url) {
            let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.rel = 'icon';
              document.head.appendChild(faviconLink);
            }
            faviconLink.href = settings.favicon_url;
            faviconLink.type = 'image/png';
          }
          
          // تحديث اتجاه الصفحة واللغة
          if (settings.language) {
            document.documentElement.lang = settings.language;
            document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
          }
        }

        // تطبيق إعدادات الفوتر
        const footerSettings = localStorage.getItem('footer_settings');
        if (footerSettings) {
          const settings = JSON.parse(footerSettings);
          // إعدادات الفوتر ستطبق بواسطة مكون AppFooter مباشرة
          logger.debug('Footer settings loaded', { settings });
        }
      } catch (error) {
        logger.error('Error applying site settings', error as Error);
      }
    };

    applySiteSettings();
  }, []);
};

export default useSiteSettings;