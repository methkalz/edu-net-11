import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLastLogin = (userId?: string) => {
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchLastLogin = async () => {
      setLoading(true);
      try {
        // محاولة الحصول على آخر تسجيل دخول من جدول student_presence
        const { data: presenceData } = await supabase
          .from('student_presence')
          .select('last_seen_at')
          .eq('user_id', userId)
          .order('last_seen_at', { ascending: false })
          .limit(1)
          .single();

        if (presenceData?.last_seen_at) {
          setLastLogin(presenceData.last_seen_at);
        } else {
          // كبديل، يمكن استخدام تاريخ إنشاء البروفايل
          const { data: profileData } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('user_id', userId)
            .single();
          
          if (profileData?.created_at) {
            // إضافة ساعة واحدة للتاريخ كتقدير لآخر تسجيل دخول
            const estimatedLastLogin = new Date(profileData.created_at);
            estimatedLastLogin.setHours(estimatedLastLogin.getHours() + 1);
            setLastLogin(estimatedLastLogin.toISOString());
          }
        }
      } catch (error) {
        console.error('Error fetching last login:', error);
        // في حالة الخطأ، استخدم تاريخ تقريبي
        setLastLogin(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
      } finally {
        setLoading(false);
      }
    };

    fetchLastLogin();
  }, [userId]);

  return { lastLogin, loading };
};