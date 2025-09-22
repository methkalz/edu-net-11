-- Update existing superadmin@demo.com to have correct superadmin role
UPDATE profiles 
SET role = 'superadmin', 
    full_name = 'مدير النظام الرئيسي',
    school_id = NULL
WHERE email = 'superadmin@demo.com';

-- Check if update was successful
SELECT email, role, full_name FROM profiles WHERE email = 'superadmin@demo.com';