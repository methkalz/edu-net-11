-- Insert 30 communication fundamentals questions into question_bank
INSERT INTO public.question_bank (
  question_text, 
  question_type, 
  choices, 
  correct_answer, 
  difficulty_level, 
  points, 
  section_id,
  is_active
) VALUES 
-- Question 1 (easy)
('ما هو الجهاز الذي يُعتبر مضيفًا (Host) في الشبكة؟', 'multiple_choice', 
 '["الطابعة", "الحاسوب", "الكابل", "المبدل (Switch)"]'::jsonb, 
 'الحاسوب', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 2 (easy)
('أي نوع من الشبكات لا يحتاج إلى خادم مركزي؟', 'multiple_choice',
 '["شبكة عميل/خادم (Server-Client)", "شبكة نظير إلى نظير (Peer-to-Peer)", "شبكة إنترنت", "شبكة WAN"]'::jsonb,
 'شبكة نظير إلى نظير (Peer-to-Peer)', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 3 (medium)
('ما وظيفة الأجهزة الوسيطة (Intermediary Devices) في الشبكة؟', 'multiple_choice',
 '["إنشاء البرامج", "توجيه البيانات والتحكم في المرور", "تخزين الملفات", "كتابة عناوين IP"]'::jsonb,
 'توجيه البيانات والتحكم في المرور', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 4 (medium)
('أي وسيلة نقل توفر أعلى سرعة وأقل تأثر بالتشويش؟', 'multiple_choice',
 '["كابلات النحاس", "الألياف الضوئية", "Wi-Fi", "موجات الراديو"]'::jsonb,
 'الألياف الضوئية', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 5 (medium)
('ما الفرق بين LAN وWAN؟', 'multiple_choice',
 '["LAN تغطي مساحات كبيرة جدًا", "WAN مخصصة للأجهزة المنزلية", "LAN محلية صغيرة وWAN تغطي مسافات واسعة", "كلاهما يستخدمان نفس الأجهزة دائمًا"]'::jsonb,
 'LAN محلية صغيرة وWAN تغطي مسافات واسعة', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 6 (hard)
('أي بروتوكول هو أساس الإنترنت ويعمل في جميع الشبكات؟', 'multiple_choice',
 '["SMTP", "FTP", "TCP/IP", "DHCP"]'::jsonb,
 'TCP/IP', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 7 (easy)
('ما اسم القناة التي تنتقل عبرها البيانات؟', 'multiple_choice',
 '["برنامج", "وسائط الشبكة (Network Media)", "خادم", "تطبيق"]'::jsonb,
 'وسائط الشبكة (Network Media)', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 8 (medium)
('ما نوع الشبكة التي تغطي مبنى مدرسي بالكامل؟', 'multiple_choice',
 '["LAN", "WAN", "WLAN", "WPAN"]'::jsonb,
 'LAN', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 9 (medium)
('ما الوظيفة الرئيسية للراوتر (Router)؟', 'multiple_choice',
 '["تخزين البيانات", "ربط الشبكات المختلفة معًا", "عرض الصفحات", "إنشاء كلمات مرور"]'::jsonb,
 'ربط الشبكات المختلفة معًا', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 10 (hard)
('ما التقنية التي تستخدم موجات راديو للتوصيل بدل الكابلات؟', 'multiple_choice',
 '["Wi-Fi", "UTP", "STP", "Fiber"]'::jsonb,
 'Wi-Fi', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 11 (easy)
('ما هو المكون النهائي (End Device) في الشبكة؟', 'multiple_choice',
 '["حاسوب شخصي", "راوتر", "سويتش", "كابل"]'::jsonb,
 'حاسوب شخصي', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 12 (medium)
('أي نوع من الكابلات أكثر عرضة للتشويش؟', 'multiple_choice',
 '["UTP", "STP", "Coaxial", "Fiber"]'::jsonb,
 'UTP', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 13 (medium)
('ما الاسم الذي يطلق على الرسائل الصغيرة التي تنتقل في الشبكة؟', 'multiple_choice',
 '["Packets", "Blocks", "Tables", "Codes"]'::jsonb,
 'Packets', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 14 (hard)
('أي نموذج يصف الاتصال في 7 طبقات؟', 'multiple_choice',
 '["OSI", "TCP/IP", "VLAN", "Ethernet"]'::jsonb,
 'OSI', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 15 (easy)
('ماذا يطلق على الشبكة التي تربط أجهزة داخل الصف أو البيت؟', 'multiple_choice',
 '["LAN", "WAN", "WLAN", "MAN"]'::jsonb,
 'LAN', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 16 (easy)
('ما هي وحدة قياس سرعة نقل البيانات؟', 'multiple_choice',
 '["متر", "كيلوغرام", "Mbps", "أمبير"]'::jsonb,
 'Mbps', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 17 (medium)
('أي جهاز يعمل كجسر بين الشبكة المحلية والإنترنت؟', 'multiple_choice',
 '["راوتر (Router)", "طابعة", "Switch", "كابل UTP"]'::jsonb,
 'راوتر (Router)', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 18 (medium)
('ما اسم العملية التي تُقسم فيها البيانات إلى وحدات صغيرة؟', 'multiple_choice',
 '["Segmentation", "Conversion", "Synchronization", "Transformation"]'::jsonb,
 'Segmentation', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 19 (hard)
('أي طبقة في نموذج OSI مسؤولة عن تحديد العناوين (IP Addressing)؟', 'multiple_choice',
 '["طبقة الشبكة (Network Layer)", "طبقة النقل (Transport)", "طبقة الفيزيائية (Physical)", "طبقة التطبيقات (Application)"]'::jsonb,
 'طبقة الشبكة (Network Layer)', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 20 (easy)
('ما الذي يميز شبكة Peer-to-Peer؟', 'multiple_choice',
 '["كل جهاز يمكنه أن يكون مرسلًا ومستقبلًا", "وجود خادم مركزي", "الحاجة إلى إنترنت", "سرعة عالية دائمًا"]'::jsonb,
 'كل جهاز يمكنه أن يكون مرسلًا ومستقبلًا', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 21 (medium)
('أي وسيلة اتصال تُستخدم غالبًا في المدارس والمنازل؟', 'multiple_choice',
 '["UTP", "Fiber", "WiMAX", "Coaxial"]'::jsonb,
 'UTP', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 22 (medium)
('ما اسم العملية التي يخرج فيها المستخدم من وضع المدير إلى وضع المستخدم؟', 'multiple_choice',
 '["Disable", "Enable", "End", "Start"]'::jsonb,
 'Disable', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 23 (hard)
('أي أمر يُستخدم لعرض الإعدادات الحالية في الراوتر؟', 'multiple_choice',
 '["show running-config", "show history", "config t", "enable"]'::jsonb,
 'show running-config', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 24 (easy)
('ما هو الكيان الذي يقوم بإدارة قواعد الشبكات عالميًا مثل Ethernet وWi-Fi؟', 'multiple_choice',
 '["IEEE", "TCP", "Cisco", "IP"]'::jsonb,
 'IEEE', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 25 (medium)
('أي جهاز يوجّه الإشارات بين عدة شبكات محلية؟', 'multiple_choice',
 '["راوتر", "Hub", "Switch", "Access Point"]'::jsonb,
 'راوتر', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 26 (medium)
('ماذا تسمى العملية التي يتم فيها اختبار إمكانية الاتصال بجهاز آخر عبر الشبكة؟', 'multiple_choice',
 '["Ping", "Traceroute", "Telnet", "Config"]'::jsonb,
 'Ping', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 27 (hard)
('أي طبقة في نموذج OSI مسؤولة عن تقديم البيانات بشكل مفهوم للمستخدم؟', 'multiple_choice',
 '["طبقة العرض (Presentation)", "طبقة النقل", "طبقة الشبكة", "الطبقة الفيزيائية"]'::jsonb,
 'طبقة العرض (Presentation)', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 28 (easy)
('ما هي وسيلة الربط الأكثر شيوعًا في الشبكات المحلية LAN؟', 'multiple_choice',
 '["كابل UTP", "Coaxial", "WiMAX", "Fiber"]'::jsonb,
 'كابل UTP', 'easy', 1, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 29 (medium)
('ماذا تسمى العملية التي يتم فيها إرسال البيانات إلى جميع الأجهزة في نفس الشبكة؟', 'multiple_choice',
 '["Broadcast", "Unicast", "Multicast", "Anycast"]'::jsonb,
 'Broadcast', 'medium', 2, '677407de-9c20-43e1-a029-203764d992fd', true),

-- Question 30 (hard)
('أي طبقة في نموذج TCP/IP مسؤولة عن تطبيقات المستخدم مثل البريد وتصفح الإنترنت؟', 'multiple_choice',
 '["طبقة التطبيقات (Application)", "طبقة النقل", "طبقة الشبكة", "طبقة الفيزيائية"]'::jsonb,
 'طبقة التطبيقات (Application)', 'hard', 3, '677407de-9c20-43e1-a029-203764d992fd', true);