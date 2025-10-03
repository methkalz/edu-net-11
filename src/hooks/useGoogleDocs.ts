import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface CopyTemplateParams {
  templateId: string;
  newTitle: string;
  studentName?: string;
  studentId?: string;
}

export const useGoogleDocs = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const copyTemplate = async (params: CopyTemplateParams) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-doc', {
        body: params,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "تم نسخ القالب بنجاح! ✅",
          description: `المستند: ${data.title}`,
        });
        return data;
      } else {
        throw new Error(data.error || 'فشل نسخ القالب');
      }
    } catch (err: any) {
      console.error('Copy template error:', err);
      toast({
        title: "خطأ في نسخ القالب",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    copyTemplate,
    loading,
  };
};
