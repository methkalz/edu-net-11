import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export interface PDFComparisonSettings {
  thresholds: {
    internal_display: number;
    repository_display: number;
    single_file_display: number;
    flagged_threshold: number;
    warning_threshold: number;
  };
  algorithm_weights: {
    cosine_weight: number;
    jaccard_weight: number;
    length_weight: number;
  };
  custom_whitelist: string[];
}

// Cache settings for 1 minute to reduce database queries
let cachedSettings: PDFComparisonSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

const DEFAULT_SETTINGS: PDFComparisonSettings = {
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
  custom_whitelist: [],
};

export async function getPDFComparisonSettings(
  supabase: SupabaseClient
): Promise<PDFComparisonSettings> {
  // Check cache
  const now = Date.now();
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Using cached PDF comparison settings');
    return cachedSettings;
  }

  try {
    // Fetch active settings from database
    const { data, error } = await supabase
      .from('pdf_comparison_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching PDF comparison settings:', error);
      console.log('Using default settings');
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      console.log('No active settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    // Parse and validate settings
    const settings: PDFComparisonSettings = {
      thresholds: data.thresholds as any,
      algorithm_weights: data.algorithm_weights as any,
      custom_whitelist: data.custom_whitelist as string[] || [],
    };

    // Cache the settings
    cachedSettings = settings;
    cacheTimestamp = now;

    console.log('Loaded PDF comparison settings from database:', {
      thresholds: settings.thresholds,
      weights: settings.algorithm_weights,
      whitelist_count: settings.custom_whitelist.length,
    });

    return settings;
  } catch (err) {
    console.error('Exception fetching PDF comparison settings:', err);
    return DEFAULT_SETTINGS;
  }
}
