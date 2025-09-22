-- Create admin user directly
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@system.com';
    admin_password text := 'Admin123!';
    admin_name text := 'مدير النظام الرئيسي';
BEGIN
    -- Check if admin already exists
    IF EXISTS (SELECT 1 FROM profiles WHERE email = admin_email) THEN
        RAISE NOTICE 'Admin user already exists with email: %', admin_email;
    ELSE
        -- Create admin user using Supabase auth
        -- Note: This needs to be done through the admin API
        INSERT INTO profiles (
            user_id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            admin_email,
            admin_name,
            'superadmin',
            now(),
            now()
        ) RETURNING user_id INTO admin_user_id;
        
        RAISE NOTICE 'Admin profile created with ID: %', admin_user_id;
    END IF;
END $$;