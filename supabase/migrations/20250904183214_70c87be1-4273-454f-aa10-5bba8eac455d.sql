-- إضافة أزواج المطابقة لجميع الألعاب بناءً على منهج الصف الحادي عشر

-- المستوى 1 المرحلة 1: مركبات الاتصال الأساسية
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'المضيف (Host)', 'جهاز يرسل أو يستقبل البيانات في الشبكة', 'term', 'definition', 'المضيف هو أي جهاز في الشبكة يمكنه التواصل مع الأجهزة الأخرى', 1),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'الشبكة (Network)', 'مجموعة من الأجهزة المترابطة لتبادل البيانات', 'term', 'definition', 'الشبكة تسمح للأجهزة بمشاركة الموارد والمعلومات', 2),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'أجهزة الشبكة', 'راوتر، سويتش، هب، أكسس بوينت', 'term', 'examples', 'هذه الأجهزة تساعد في توصيل وإدارة الشبكات', 3),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'الاتصال', 'عملية تبادل المعلومات بين الأجهزة', 'term', 'definition', 'الاتصال يتطلب مرسل ومستقبل ووسط نقل', 4),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'البروتوكول', 'قواعد تحكم في كيفية التواصل بين الأجهزة', 'term', 'definition', 'البروتوكولات ضرورية لضمان التفاهم بين الأجهزة', 5);

-- المستوى 1 المرحلة 2: الطوبولوجيا الفيزيائية والمنطقية  
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'الطوبولوجيا الفيزيائية', 'ترتيب الكابلات والأجهزة الفعلي في الشبكة', 'term', 'definition', 'تركز على التوصيلات المادية الفعلية', 1),
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'الطوبولوجيا المنطقية', 'كيفية تدفق البيانات في الشبكة', 'term', 'definition', 'تركز على مسار البيانات وليس التوصيلات الفيزيائية', 2),
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'Star Topology', 'جميع الأجهزة متصلة بجهاز مركزي', 'term', 'definition', 'أكثر أنواع الشبكات شيوعاً في المكاتب', 3),
('edaaf78e-a93a-4abf-a169-7baf09576b48', 'Bus Topology', 'جميع الأجهزة متصلة بكابل واحد مشترك', 'term', 'definition', 'طوبولوجيا قديمة نسبياً لكن فعالة', 4);

-- المستوى 1 المرحلة 3: أنواع الشبكات
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'LAN', 'شبكة محلية تغطي مساحة صغيرة كالمنزل أو المكتب', 'term', 'definition', 'Local Area Network - أسرع وأكثر أماناً', 1),
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'WAN', 'شبكة واسعة تربط بين شبكات محلية متباعدة جغرافياً', 'term', 'definition', 'Wide Area Network - تستخدم خطوط اتصال عامة', 2),
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'Internet', 'أكبر شبكة في العالم تربط ملايين الشبكات', 'term', 'definition', 'شبكة الشبكات - تستخدم بروتوكولات TCP/IP', 3),
('e69492d3-a2a6-499b-81cb-5f7e5a463a55', 'MAN', 'شبكة حضرية تغطي مدينة أو منطقة كبيرة', 'term', 'definition', 'Metropolitan Area Network - بين LAN وWAN', 4);

-- المستوى 1 المرحلة 4: طرق الاتصال بالإنترنت
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'DSL', 'اتصال عبر خط الهاتف الثابت بسرعة عالية', 'term', 'definition', 'Digital Subscriber Line - يستخدم خط الهاتف الموجود', 1),
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'Cable Modem', 'اتصال عبر كابل التلفزيون', 'term', 'definition', 'يوفر سرعات عالية عبر شبكة التلفزيون', 2),
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'Fiber Optic', 'اتصال عبر الألياف البصرية بسرعة فائقة', 'term', 'definition', 'أسرع تقنية اتصال متاحة حالياً', 3),
('06d94742-9fa7-48d4-9e6d-7cdf0921cae9', 'Wireless', 'اتصال لاسلكي عبر موجات الراديو', 'term', 'definition', 'مناسب للأماكن التي يصعب مد الكابلات إليها', 4);

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
('4331ce23-fc32-46b7-9cc7-fe57c7d0ad84', 'Router> Prompt', 'يشير إلى User EXEC Mode', 'indicator', 'meaning', 'العلامة > تدل على الوضع المحدود', 6);