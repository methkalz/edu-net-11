import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PDFComparisonThresholds {
  internal_display: number;
  repository_display: number;
  single_file_display: number;
  flagged_threshold: number;
  warning_threshold: number;
}

export interface AlgorithmWeights {
  cosine_weight: number;
  jaccard_weight: number;
  length_weight: number;
  fuzzy_weight?: number;
  sequence_weight?: number;
  structural_weight?: number;
}

export interface PDFComparisonSettings {
  id: string;
  setting_name: string;
  thresholds: PDFComparisonThresholds;
  algorithm_weights: AlgorithmWeights;
  custom_whitelist: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePDFComparisonSettings = () => {
  const [settings, setSettings] = useState<PDFComparisonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pdf_comparison_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      // Type cast the data since we know the structure
      setSettings(data as unknown as PDFComparisonSettings);
    } catch (error) {
      console.error('Error fetching PDF comparison settings:', error);
      toast({
        title: 'خطأ في جلب الإعدادات',
        description: 'حدث خطأ أثناء جلب إعدادات المقارنة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (
    updates: Partial<Omit<PDFComparisonSettings, 'id' | 'setting_name' | 'created_at' | 'updated_at'>>
  ) => {
    if (!settings) return;

    try {
      const { data, error } = await supabase
        .from('pdf_comparison_settings')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        } as any)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      // انتظار 2 ثانية لضمان مسح الـ cache في edge functions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // إعادة جلب الإعدادات لتأكيد التطبيق
      await fetchSettings();

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث إعدادات المقارنة بنجاح',
      });
      return data as unknown as PDFComparisonSettings;
    } catch (error) {
      console.error('Error updating PDF comparison settings:', error);
      toast({
        title: 'خطأ في التحديث',
        description: 'حدث خطأ أثناء تحديث الإعدادات',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addWhitelistWord = async (word: string) => {
    if (!settings || !word.trim()) return;

    const trimmedWord = word.trim();
    if (settings.custom_whitelist.includes(trimmedWord)) {
      toast({
        title: 'الكلمة موجودة مسبقاً',
        description: 'هذه الكلمة موجودة في القائمة البيضاء',
        variant: 'destructive',
      });
      return;
    }

    return updateSettings({
      custom_whitelist: [...settings.custom_whitelist, trimmedWord],
    });
  };

  const removeWhitelistWord = async (word: string) => {
    if (!settings) return;

    return updateSettings({
      custom_whitelist: settings.custom_whitelist.filter((w) => w !== word),
    });
  };

  const applyPreset = async (preset: 'strict' | 'balanced' | 'lenient') => {
    const presets = {
      strict: {
        thresholds: {
          internal_display: 0,
          repository_display: 50,
          single_file_display: 40,
          flagged_threshold: 60,
          warning_threshold: 30,
        },
        algorithm_weights: {
          cosine_weight: 0.6,
          jaccard_weight: 0.35,
          length_weight: 0.05,
        },
      },
      balanced: {
        thresholds: {
          internal_display: 0,
          repository_display: 35,
          single_file_display: 30,
          flagged_threshold: 70,
          warning_threshold: 40,
        },
        algorithm_weights: {
          cosine_weight: 0.5,
          jaccard_weight: 0.4,
          length_weight: 0.1,
        },
      },
      lenient: {
        thresholds: {
          internal_display: 0,
          repository_display: 25,
          single_file_display: 20,
          flagged_threshold: 80,
          warning_threshold: 50,
        },
        algorithm_weights: {
          cosine_weight: 0.4,
          jaccard_weight: 0.45,
          length_weight: 0.15,
        },
      },
    };

    return updateSettings(presets[preset]);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings,
    addWhitelistWord,
    removeWhitelistWord,
    applyPreset,
  };
};
