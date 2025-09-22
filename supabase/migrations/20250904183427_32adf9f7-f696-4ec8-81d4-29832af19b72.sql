-- إكمال إضافة أزواج المطابقة للألعاب المتبقية

-- المستوى 2 المرحلة 1: طرق الدخول للراوتر/السويتش
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'Console Port', 'اتصال مباشر عبر كابل كونسول للإعداد الأولي', 'term', 'definition', 'الطريقة الأولى للوصول للجهاز الجديد', 1),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'TELNET', 'اتصال عن بُعد غير آمن عبر الشبكة', 'term', 'definition', 'أقدم طرق الوصول عن بُعد لكن غير آمن', 2),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'SSH', 'اتصال عن بُعد آمن ومشفر عبر الشبكة', 'term', 'definition', 'بديل آمن لـTELNET مع تشفير قوي', 3),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'HTTP/HTTPS', 'إدارة عبر متصفح الويب', 'term', 'definition', 'واجهة رسومية سهلة الاستخدام', 4),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'AUX Port', 'اتصال عبر المودم للوصول الطارئ', 'term', 'definition', 'للوصول في حالات الطوارئ عندما تتعطل الشبكة', 5);

-- المستوى 2 المرحلة 2: أوضاع العمل في نظام التشغيل
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'User EXEC Mode', 'وضع المستخدم العادي للعرض والمراقبة فقط', 'term', 'definition', 'وضع محدود للمستخدمين العاديين', 1),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Privileged EXEC Mode', 'وضع المدير لجميع الأوامر والإعدادات', 'term', 'definition', 'وضع المدير مع صلاحيات كاملة', 2),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Global Configuration Mode', 'وضع الإعداد العام لتغيير إعدادات الجهاز', 'term', 'definition', 'للتعديل على إعدادات الجهاز العامة', 3),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Interface Configuration', 'وضع إعداد الواجهات المحددة', 'term', 'definition', 'لتعديل إعدادات منافذ محددة', 4),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Line Configuration', 'وضع إعداد خطوط الاتصال', 'term', 'definition', 'لإعداد خطوط Console وVTY وAUX', 5),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Router> Prompt', 'يشير إلى User EXEC Mode', 'term', 'definition', 'العلامة > تدل على الوضع المحدود', 6);

-- المستوى 2 المرحلة 3: الإعدادات الأولية للأجهزة
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('c44f1a3a-db17-4991-be0f-10450f237704', 'hostname', 'أمر تسمية الجهاز في الشبكة', 'term', 'definition', 'يحدد اسم الجهاز الظاهر في الشبكة', 1),
('c44f1a3a-db17-4991-be0f-10450f237704', 'enable password', 'كلمة مرور للدخول لوضع المدير', 'term', 'definition', 'يحمي الوصول للأوامر المتقدمة', 2),
('c44f1a3a-db17-4991-be0f-10450f237704', 'banner motd', 'رسالة ترحيب تظهر عند الاتصال', 'term', 'definition', 'رسالة تحذيرية أو ترحيبية للمستخدمين', 3),
('c44f1a3a-db17-4991-be0f-10450f237704', 'copy running-config startup-config', 'حفظ الإعدادات بشكل دائم', 'term', 'definition', 'حفظ الإعدادات لتبقى بعد إعادة التشغيل', 4),
('c44f1a3a-db17-4991-be0f-10450f237704', 'show running-config', 'عرض الإعدادات الحالية في الذاكرة', 'term', 'definition', 'يعرض الإعدادات النشطة حالياً', 5);

-- المستوى 2 المرحلة 4: إدارة الواجهات والعناوين
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('7901acea-131c-4685-bd1d-39362d7dbace', 'interface fa0/1', 'أمر دخول لإعداد منفذ FastEthernet', 'term', 'definition', 'للدخول لإعداد منفذ شبكة محدد', 1),
('7901acea-131c-4685-bd1d-39362d7dbace', 'ip address', 'إسناد عنوان IP للواجهة', 'term', 'definition', 'تحديد هوية الواجهة في الشبكة', 2),
('7901acea-131c-4685-bd1d-39362d7dbace', 'no shutdown', 'تفعيل الواجهة من حالة الإغلاق', 'term', 'definition', 'تشغيل الواجهة لتصبح جاهزة للاستخدام', 3),
('7901acea-131c-4685-bd1d-39362d7dbace', 'SVI', 'واجهة افتراضية للسويتش للإدارة', 'term', 'definition', 'Switch Virtual Interface للإدارة عن بُعد', 4),
('7901acea-131c-4685-bd1d-39362d7dbace', 'VLAN Interface', 'واجهة شبكة محلية افتراضية', 'term', 'definition', 'تقسيم الشبكة المحلية منطقياً', 5),
('7901acea-131c-4685-bd1d-39362d7dbace', 'show ip interface brief', 'عرض ملخص حالة جميع الواجهات', 'term', 'definition', 'عرض سريع لحالة جميع المنافذ', 6);