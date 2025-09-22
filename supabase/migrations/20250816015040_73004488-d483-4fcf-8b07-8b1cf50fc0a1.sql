-- Fix email confirmation for existing admin user
UPDATE auth.users 
SET email_confirmed_at = now(),
    confirmed_at = now()
WHERE email = 'superadmin@demo.com';