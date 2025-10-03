import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useGoogleDocs = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createDocument = async (title: string, content?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-doc', {
        body: { title, content },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "تم إنشاء المستند بنجاح! ✅",
          description: `المستند: ${data.title}`,
        });
        return data;
      } else {
        throw new Error(data.error || 'فشل إنشاء المستند');
      }
    } catch (err: any) {
      console.error('Create document error:', err);
      toast({
        title: "خطأ في إنشاء المستند",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDocument,
    loading,
  };
};
