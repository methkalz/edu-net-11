-- إصلاح مشكلة الـ foreign key constraint الخاطئ في جدول grade11_lesson_media
-- حذف الـ constraint الخاطئ الذي يشير إلى grade11_topics بدلاً من grade11_lessons
ALTER TABLE grade11_lesson_media 
DROP CONSTRAINT IF EXISTS grade11_topic_media_topic_id_fkey;