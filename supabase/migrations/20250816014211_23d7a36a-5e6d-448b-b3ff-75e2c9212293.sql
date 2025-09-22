-- Create main admin user account
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@system.com';
    admin_password text := 'Admin123!';
    admin_name text := 'مدير النظام الرئيسي';
    existing_user_id uuid;
BEGIN
    -- Check if admin already exists in profiles
    SELECT user_id INTO existing_user_id 
    FROM profiles 
    WHERE email = admin_email;
    
    IF existing_user_id IS NOT NULL THEN
        -- Update existing profile to ensure it's superadmin
        UPDATE profiles 
        SET role = 'superadmin', 
            full_name = admin_name,
            school_id = NULL
        WHERE user_id = existing_user_id;
        
        RAISE NOTICE 'Updated existing admin user profile: %', admin_email;
    ELSE
        -- Create a placeholder profile with a random UUID
        -- This will be updated when the actual auth user is created
        admin_user_id := gen_random_uuid();
        
        INSERT INTO profiles (
            user_id,
            email,
            full_name,
            role,
            school_id,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            admin_email,
            admin_name,
            'superadmin',
            NULL,
            now(),
            now()
        );
        
        RAISE NOTICE 'Created placeholder admin profile with ID: %', admin_user_id;
    END IF;
END $$;