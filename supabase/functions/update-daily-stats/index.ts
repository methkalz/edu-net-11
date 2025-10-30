import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { school_id, date } = await req.json();
    
    console.log('Updating stats for school:', school_id, 'date:', date);

    if (school_id) {
      // تحديث مدرسة محددة
      const { error } = await supabaseClient.rpc('calculate_daily_stats_for_superadmin', {
        p_school_id: school_id,
        p_date: date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Stats updated successfully',
          school_id,
          date: date || new Date().toISOString().split('T')[0]
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      // تحديث جميع المدارس
      const { data: schools, error: schoolsError } = await supabaseClient
        .from('schools')
        .select('id, name');

      if (schoolsError) throw schoolsError;

      const targetDate = date || new Date().toISOString().split('T')[0];
      const results = [];

      for (const school of schools || []) {
        const { error } = await supabaseClient.rpc('calculate_daily_stats_for_superadmin', {
          p_school_id: school.id,
          p_date: targetDate
        });

        if (error) {
          console.error(`Error updating stats for ${school.name}:`, error);
          results.push({ school: school.name, success: false, error: error.message });
        } else {
          results.push({ school: school.name, success: true });
        }
      }

      // تحديث materialized view
      const { error: viewError } = await supabaseClient.rpc('refresh_superadmin_view');
      if (viewError) {
        console.error('Error refreshing materialized view:', viewError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Updated stats for ${schools?.length || 0} schools`,
          date: targetDate,
          results
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
