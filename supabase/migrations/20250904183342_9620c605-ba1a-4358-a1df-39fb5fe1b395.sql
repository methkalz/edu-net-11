-- إضافة أزواج المطابقة بالقيم الصحيحة المقبولة

-- المستوى 1 المرحلة 1: مركبات الاتصال الأساسية
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'المضيف (Host)', 'جهاز يرسل أو يستقبل البيانات في الشبكة', 'term', 'definition', 'المضيف هو أي جهاز في الشبكة يمكنه التواصل مع الأجهزة الأخرى', 1),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'الشبكة (Network)', 'مجموعة من الأجهزة المترابطة لتبادل البيانات', 'term', 'definition', 'الشبكة تسمح للأجهزة بمشاركة الموارد والمعلومات', 2),
('1c8feb5e-5c1d-4052-b1eb-f201029a84da', 'أجهزة الشبكة', 'راوتر، سويتش، هب، أكسس بوينت', 'term', 'definition', 'هذه الأجهزة تساعد في توصيل وإدارة الشبكات', 3),
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