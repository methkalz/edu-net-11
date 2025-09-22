import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  school_name: string
  city: string
  package_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Create User Without Login Function Started ===')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('Environment variables loaded')
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Parse request body
    const { email, password, full_name, school_name, city, package_id } = await req.json() as CreateUserRequest
    
    console.log(`Creating user: ${email} for school: ${school_name}`)
    
    // Create user using admin client (this won't trigger login)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name,
        role: 'school_admin',
        school_id: schoolData.id
      }
    })
    
    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }
    
    console.log(`User created successfully: ${authData.user.id}`)
    
    // Create school
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert([{
        name: school_name,
        city: city,
      }])
      .select()
      .single()
    
    if (schoolError) {
      console.error('School creation error:', schoolError)
      throw schoolError
    }
    
    console.log(`School created successfully: ${schoolData.id}`)
    
    console.log(`User created successfully with school admin profile: ${authData.user.id}`)

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update additional profile fields that trigger can't set
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_primary_admin: true  // تعيين كمدير أساسي
      })
      .eq('user_id', authData.user.id)
    
    if (profileError) {
      console.error('Profile update error:', profileError)
    }
    
    console.log('Profile setup completed successfully')
    
    // Add package subscription
    if (package_id) {
      const { error: packageError } = await supabaseAdmin
        .from('school_packages')
        .insert({
          school_id: schoolData.id,
          package_id: package_id,
          status: 'active',
          start_date: new Date().toISOString(),
        })
      
      if (packageError) {
        console.error('Package subscription error:', packageError)
        throw packageError
      }
      
      console.log('Package subscription created successfully')
    }
    
    console.log('=== User creation completed successfully ===')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and school created successfully',
        user_id: authData.user.id,
        school_id: schoolData.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})