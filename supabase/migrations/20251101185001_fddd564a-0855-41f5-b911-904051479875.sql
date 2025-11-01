-- إضافة 6 بطاقات جديدة للعبة مغامرة المعرفة

-- إضافة البطاقات الست
INSERT INTO grade11_lessons (id, topic_id, title, order_index, is_active) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b95fa78d-db6b-46a5-852d-ac19ee569dd4', 'أساسيات الشبكات اللاسلكية والمعايير', 500, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '23877110-e32c-452e-a75a-989c7e049379', 'أمان وإعداد WLAN', 501, true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '57d1bdaa-5a20-48c7-b188-8377d55d7e92', 'مقدمة ومفاهيم WAN', 502, true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '82987f0f-5869-4891-b76d-0567bf0aba8e', 'تقنيات وبروتوكولات WAN', 503, true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ad0442da-c56b-43ba-80e8-91ff76a99bad', 'مكونات ومنافذ Router', 504, true),
('10101010-1010-1010-1010-101010101010', 'ad0442da-c56b-43ba-80e8-91ff76a99bad', 'برمجة وإقلاع Router', 505, true);

-- ==========================================
-- البطاقة 1: أساسيات الشبكات اللاسلكية والمعايير
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما هي تقنية Wi-Fi؟', 'multiple_choice', '["تقنية لاسلكية للاتصال بالشبكات المحلية باستخدام موجات الراديو", "كابل للاتصال بالإنترنت", "برنامج للحماية من الفيروسات", "نوع من الهواتف الذكية"]'::jsonb, 'تقنية لاسلكية للاتصال بالشبكات المحلية باستخدام موجات الراديو', 'easy', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما الفرق الرئيسي بين تردد 2.4 GHz و 5 GHz في Wi-Fi؟', 'multiple_choice', '["2.4 GHz يغطي مسافة أكبر لكن بسرعة أقل، 5 GHz أسرع لكن مسافته أقصر", "لا يوجد فرق", "5 GHz أبطأ ويغطي مسافة أقل", "2.4 GHz أسرع ويغطي مسافة أكبر"]'::jsonb, '2.4 GHz يغطي مسافة أكبر لكن بسرعة أقل، 5 GHz أسرع لكن مسافته أقصر', 'medium', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما هو معيار IEEE 802.11 في الشبكات اللاسلكية؟', 'multiple_choice', '["مجموعة معايير للشبكات المحلية اللاسلكية (WLAN)", "معيار للشبكات السلكية فقط", "بروتوكول للبريد الإلكتروني", "نوع من الكابلات"]'::jsonb, 'مجموعة معايير للشبكات المحلية اللاسلكية (WLAN)', 'easy', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'أي معيار من 802.11 يوفر أعلى سرعة؟', 'multiple_choice', '["802.11ax (Wi-Fi 6)", "802.11b", "802.11a", "802.11g"]'::jsonb, '802.11ax (Wi-Fi 6)', 'hard', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما هي تقنية Bluetooth؟', 'multiple_choice', '["تقنية اتصال لاسلكي قصيرة المدى لربط الأجهزة الشخصية", "شبكة واسعة للإنترنت", "كابل USB لاسلكي", "نوع من الهواتف"]'::jsonb, 'تقنية اتصال لاسلكي قصيرة المدى لربط الأجهزة الشخصية', 'easy', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما المدى التقريبي لتقنية Bluetooth؟', 'multiple_choice', '["حتى 10-100 متر حسب الفئة", "عدة كيلومترات", "1 كيلومتر فقط", "10 كيلومترات"]'::jsonb, 'حتى 10-100 متر حسب الفئة', 'medium', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما هي الأشعة فوق الحمراء (Infrared - IR)؟', 'multiple_choice', '["موجات كهرومغناطيسية تستخدم للاتصال قصير المدى وتتطلب خط رؤية مباشر", "نوع من الكابلات", "تقنية لاسلكية طويلة المدى", "بروتوكول إنترنت"]'::jsonb, 'موجات كهرومغناطيسية تستخدم للاتصال قصير المدى وتتطلب خط رؤية مباشر', 'medium', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'أي من التقنيات التالية تحتاج خط رؤية مباشر (Line of Sight)؟', 'multiple_choice', '["Infrared (IR)", "Wi-Fi", "Bluetooth", "الشبكات السلكية"]'::jsonb, 'Infrared (IR)', 'medium', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما هو WPAN (Wireless Personal Area Network)؟', 'multiple_choice', '["شبكة شخصية لاسلكية قصيرة المدى مثل Bluetooth", "شبكة واسعة للإنترنت", "شبكة محلية سلكية", "بروتوكول أمان"]'::jsonb, 'شبكة شخصية لاسلكية قصيرة المدى مثل Bluetooth', 'hard', 10),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ما نوع الموجات المستخدمة في Wi-Fi؟', 'multiple_choice', '["موجات الراديو (Radio Waves)", "الأشعة فوق الحمراء", "الأشعة السينية", "الموجات الصوتية"]'::jsonb, 'موجات الراديو (Radio Waves)', 'easy', 10);

-- ==========================================
-- البطاقة 2: أمان وإعداد WLAN
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما هو SSID في الشبكات اللاسلكية؟', 'multiple_choice', '["اسم الشبكة اللاسلكية الذي يميزها عن غيرها", "بروتوكول للأمان", "عنوان IP للجهاز", "نوع من التشفير"]'::jsonb, 'اسم الشبكة اللاسلكية الذي يميزها عن غيرها', 'easy', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما هو بروتوكول CSMA/CA؟', 'multiple_choice', '["بروتوكول منع التصادم في الشبكات اللاسلكية", "بروتوكول للتشفير", "نوع من الكابلات", "برنامج لإدارة الشبكة"]'::jsonb, 'بروتوكول منع التصادم في الشبكات اللاسلكية', 'medium', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما هي Ad-hoc Network؟', 'multiple_choice', '["شبكة مؤقتة تربط الأجهزة مباشرة دون نقطة وصول مركزية", "شبكة تحتاج دائماً إلى موجه", "شبكة سلكية فقط", "بروتوكول أمان"]'::jsonb, 'شبكة مؤقتة تربط الأجهزة مباشرة دون نقطة وصول مركزية', 'medium', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما هي Infrastructure Network في WLAN؟', 'multiple_choice', '["شبكة تستخدم نقطة وصول مركزية (Access Point) لربط الأجهزة", "شبكة مؤقتة بدون نقطة وصول", "شبكة سلكية", "نوع من التشفير"]'::jsonb, 'شبكة تستخدم نقطة وصول مركزية (Access Point) لربط الأجهزة', 'medium', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما هو WEP في أمان الشبكات اللاسلكية؟', 'multiple_choice', '["بروتوكول تشفير قديم وضعيف لحماية الشبكات اللاسلكية", "أحدث معيار للأمان", "نوع من الموجهات", "بروتوكول للإنترنت"]'::jsonb, 'بروتوكول تشفير قديم وضعيف لحماية الشبكات اللاسلكية', 'hard', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'أي بروتوكول تشفير يُعتبر الأكثر أماناً للشبكات اللاسلكية حالياً؟', 'multiple_choice', '["WPA3", "WEP", "WPA", "لا يوجد تشفير"]'::jsonb, 'WPA3', 'hard', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'لماذا يُنصح بتغيير SSID الافتراضي للموجه؟', 'multiple_choice', '["لزيادة الأمان وإخفاء نوع الجهاز عن المهاجمين", "لزيادة السرعة", "لا حاجة لتغييره", "لتقليل استهلاك الطاقة"]'::jsonb, 'لزيادة الأمان وإخفاء نوع الجهاز عن المهاجمين', 'medium', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما فائدة تغيير قناة التردد (Channel) في الموجه اللاسلكي؟', 'multiple_choice', '["تقليل التداخل مع الشبكات المجاورة وتحسين الأداء", "زيادة السرعة فقط", "لا توجد فائدة", "تقليل استهلاك الكهرباء"]'::jsonb, 'تقليل التداخل مع الشبكات المجاورة وتحسين الأداء', 'medium', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ما هو الفرق بين WPA2-Personal و WPA2-Enterprise؟', 'multiple_choice', '["Personal يستخدم كلمة مرور مشتركة، Enterprise يستخدم خادم مصادقة مركزي", "لا يوجد فرق", "Enterprise أقل أماناً", "Personal للشركات فقط"]'::jsonb, 'Personal يستخدم كلمة مرور مشتركة، Enterprise يستخدم خادم مصادقة مركزي', 'hard', 10),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'لماذا يُفضل إخفاء SSID broadcast في بعض الحالات؟', 'multiple_choice', '["لإخفاء الشبكة عن المستخدمين العاديين وزيادة الأمان", "لزيادة السرعة", "لتقليل استهلاك الطاقة", "لا يوجد سبب"]'::jsonb, 'لإخفاء الشبكة عن المستخدمين العاديين وزيادة الأمان', 'easy', 10);

-- ==========================================
-- البطاقة 3: مقدمة ومفاهيم WAN
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ما هي WAN (Wide Area Network)؟', 'multiple_choice', '["شبكة واسعة تغطي مناطق جغرافية كبيرة وتربط بين شبكات محلية متعددة", "شبكة محلية صغيرة", "جهاز لتوصيل الكمبيوتر", "برنامج للإنترنت"]'::jsonb, 'شبكة واسعة تغطي مناطق جغرافية كبيرة وتربط بين شبكات محلية متعددة', 'easy', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ما الفرق الرئيسي بين LAN و WAN؟', 'multiple_choice', '["LAN تغطي منطقة جغرافية محدودة، WAN تغطي مناطق واسعة", "WAN أسرع دائماً من LAN", "LAN للإنترنت فقط", "لا يوجد فرق"]'::jsonb, 'LAN تغطي منطقة جغرافية محدودة، WAN تغطي مناطق واسعة', 'easy', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ما هو النطاق الترددي (Bandwidth)؟', 'multiple_choice', '["سعة البيانات القصوى التي يمكن نقلها عبر الاتصال في وقت معين", "سرعة المعالج", "حجم الذاكرة", "نوع من الكابلات"]'::jsonb, 'سعة البيانات القصوى التي يمكن نقلها عبر الاتصال في وقت معين', 'medium', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'بماذا يُقاس النطاق الترددي عادةً؟', 'multiple_choice', '["بت في الثانية (bps) أو مضاعفاتها (Kbps, Mbps, Gbps)", "بايت فقط", "هرتز فقط", "واط"]'::jsonb, 'بت في الثانية (bps) أو مضاعفاتها (Kbps, Mbps, Gbps)', 'medium', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'من يمتلك البنية التحتية لشبكات WAN عادةً؟', 'multiple_choice', '["مزودو خدمات الإنترنت (ISP) أو شركات الاتصالات", "المستخدمون الأفراد", "الشركات الصغيرة فقط", "الحكومات فقط"]'::jsonb, 'مزودو خدمات الإنترنت (ISP) أو شركات الاتصالات', 'medium', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ما هو الإنترنت من منظور WAN؟', 'multiple_choice', '["أكبر شبكة WAN عالمية تربط ملايين الشبكات حول العالم", "شبكة محلية صغيرة", "برنامج كمبيوتر", "نوع من الكابلات"]'::jsonb, 'أكبر شبكة WAN عالمية تربط ملايين الشبكات حول العالم', 'easy', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'لماذا تكون WAN عادةً أبطأ من LAN؟', 'multiple_choice', '["بسبب المسافات الطويلة والتكنولوجيا المستخدمة في الربط", "لأنها تستخدم كابلات أقل جودة", "لأنها أقدم", "لا يوجد فرق في السرعة"]'::jsonb, 'بسبب المسافات الطويلة والتكنولوجيا المستخدمة في الربط', 'medium', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ما هو دور الموجه (Router) في WAN؟', 'multiple_choice', '["ربط الشبكات المختلفة وتوجيه حزم البيانات بين الشبكات", "تخزين البيانات فقط", "شحن الأجهزة", "لا دور له"]'::jsonb, 'ربط الشبكات المختلفة وتوجيه حزم البيانات بين الشبكات', 'easy', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'أي طبقة من OSI تعمل فيها WAN بشكل أساسي؟', 'multiple_choice', '["Physical Layer و Data Link Layer (الطبقة 1 و 2)", "Application Layer فقط", "Transport Layer فقط", "Session Layer فقط"]'::jsonb, 'Physical Layer و Data Link Layer (الطبقة 1 و 2)', 'hard', 10),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ما المقصود بـ "Last Mile" في WAN؟', 'multiple_choice', '["الاتصال النهائي بين مزود الخدمة والمستخدم النهائي", "آخر كيلومتر من الكابل", "المسافة بين البلدان", "لا يوجد مصطلح كهذا"]'::jsonb, 'الاتصال النهائي بين مزود الخدمة والمستخدم النهائي', 'hard', 10);

-- ==========================================
-- البطاقة 4: تقنيات وبروتوكولات WAN
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هي تقنية DSL (Digital Subscriber Line)؟', 'multiple_choice', '["تقنية لنقل البيانات عبر خطوط الهاتف النحاسية التقليدية", "نوع من الكابلات الضوئية", "شبكة لاسلكية", "جهاز توجيه"]'::jsonb, 'تقنية لنقل البيانات عبر خطوط الهاتف النحاسية التقليدية', 'medium', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هي تقنية Frame Relay في WAN؟', 'multiple_choice', '["بروتوكول WAN لنقل البيانات بسرعة عالية عبر شبكات واسعة", "نوع من الموجهات", "بروتوكول للبريد الإلكتروني", "كابل شبكة"]'::jsonb, 'بروتوكول WAN لنقل البيانات بسرعة عالية عبر شبكات واسعة', 'hard', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هو PPP (Point-to-Point Protocol)؟', 'multiple_choice', '["بروتوكول لإنشاء اتصال مباشر بين عقدتين في WAN", "نوع من الكابلات", "جهاز للربط", "برنامج كمبيوتر"]'::jsonb, 'بروتوكول لإنشاء اتصال مباشر بين عقدتين في WAN', 'medium', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هي تقنية MPLS (Multiprotocol Label Switching)؟', 'multiple_choice', '["تقنية متقدمة لتوجيه البيانات باستخدام ملصقات بدلاً من عناوين IP", "نوع من التشفير", "بروتوكول بريد إلكتروني", "جهاز شبكة"]'::jsonb, 'تقنية متقدمة لتوجيه البيانات باستخدام ملصقات بدلاً من عناوين IP', 'hard', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هي خدمة T1/E1 في WAN؟', 'multiple_choice', '["خطوط اتصال مخصصة توفر سرعة ثابتة ومضمونة للشركات", "نوع من الكابلات", "بروتوكول إنترنت", "جهاز لاسلكي"]'::jsonb, 'خطوط اتصال مخصصة توفر سرعة ثابتة ومضمونة للشركات', 'hard', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هو Circuit Switching في WAN؟', 'multiple_choice', '["تقنية تنشئ دائرة مخصصة للاتصال طوال مدة الجلسة", "تقسيم البيانات إلى حزم", "نوع من الموجهات", "بروتوكول تشفير"]'::jsonb, 'تقنية تنشئ دائرة مخصصة للاتصال طوال مدة الجلسة', 'hard', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هو Packet Switching في WAN؟', 'multiple_choice', '["تقنية تقسم البيانات إلى حزم وترسلها عبر مسارات مختلفة", "إنشاء دائرة مخصصة", "نوع من الكابلات", "جهاز للتوجيه"]'::jsonb, 'تقنية تقسم البيانات إلى حزم وترسلها عبر مسارات مختلفة', 'medium', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هو VPN (Virtual Private Network)؟', 'multiple_choice', '["شبكة خاصة افتراضية تنشئ اتصال آمن ومشفر عبر شبكة عامة", "نوع من الكابلات", "جهاز شبكة", "بروتوكول غير مشفر"]'::jsonb, 'شبكة خاصة افتراضية تنشئ اتصال آمن ومشفر عبر شبكة عامة', 'medium', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما فائدة استخدام VPN للشركات في WAN؟', 'multiple_choice', '["ربط مكاتب الشركة بشكل آمن عبر الإنترنت دون الحاجة لخطوط مخصصة مكلفة", "زيادة السرعة فقط", "تقليل استهلاك الكهرباء", "لا فائدة منه"]'::jsonb, 'ربط مكاتب الشركة بشكل آمن عبر الإنترنت دون الحاجة لخطوط مخصصة مكلفة', 'medium', 10),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ما هي تقنية Metro Ethernet في WAN؟', 'multiple_choice', '["تقنية توفر اتصال Ethernet في الشبكات الحضرية والواسعة", "شبكة لاسلكية", "نوع من الموجهات", "بروتوكول بريد"]'::jsonb, 'تقنية توفر اتصال Ethernet في الشبكات الحضرية والواسعة', 'hard', 10);

-- ==========================================
-- البطاقة 5: مكونات ومنافذ Router
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما هي المكونات الرئيسية للموجه (Router)؟', 'multiple_choice', '["المعالج (CPU)، الذاكرة (RAM, ROM, Flash)، والمنافذ (Interfaces)", "الشاشة ولوحة المفاتيح فقط", "القرص الصلب فقط", "البطارية فقط"]'::jsonb, 'المعالج (CPU)، الذاكرة (RAM, ROM, Flash)، والمنافذ (Interfaces)', 'easy', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما وظيفة RAM في الموجه؟', 'multiple_choice', '["تخزين جداول التوجيه وملفات التكوين النشطة مؤقتاً", "تخزين نظام التشغيل بشكل دائم", "لا وظيفة لها", "تشغيل التطبيقات فقط"]'::jsonb, 'تخزين جداول التوجيه وملفات التكوين النشطة مؤقتاً', 'medium', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما وظيفة ROM في الموجه؟', 'multiple_choice', '["تخزين برنامج التشخيص والإقلاع الأولي (Bootstrap)", "تخزين الملفات المؤقتة", "تخزين جداول التوجيه", "لا وظيفة لها"]'::jsonb, 'تخزين برنامج التشخيص والإقلاع الأولي (Bootstrap)', 'medium', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما وظيفة Flash Memory في الموجه؟', 'multiple_choice', '["تخزين نظام التشغيل IOS بشكل دائم", "تخزين البيانات المؤقتة", "معالجة البيانات", "لا وظيفة لها"]'::jsonb, 'تخزين نظام التشغيل IOS بشكل دائم', 'medium', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما هو Console Port في الموجه؟', 'multiple_choice', '["منفذ للاتصال المباشر بالموجه لإعداده وبرمجته", "منفذ للإنترنت", "منفذ USB عادي", "منفذ لتوصيل الطابعة"]'::jsonb, 'منفذ للاتصال المباشر بالموجه لإعداده وبرمجته', 'easy', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما الفرق بين Console Port و Auxiliary Port؟', 'multiple_choice', '["Console للاتصال المحلي المباشر، Auxiliary للاتصال عن بعد عبر modem", "لا يوجد فرق", "Auxiliary أسرع", "Console للإنترنت فقط"]'::jsonb, 'Console للاتصال المحلي المباشر، Auxiliary للاتصال عن بعد عبر modem', 'hard', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما نوع الكابل المستخدم للاتصال بـ Console Port؟', 'multiple_choice', '["كابل Rollover (Console Cable)", "كابل Ethernet عادي", "كابل USB فقط", "كابل HDMI"]'::jsonb, 'كابل Rollover (Console Cable)', 'medium', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما هي Ethernet Interfaces في الموجه؟', 'multiple_choice', '["منافذ لربط الموجه بالشبكات المحلية والواسعة", "منافذ لتوصيل الشاشة", "منافذ صوتية", "منافذ للطاقة فقط"]'::jsonb, 'منافذ لربط الموجه بالشبكات المحلية والواسعة', 'easy', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ما وظيفة NVRAM في الموجه؟', 'multiple_choice', '["تخزين ملف التكوين (Configuration File) بشكل دائم", "تخزين نظام التشغيل", "تخزين البيانات المؤقتة", "معالجة البيانات"]'::jsonb, 'تخزين ملف التكوين (Configuration File) بشكل دائم', 'hard', 10),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'لماذا تُعتبر ذاكرة Flash قابلة لإعادة الكتابة؟', 'multiple_choice', '["لتحديث نظام التشغيل IOS دون استبدال القطع المادية", "لزيادة السرعة", "لتقليل الحجم", "لا سبب"]'::jsonb, 'لتحديث نظام التشغيل IOS دون استبدال القطع المادية', 'medium', 10);

-- ==========================================
-- البطاقة 6: برمجة وإقلاع Router
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('10101010-1010-1010-1010-101010101010', 'ما هي أوضاع البرمجة الرئيسية في موجهات Cisco؟', 'multiple_choice', '["User EXEC Mode و Privileged EXEC Mode و Global Configuration Mode", "وضع واحد فقط", "وضعين فقط", "لا توجد أوضاع"]'::jsonb, 'User EXEC Mode و Privileged EXEC Mode و Global Configuration Mode', 'medium', 10),

('10101010-1010-1010-1010-101010101010', 'ما الرمز الذي يظهر في User EXEC Mode؟', 'multiple_choice', '["Router>", "Router#", "Router(config)#", "Router$"]'::jsonb, 'Router>', 'easy', 10),

('10101010-1010-1010-1010-101010101010', 'ما الرمز الذي يظهر في Privileged EXEC Mode؟', 'multiple_choice', '["Router#", "Router>", "Router(config)#", "Router*"]'::jsonb, 'Router#', 'easy', 10),

('10101010-1010-1010-1010-101010101010', 'ما الأمر للانتقال من User EXEC Mode إلى Privileged EXEC Mode؟', 'multiple_choice', '["enable", "configure terminal", "exit", "reload"]'::jsonb, 'enable', 'medium', 10),

('10101010-1010-1010-1010-101010101010', 'ما الأمر للدخول إلى Global Configuration Mode؟', 'multiple_choice', '["configure terminal (أو conf t)", "enable", "exit", "show running-config"]'::jsonb, 'configure terminal (أو conf t)', 'medium', 10),

('10101010-1010-1010-1010-101010101010', 'ما هو تسلسل إقلاع موجهات Cisco (Boot Sequence)؟', 'multiple_choice', '["POST، تحميل Bootstrap من ROM، تحميل IOS، تحميل Configuration File", "تحميل IOS فقط", "تشغيل مباشر", "لا يوجد تسلسل"]'::jsonb, 'POST، تحميل Bootstrap من ROM، تحميل IOS، تحميل Configuration File', 'hard', 10),

('10101010-1010-1010-1010-101010101010', 'ما هو POST في عملية إقلاع الموجه؟', 'multiple_choice', '["Power-On Self-Test - اختبار ذاتي عند التشغيل للتحقق من العتاد", "بروتوكول للإنترنت", "نوع من الكابلات", "برنامج للأمان"]'::jsonb, 'Power-On Self-Test - اختبار ذاتي عند التشغيل للتحقق من العتاد', 'medium', 10),

('10101010-1010-1010-1010-101010101010', 'من أين يتم تحميل Startup Configuration عند إقلاع الموجه؟', 'multiple_choice', '["من NVRAM", "من RAM", "من ROM", "من Flash"]'::jsonb, 'من NVRAM', 'hard', 10),

('10101010-1010-1010-1010-101010101010', 'ما الأمر لحفظ التكوين الحالي في Cisco Router؟', 'multiple_choice', '["copy running-config startup-config (أو write memory)", "save config", "store config", "backup"]'::jsonb, 'copy running-config startup-config (أو write memory)', 'hard', 10),

('10101010-1010-1010-1010-101010101010', 'لماذا نحتاج Console Port للإعداد الأولي للموجه؟', 'multiple_choice', '["لأن الموجه لا يكون لديه عنوان IP مسبقاً ولا يمكن الوصول إليه عبر الشبكة", "لأنه أسرع", "لأنه إلزامي دائماً", "لا حاجة له"]'::jsonb, 'لأن الموجه لا يكون لديه عنوان IP مسبقاً ولا يمكن الوصول إليه عبر الشبكة', 'medium', 10);