-- Clean up all school-related data for fresh testing

-- First delete school packages (foreign key dependencies)
DELETE FROM school_packages WHERE TRUE;

-- Then delete school admin profiles (foreign key dependencies)
DELETE FROM profiles WHERE role = 'school_admin';

-- Finally delete all schools
DELETE FROM schools WHERE TRUE;

-- Verify the cleanup
SELECT 'Cleanup completed' as message,
       (SELECT COUNT(*) FROM schools) as remaining_schools,
       (SELECT COUNT(*) FROM profiles WHERE role = 'school_admin') as remaining_admins,
       (SELECT COUNT(*) FROM school_packages) as remaining_packages;