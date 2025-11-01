-- استرجاع بطاقات الألعاب التعليمية بعد استرجاع الـ backup
-- Created: 2025-11-01
-- Purpose: Re-insert two new game card lessons after database restore

BEGIN;

-- إعادة إدراج البطاقة الأولى
INSERT INTO grade11_lessons (
  id, topic_id, title, content, order_index, 
  created_at, updated_at, is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '57b88a37-5337-4668-bc5d-7c25462e1456',
  'أساسيات الاتصال - البطاقة 1',
  '<p>بطاقة تعليمية تحتوي على أسئلة أساسية حول شبكات الحاسوب وأنواعها ومعمارياتها</p>',
  100,
  '2025-11-01 15:07:44.227429+00',
  '2025-11-01 15:07:44.227429+00',
  true
)
ON CONFLICT (id) DO NOTHING;

-- إعادة إدراج البطاقة الثانية
INSERT INTO grade11_lessons (
  id, topic_id, title, content, order_index, 
  created_at, updated_at, is_active
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '57b88a37-5337-4668-bc5d-7c25462e1456',
  'أساسيات الاتصال - البطاقة 2',
  '<p>بطاقة تعليمية تحتوي على أسئلة متقدمة حول أجهزة الشبكات والطوبولوجيا والكابلات</p>',
  101,
  '2025-11-01 15:07:44.227429+00',
  '2025-11-01 15:07:44.227429+00',
  true
)
ON CONFLICT (id) DO NOTHING;

COMMIT;