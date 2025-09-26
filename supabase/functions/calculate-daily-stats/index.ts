import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // إنشاء client مع صلاحيات service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { date, school_id } = await req.json();
    
    // استخدام تاريخ اليوم إذا لم يتم تحديد تاريخ
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`Calculating daily stats for date: ${targetDate}, school: ${school_id || 'all schools'}`);

    // إذا لم يتم تحديد school_id، احسب لكل المدارس
    if (!school_id) {
      // جلب كل المدارس
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id');
        
      if (schoolsError) {
        throw new Error(`Error fetching schools: ${schoolsError.message}`);
      }

      // حساب الإحصائيات لكل مدرسة
      const results = [];
      for (const school of schools) {
        try {
          const { error } = await supabase
            .rpc('calculate_daily_activity_stats', {
              target_date: targetDate,
              target_school_id: school.id
            });

          if (error) {
            console.error(`Error calculating for school ${school.id}:`, error);
            results.push({ school_id: school.id, status: 'error', error: error.message });
          } else {
            results.push({ school_id: school.id, status: 'success' });
          }
        } catch (err) {
          console.error(`Exception for school ${school.id}:`, err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          results.push({ school_id: school.id, status: 'error', error: errorMessage });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        date: targetDate,
        results,
        total_schools: schools.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // حساب الإحصائيات لمدرسة واحدة
      const { error } = await supabase
        .rpc('calculate_daily_activity_stats', {
          target_date: targetDate,
          target_school_id: school_id
        });

      if (error) {
        throw new Error(`Error calculating stats: ${error.message}`);
      }

      // جلب النتائج المحسوبة
      const { data: stats, error: fetchError } = await supabase
        .from('daily_activity_stats')
        .select('*')
        .eq('date', targetDate)
        .eq('school_id', school_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error fetching calculated stats: ${fetchError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        date: targetDate,
        school_id,
        stats: stats || null,
        message: stats ? 'Stats calculated and retrieved successfully' : 'Stats calculated but no data available'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in calculate-daily-stats function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: errorStack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});