-- Update users without avatars to have default avatars based on their role
-- Using user_id as the correct column name for hashing

-- Update students without avatars
UPDATE profiles 
SET avatar_url = CASE 
  WHEN (hashtext(user_id::text) % 10) = 0 THEN 'student-boy-1.png'
  WHEN (hashtext(user_id::text) % 10) = 1 THEN 'student-girl-1.png'
  WHEN (hashtext(user_id::text) % 10) = 2 THEN 'student-boy-2.png'
  WHEN (hashtext(user_id::text) % 10) = 3 THEN 'student-girl-2.png'
  WHEN (hashtext(user_id::text) % 10) = 4 THEN 'student-boy-3.png'
  WHEN (hashtext(user_id::text) % 10) = 5 THEN 'student-girl-3.png'
  WHEN (hashtext(user_id::text) % 10) = 6 THEN 'student-boy-4.png'
  WHEN (hashtext(user_id::text) % 10) = 7 THEN 'student-girl-4.png'
  WHEN (hashtext(user_id::text) % 10) = 8 THEN 'student-boy-5.png'
  ELSE 'student-creative.png'
END
WHERE role = 'student' AND (avatar_url IS NULL OR avatar_url = '');

-- Update teachers without avatars
UPDATE profiles 
SET avatar_url = CASE 
  WHEN (hashtext(user_id::text) % 6) = 0 THEN 'teacher-male-1.png'
  WHEN (hashtext(user_id::text) % 6) = 1 THEN 'teacher-female-1.png'
  WHEN (hashtext(user_id::text) % 6) = 2 THEN 'teacher-male-2.png'
  WHEN (hashtext(user_id::text) % 6) = 3 THEN 'teacher-female-2.png'
  WHEN (hashtext(user_id::text) % 6) = 4 THEN 'teacher-female-3.png'
  ELSE 'teacher-male-3.png'
END
WHERE role = 'teacher' AND (avatar_url IS NULL OR avatar_url = '');

-- Update school admins without avatars  
UPDATE profiles 
SET avatar_url = CASE 
  WHEN (hashtext(user_id::text) % 3) = 0 THEN 'admin-school-male.png'
  WHEN (hashtext(user_id::text) % 3) = 1 THEN 'admin-school-female.png'
  ELSE 'admin-school-formal.png'
END
WHERE role = 'school_admin' AND (avatar_url IS NULL OR avatar_url = '');

-- Update superadmins without avatars
UPDATE profiles 
SET avatar_url = CASE 
  WHEN (hashtext(user_id::text) % 2) = 0 THEN 'superadmin-1.png'
  ELSE 'superadmin-2.png'
END
WHERE role = 'superadmin' AND (avatar_url IS NULL OR avatar_url = '');

-- Update parents without avatars
UPDATE profiles 
SET avatar_url = CASE 
  WHEN (hashtext(user_id::text) % 2) = 0 THEN 'parent-1.png'
  ELSE 'parent-2.png'
END
WHERE role = 'parent' AND (avatar_url IS NULL OR avatar_url = '');