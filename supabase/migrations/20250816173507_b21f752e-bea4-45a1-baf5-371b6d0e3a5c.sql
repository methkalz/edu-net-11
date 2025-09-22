-- إنشاء بيانات تجريبية للإضافات في المدارس

-- إضافة الإضافات للمدرسة الأولى
INSERT INTO school_plugins (school_id, plugin_id, status, settings) VALUES
('174a1073-1313-4a33-8ef8-fee662104c7e', '135f6a04-9539-430e-b63a-0642b4206bc1', 'enabled', '{}'),  -- امتحانات أونلاين
('174a1073-1313-4a33-8ef8-fee662104c7e', '877c4af5-e55c-484b-9bdd-251bb7d1c7d7', 'disabled', '{}'), -- ألعاب تعليمية
('174a1073-1313-4a33-8ef8-fee662104c7e', '5aefb6a3-efa5-4722-992c-22701f621b27', 'enabled', '{}');  -- مدقق ملفات PDF

-- إضافة الإضافات للمدرسة الثانية
INSERT INTO school_plugins (school_id, plugin_id, status, settings) VALUES
('cd48e455-336c-4dcf-97ac-1fa6919e4d8c', '135f6a04-9539-430e-b63a-0642b4206bc1', 'enabled', '{}'),  -- امتحانات أونلاين
('cd48e455-336c-4dcf-97ac-1fa6919e4d8c', '146a263b-5a0d-4efa-bfd8-48b4d904ba3f', 'enabled', '{}'),  -- مُسميّات الطلاب
('cd48e455-336c-4dcf-97ac-1fa6919e4d8c', '877c4af5-e55c-484b-9bdd-251bb7d1c7d7', 'disabled', '{}'), -- ألعاب تعليمية
('cd48e455-336c-4dcf-97ac-1fa6919e4d8c', '5aefb6a3-efa5-4722-992c-22701f621b27', 'disabled', '{}'); -- مدقق ملفات PDF

-- التحقق من البيانات
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'enabled' THEN 1 ELSE 0 END) as enabled,
  SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled
FROM school_plugins;