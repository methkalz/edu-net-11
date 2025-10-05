import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ZohoCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const location = params.get('location');
        const error = params.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          toast.error('فشل الاتصال بـ Zoho Writer');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!code || !location) {
          console.error('Missing code or location');
          setStatus('error');
          toast.error('بيانات غير صحيحة');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          setStatus('error');
          toast.error('يجب تسجيل الدخول أولاً');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        // Call edge function to exchange code for tokens
        const response = await supabase.functions.invoke('zoho-oauth-callback', {
          body: {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: 'GET',
        });

        // Manually construct the callback URL with parameters
        const callbackUrl = `${window.location.origin}/zoho-oauth-callback?code=${code}&state=${state}&location=${encodeURIComponent(location)}`;
        
        const directResponse = await fetch(callbackUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!directResponse.ok) {
          const errorData = await directResponse.json();
          console.error('Callback failed:', errorData);
          setStatus('error');
          toast.error('فشل حفظ بيانات الاتصال');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        setStatus('success');
        toast.success('تم الاتصال بـ Zoho Writer بنجاح!');
        setTimeout(() => navigate('/'), 2000);

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        toast.error('حدث خطأ أثناء الاتصال');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-2xl font-bold">جاري الاتصال بـ Zoho Writer...</h2>
            <p className="text-muted-foreground">الرجاء الانتظار</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">تم الاتصال بنجاح!</h2>
            <p className="text-muted-foreground">سيتم تحويلك تلقائياً...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">فشل الاتصال</h2>
            <p className="text-muted-foreground">سيتم تحويلك للصفحة الرئيسية...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ZohoCallback;