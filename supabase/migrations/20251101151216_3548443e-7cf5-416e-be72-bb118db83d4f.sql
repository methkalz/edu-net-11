-- Delete progress records for old lessons
DELETE FROM grade11_game_progress 
WHERE lesson_id NOT IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Delete all questions except those for the two communication basics lessons
DELETE FROM grade11_game_questions 
WHERE lesson_id NOT IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Delete all lessons except the two communication basics lessons
DELETE FROM grade11_lessons 
WHERE id NOT IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');