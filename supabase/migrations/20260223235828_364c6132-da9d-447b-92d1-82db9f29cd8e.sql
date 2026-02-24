
-- This is a data-only migration to set max_questions_to_answer for 2022/2023 exams
-- 2022 sections
UPDATE bagrut_exam_sections SET max_questions_to_answer = 10 WHERE id = '6b06b1c6-aa29-4be8-be08-f12ba52fc6a0';
UPDATE bagrut_exam_sections SET max_questions_to_answer = 10 WHERE id = '011b7f10-b90c-40fb-bef5-a091ee2545b4';
UPDATE bagrut_exam_sections SET max_questions_to_answer = 5 WHERE id = '97d4f042-ebe8-4914-abaf-c82d5b6100e1';
-- 2023 sections
UPDATE bagrut_exam_sections SET max_questions_to_answer = 10 WHERE id = '23a5cb10-653c-4d84-afb4-a4fa2d60dbbd';
UPDATE bagrut_exam_sections SET max_questions_to_answer = 10 WHERE id = 'bf2ffb6f-76d1-402c-a014-23196f631a86';
UPDATE bagrut_exam_sections SET max_questions_to_answer = 5 WHERE id = '5cccf989-844b-4e83-877a-df4c51c8b00a';
