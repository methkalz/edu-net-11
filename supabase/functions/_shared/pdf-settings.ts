import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cache للإعدادات (صالح لمدة دقيقة)
let settingsCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 دقيقة

// القيم الافتراضية (balanced preset)
const DEFAULT_SETTINGS = {
  thresholds: {
    single_file_display: 0.20,    // 20% - عرض نتائج الملف المفرد
    repository_display: 0.35,     // 35% - عرض نتائج المستودع
    internal_display: 0.00,       // 0% - عرض جميع المقارنات الداخلية
    flagged_threshold: 0.70,      // 70% - حالة flagged
    warning_threshold: 0.50       // 50% - حالة warning
  },
  algorithm_weights: {
    cosine_weight: 0.50,          // 50% - وزن التشابه النصي (cosine)
    jaccard_weight: 0.40,         // 40% - وزن تطابق الكلمات (jaccard)
    length_weight: 0.10           // 10% - وزن التشابه في الطول
  },
  custom_whitelist: [] as string[]
};

export async function getPDFComparisonSettings(supabase: SupabaseClient) {
  try {
    // فحص الـ cache
    const now = Date.now();
    if (settingsCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('✅ Using cached settings');
      return settingsCache;
    }

    // جلب الإعدادات من قاعدة البيانات
    console.log('🔄 Fetching settings from database...');
    const { data, error } = await supabase
      .from('pdf_comparison_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn('⚠️ Failed to fetch settings, using defaults:', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      console.warn('⚠️ No active settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    // تحويل القيم من integers (0-100) إلى floats (0.0-1.0)
    const normalizedSettings = {
      thresholds: {
        single_file_display: (data.thresholds?.single_file_display ?? 20) / 100,
        repository_display: (data.thresholds?.repository_display ?? 35) / 100,
        internal_display: (data.thresholds?.internal_display ?? 0) / 100,
        flagged_threshold: (data.thresholds?.flagged_threshold ?? 70) / 100,
        warning_threshold: (data.thresholds?.warning_threshold ?? 50) / 100
      },
      algorithm_weights: {
        cosine_weight: data.algorithm_weights?.cosine_weight ?? 0.50,
        jaccard_weight: data.algorithm_weights?.jaccard_weight ?? 0.40,
        length_weight: data.algorithm_weights?.length_weight ?? 0.10
      },
      custom_whitelist: Array.isArray(data.custom_whitelist) 
        ? data.custom_whitelist 
        : []
    };

    // تخزين في الـ cache
    settingsCache = normalizedSettings;
    lastFetchTime = now;

    console.log('✅ Settings loaded:', {
      thresholds: normalizedSettings.thresholds,
      algorithm_weights: normalizedSettings.algorithm_weights,
      whitelist_count: normalizedSettings.custom_whitelist.length
    });
    
    return normalizedSettings;

  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}
