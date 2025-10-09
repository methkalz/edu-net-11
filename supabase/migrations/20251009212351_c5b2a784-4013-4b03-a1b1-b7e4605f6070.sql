-- ========================================
-- خطة التراجع الكاملة - العودة إلى النظام القديم
-- (تصحيح: حذف المحاولات المعطوبة أولاً)
-- ========================================

-- 1. حذف جميع المحاولات التي exam_id فيها NULL
-- (هذه محاولات معطوبة من النظام الجديد)
DELETE FROM exam_attempts 
WHERE exam_id IS NULL;

-- 2. حذف العمود الجديد instance_id
ALTER TABLE exam_attempts 
  DROP COLUMN IF EXISTS instance_id;

-- 3. إعادة exam_id إلى NOT NULL
ALTER TABLE exam_attempts 
  ALTER COLUMN exam_id SET NOT NULL;

-- 4. إزالة التعليقات
COMMENT ON COLUMN exam_attempts.exam_id IS NULL;