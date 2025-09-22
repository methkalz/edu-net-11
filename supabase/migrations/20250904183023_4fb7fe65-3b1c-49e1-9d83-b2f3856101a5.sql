-- إضافة أزواج المطابقة لجميع الألعاب بناءً على منهج الصف الحادي عشر

-- المستوى 1 المرحلة 1: مركبات الاتصال الأساسية
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'المضيف (Host)', 'جهاز يرسل أو يستقبل البيانات في الشبكة', 'concept_definition', 'easy'),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'الشبكة (Network)', 'مجموعة من الأجهزة المترابطة لتبادل البيانات', 'concept_definition', 'easy'),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'أجهزة الشبكة', 'راوتر، سويتش، هب، أكسس بوينت', 'concept_definition', 'easy'),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'الاتصال', 'عملية تبادل المعلومات بين الأجهزة', 'concept_definition', 'easy'),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'البروتوكول', 'قواعد تحكم في كيفية التواصل بين الأجهزة', 'concept_definition', 'easy');

-- المستوى 1 المرحلة 2: الطوبولوجيا الفيزيائية والمنطقية  
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'الطوبولوجيا الفيزيائية', 'ترتيب الكابلات والأجهزة الفعلي في الشبكة', 'concept_definition', 'easy'),
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'الطوبولوجيا المنطقية', 'كيفية تدفق البيانات في الشبكة', 'concept_definition', 'easy'),
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'Star Topology', 'جميع الأجهزة متصلة بجهاز مركزي', 'concept_definition', 'easy'),
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'Bus Topology', 'جميع الأجهزة متصلة بكابل واحد مشترك', 'concept_definition', 'easy');

-- المستوى 1 المرحلة 3: أنواع الشبكات
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'LAN', 'شبكة محلية تغطي مساحة صغيرة كالمنزل أو المكتب', 'concept_definition', 'easy'),
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'WAN', 'شبكة واسعة تربط بين شبكات محلية متباعدة جغرافياً', 'concept_definition', 'easy'),
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'Internet', 'أكبر شبكة في العالم تربط ملايين الشبكات', 'concept_definition', 'easy'),
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'MAN', 'شبكة حضرية تغطي مدينة أو منطقة كبيرة', 'concept_definition', 'easy');

-- المستوى 1 المرحلة 4: طرق الاتصال بالإنترنت
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'DSL', 'اتصال عبر خط الهاتف الثابت بسرعة عالية', 'concept_definition', 'easy'),
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'Cable Modem', 'اتصال عبر كابل التلفزيون', 'concept_definition', 'easy'),
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'Fiber Optic', 'اتصال عبر الألياف البصرية بسرعة فائقة', 'concept_definition', 'easy'),
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'Wireless', 'اتصال لاسلكي عبر موجات الراديو', 'concept_definition', 'easy');

-- المستوى 2 المرحلة 1: طرق الدخول للراوتر/السويتش
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'Console Port', 'اتصال مباشر عبر كابل كونسول للإعداد الأولي', 'concept_definition', 'medium'),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'TELNET', 'اتصال عن بُعد غير آمن عبر الشبكة', 'concept_definition', 'medium'),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'SSH', 'اتصال عن بُعد آمن ومشفر عبر الشبكة', 'concept_definition', 'medium'),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'HTTP/HTTPS', 'إدارة عبر متصفح الويب', 'concept_definition', 'medium'),
('9143857b-353b-49ab-b3d3-cfab9a15c4ec', 'AUX Port', 'اتصال عبر المودم للوصول الطارئ', 'concept_definition', 'medium');

-- المستوى 2 المرحلة 2: أوضاع العمل في نظام التشغيل
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'User EXEC Mode', 'وضع المستخدم العادي للعرض والمراقبة فقط', 'concept_definition', 'medium'),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Privileged EXEC Mode', 'وضع المدير لجميع الأوامر والإعدادات', 'concept_definition', 'medium'),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Global Configuration Mode', 'وضع الإعداد العام لتغيير إعدادات الجهاز', 'concept_definition', 'medium'),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Interface Configuration', 'وضع إعداد الواجهات المحددة', 'concept_definition', 'medium'),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Line Configuration', 'وضع إعداد خطوط الاتصال', 'concept_definition', 'medium'),
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Router> Prompt', 'يشير إلى User EXEC Mode', 'concept_definition', 'medium');

-- المستوى 2 المرحلة 3: الإعدادات الأولية للأجهزة
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('c44f1a3a-db17-4991-be0f-10450f237704', 'hostname', 'أمر تسمية الجهاز في الشبكة', 'command_function', 'medium'),
('c44f1a3a-db17-4991-be0f-10450f237704', 'enable password', 'كلمة مرور للدخول لوضع المدير', 'command_function', 'medium'),
('c44f1a3a-db17-4991-be0f-10450f237704', 'banner motd', 'رسالة ترحيب تظهر عند الاتصال', 'command_function', 'medium'),
('c44f1a3a-db17-4991-be0f-10450f237704', 'copy running-config startup-config', 'حفظ الإعدادات بشكل دائم', 'command_function', 'medium'),
('c44f1a3a-db17-4991-be0f-10450f237704', 'show running-config', 'عرض الإعدادات الحالية في الذاكرة', 'command_function', 'medium');

-- المستوى 2 المرحلة 4: إدارة الواجهات والعناوين
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('7901acea-131c-4685-bd1d-39362d7dbace', 'interface fa0/1', 'أمر دخول لإعداد منفذ FastEthernet', 'command_function', 'medium'),
('7901acea-131c-4685-bd1d-39362d7dbace', 'ip address', 'إسناد عنوان IP للواجهة', 'command_function', 'medium'),
('7901acea-131c-4685-bd1d-39362d7dbace', 'no shutdown', 'تفعيل الواجهة من حالة الإغلاق', 'command_function', 'medium'),
('7901acea-131c-4685-bd1d-39362d7dbace', 'SVI', 'واجهة افتراضية للسويتش للإدارة', 'concept_definition', 'medium'),
('7901acea-131c-4685-bd1d-39362d7dbace', 'VLAN Interface', 'واجهة شبكة محلية افتراضية', 'concept_definition', 'medium'),
('7901acea-131c-4685-bd1d-39362d7dbace', 'show ip interface brief', 'عرض ملخص حالة جميع الواجهات', 'command_function', 'medium');

-- المستوى 3 المرحلة 1: قوانين البروتوكولات
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('65972433-86dd-4601-88f6-e55d1ba998c0', 'المرسل (Sender)', 'الجهاز الذي يبدأ عملية الاتصال', 'concept_definition', 'medium'),
('65972433-86dd-4601-88f6-e55d1ba998c0', 'المستقبل (Receiver)', 'الجهاز الذي يستقبل ويعالج البيانات', 'concept_definition', 'medium'),
('65972433-86dd-4601-88f6-e55d1ba998c0', 'القناة المشتركة', 'الوسط الذي تنتقل عبره البيانات', 'concept_definition', 'medium'),
('65972433-86dd-4601-88f6-e55d1ba998c0', 'قوانين البروتوكول', 'القواعد التي تحكم عملية التواصل', 'concept_definition', 'medium');

-- المستوى 3 المرحلة 2: حزمة بروتوكولات TCP/IP
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'TCP/IP Suite', 'مجموعة بروتوكولات الإنترنت الأساسية', 'concept_definition', 'medium'),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'IEEE', 'منظمة معايير الكهرباء والإلكترونيات', 'concept_definition', 'medium'),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'IETF', 'مجموعة عمل هندسة الإنترنت', 'concept_definition', 'medium'),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'RFC', 'طلب للتعليقات - وثائق المعايير', 'concept_definition', 'medium'),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'Standardization', 'توحيد القوانين لضمان التوافق', 'concept_definition', 'medium');

-- المستوى 3 المرحلة 3: نموذج الطبقات OSI وTCP/IP
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Physical Layer', 'طبقة فيزيائية - الإشارات والكابلات', 'concept_definition', 'hard'),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Data Link Layer', 'طبقة ربط البيانات - إطارات الإيثرنت', 'concept_definition', 'hard'),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Network Layer', 'طبقة الشبكة - التوجيه والعناوين IP', 'concept_definition', 'hard'),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Transport Layer', 'طبقة النقل - TCP وUDP', 'concept_definition', 'hard'),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Application Layer', 'طبقة التطبيق - البرامج والخدمات', 'concept_definition', 'hard'),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'OSI Model', 'نموذج من 7 طبقات للشبكات', 'concept_definition', 'hard');

-- المستوى 3 المرحلة 4: تغليف البيانات
INSERT INTO pair_matching_pairs (game_id, left_text, right_text, pair_type, difficulty_level) VALUES
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Data Encapsulation', 'عملية تغليف البيانات عبر الطبقات', 'concept_definition', 'hard'),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Segments', 'وحدة البيانات في طبقة النقل', 'concept_definition', 'hard'),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Packets', 'وحدة البيانات في طبقة الشبكة', 'concept_definition', 'hard'),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Frames', 'وحدة البيانات في طبقة ربط البيانات', 'concept_definition', 'hard'),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Bits', 'وحدة البيانات في الطبقة الفيزيائية', 'concept_definition', 'hard');