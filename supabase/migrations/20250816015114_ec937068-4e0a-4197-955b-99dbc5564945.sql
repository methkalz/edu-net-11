-- Create new admin user with confirmed email
DO $$
DECLARE
    new_admin_id uuid;
    existing_user_id uuid;
BEGIN
    -- Check if admin@admin.com already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com';
    
    IF existing_user_id IS NULL THEN
        -- Create new admin user with confirmed email
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@admin.com',
            crypt('admin112233', gen_salt('bf')),
            now(),
            NULL,
            NULL,
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"مدير النظام الرئيسي"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO new_admin_id;
        
        -- Create profile for the new admin user
        INSERT INTO public.profiles (
            user_id,
            email,
            full_name,
            role,
            school_id
        ) VALUES (
            new_admin_id,
            'admin@admin.com',
            'مدير النظام الرئيسي',
            'superadmin',
            NULL
        );
        
        RAISE NOTICE 'Created new admin user: admin@admin.com with ID: %', new_admin_id;
    ELSE
        RAISE NOTICE 'Admin user admin@admin.com already exists';
    END IF;
END $$;