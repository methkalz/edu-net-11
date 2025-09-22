import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from '@/lib/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error('خطأ 404: محاولة الوصول إلى صفحة غير موجودة', undefined, {
      route: location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      <div className="text-center space-y-6">
        <div className="relative">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-xl -z-10"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">عذراً! الصفحة غير موجودة</h2>
          <p className="text-lg text-muted-foreground">لم نتمكن من العثور على الصفحة التي تبحث عنها</p>
        </div>
        <div className="flex gap-4 justify-center">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            العودة إلى الصفحة الرئيسية
          </a>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
          >
            العودة للخلف
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
