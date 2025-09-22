-- إصلاح مشكلة school_id المطلوب في جدول grade12_final_projects

-- جعل عمود school_id اختياري (nullable)
ALTER TABLE grade12_final_projects 
ALTER COLUMN school_id DROP NOT NULL;