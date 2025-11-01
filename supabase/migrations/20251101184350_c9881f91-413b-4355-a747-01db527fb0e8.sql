-- إضافة 4 بطاقات جديدة للعبة مغامرة المعرفة

-- إضافة البطاقات الأربع
INSERT INTO grade11_lessons (id, topic_id, title, order_index, is_active) VALUES 
('77777777-7777-7777-7777-777777777777', 'db2d8e62-bfd5-46f2-9da0-375a78af2041', 'البروتوكولات الأساسية والمنافذ', 400, true),
('88888888-8888-8888-8888-888888888888', 'a0003742-a635-468f-91b0-b1eae1a3c22b', 'بروتوكول NAT وآلياته', 401, true),
('99999999-9999-9999-9999-999999999999', '8328e392-b5b1-4fd2-9806-9a6b5f5704c4', 'نموذج OSI وطبقاته السبع', 402, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a7858235-6a1e-430d-8186-95eac77a6197', 'نموذج TCP/IP والمقارنة', 403, true);

-- ==========================================
-- البطاقة 1: البروتوكولات الأساسية والمنافذ
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('77777777-7777-7777-7777-777777777777', 'ما هو البروتوكول في الشبكات؟', 'multiple_choice', '["مجموعة قواعد ومعايير تحدد كيفية تبادل البيانات بين الأجهزة", "برنامج لحماية الشبكة من الفيروسات", "جهاز مادي لتوصيل الشبكات", "نوع من الكابلات"]'::jsonb, 'مجموعة قواعد ومعايير تحدد كيفية تبادل البيانات بين الأجهزة', 'easy', 10),

('77777777-7777-7777-7777-777777777777', 'ما هو رقم المنفذ (Port Number) الافتراضي لبروتوكول HTTP؟', 'multiple_choice', '["80", "443", "21", "25"]'::jsonb, '80', 'easy', 10),

('77777777-7777-7777-7777-777777777777', 'أي بروتوكول يستخدم للاتصال الآمن والمشفر عبر الويب؟', 'multiple_choice', '["HTTPS", "HTTP", "FTP", "SMTP"]'::jsonb, 'HTTPS', 'easy', 10),

('77777777-7777-7777-7777-777777777777', 'ما هو البروتوكول المستخدم لنقل الملفات بين الأجهزة؟', 'multiple_choice', '["FTP (File Transfer Protocol)", "HTTP", "DNS", "DHCP"]'::jsonb, 'FTP (File Transfer Protocol)', 'medium', 10),

('77777777-7777-7777-7777-777777777777', 'ما هو رقم المنفذ الافتراضي لبروتوكول HTTPS؟', 'multiple_choice', '["443", "80", "8080", "22"]'::jsonb, '443', 'medium', 10),

('77777777-7777-7777-7777-777777777777', 'أي بروتوكول يُستخدم لإرسال البريد الإلكتروني؟', 'multiple_choice', '["SMTP (Simple Mail Transfer Protocol)", "POP3", "IMAP", "HTTP"]'::jsonb, 'SMTP (Simple Mail Transfer Protocol)', 'medium', 10),

('77777777-7777-7777-7777-777777777777', 'ما هو رقم المنفذ الافتراضي لبروتوكول SSH؟', 'multiple_choice', '["22", "23", "3389", "21"]'::jsonb, '22', 'hard', 10),

('77777777-7777-7777-7777-777777777777', 'أي من البروتوكولات التالية يعمل في طبقة النقل (Transport Layer)؟', 'multiple_choice', '["TCP و UDP", "IP و ICMP", "HTTP و FTP", "Ethernet و Wi-Fi"]'::jsonb, 'TCP و UDP', 'hard', 10),

('77777777-7777-7777-7777-777777777777', 'ما الفرق الرئيسي بين TCP و UDP؟', 'multiple_choice', '["TCP يضمن توصيل البيانات بينما UDP لا يضمن ذلك", "UDP أبطأ من TCP", "TCP لا يحتاج إلى اتصال", "UDP يستخدم فقط في البريد الإلكتروني"]'::jsonb, 'TCP يضمن توصيل البيانات بينما UDP لا يضمن ذلك', 'hard', 10),

('77777777-7777-7777-7777-777777777777', 'ما هو رقم المنفذ الافتراضي لبروتوكول DNS؟', 'multiple_choice', '["53", "80", "443", "25"]'::jsonb, '53', 'medium', 10);

-- ==========================================
-- البطاقة 2: بروتوكول NAT وآلياته
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('88888888-8888-8888-8888-888888888888', 'ما هو بروتوكول NAT (Network Address Translation)؟', 'multiple_choice', '["تقنية لترجمة عناوين IP الخاصة إلى عناوين عامة والعكس", "بروتوكول لتشفير البيانات", "جهاز لتوجيه الحزم", "نوع من الكابلات"]'::jsonb, 'تقنية لترجمة عناوين IP الخاصة إلى عناوين عامة والعكس', 'easy', 10),

('88888888-8888-8888-8888-888888888888', 'لماذا نستخدم NAT في الشبكات؟', 'multiple_choice', '["لتوفير عناوين IP العامة والسماح لعدة أجهزة بمشاركة عنوان واحد", "لزيادة سرعة الإنترنت", "لتشفير البيانات فقط", "لتوصيل الكابلات"]'::jsonb, 'لتوفير عناوين IP العامة والسماح لعدة أجهزة بمشاركة عنوان واحد', 'easy', 10),

('88888888-8888-8888-8888-888888888888', 'ما هو Static NAT (الترجمة الثابتة)؟', 'multiple_choice', '["ترجمة دائمة بين عنوان IP خاص واحد وعنوان IP عام واحد", "ترجمة متغيرة حسب الحاجة", "ترجمة تستخدم المنافذ", "لا يوجد ترجمة"]'::jsonb, 'ترجمة دائمة بين عنوان IP خاص واحد وعنوان IP عام واحد', 'medium', 10),

('88888888-8888-8888-8888-888888888888', 'ما هو Dynamic NAT (الترجمة الديناميكية)؟', 'multiple_choice', '["ترجمة تستخدم مجموعة من العناوين العامة وتوزعها ديناميكياً على الأجهزة", "ترجمة ثابتة واحد لواحد", "ترجمة تستخدم المنافذ فقط", "لا تسمح بالاتصال بالإنترنت"]'::jsonb, 'ترجمة تستخدم مجموعة من العناوين العامة وتوزعها ديناميكياً على الأجهزة', 'medium', 10),

('88888888-8888-8888-8888-888888888888', 'ما هو PAT (Port Address Translation)؟', 'multiple_choice', '["ترجمة تسمح لعدة أجهزة بمشاركة عنوان IP عام واحد باستخدام منافذ مختلفة", "ترجمة واحد لواحد فقط", "لا تستخدم المنافذ", "ترجمة للعناوين الخاصة فقط"]'::jsonb, 'ترجمة تسمح لعدة أجهزة بمشاركة عنوان IP عام واحد باستخدام منافذ مختلفة', 'hard', 10),

('88888888-8888-8888-8888-888888888888', 'أي نوع من NAT يُعرف أيضاً بـ NAT Overload؟', 'multiple_choice', '["PAT (Port Address Translation)", "Static NAT", "Dynamic NAT", "لا يوجد"]'::jsonb, 'PAT (Port Address Translation)', 'medium', 10),

('88888888-8888-8888-8888-888888888888', 'ما هي إحدى مزايا استخدام NAT؟', 'multiple_choice', '["الحفاظ على عناوين IPv4 العامة وتوفيرها", "زيادة سرعة الشبكة فقط", "لا توجد مزايا", "تعقيد الشبكة"]'::jsonb, 'الحفاظ على عناوين IPv4 العامة وتوفيرها', 'easy', 10),

('88888888-8888-8888-8888-888888888888', 'ما هي إحدى عيوب NAT؟', 'multiple_choice', '["يمنع بعض البروتوكولات والتطبيقات من العمل بشكل صحيح", "يزيد من استهلاك الطاقة فقط", "لا توجد عيوب", "يقلل من الأمان"]'::jsonb, 'يمنع بعض البروتوكولات والتطبيقات من العمل بشكل صحيح', 'medium', 10),

('88888888-8888-8888-8888-888888888888', 'في أي جهاز شبكي يتم تطبيق NAT عادةً؟', 'multiple_choice', '["Router (الموجه)", "Switch فقط", "Hub فقط", "Cable فقط"]'::jsonb, 'Router (الموجه)', 'easy', 10),

('88888888-8888-8888-8888-888888888888', 'كم عنوان IP عام يحتاج PAT لخدمة آلاف الأجهزة؟', 'multiple_choice', '["عنوان IP عام واحد فقط", "عنوان لكل جهاز", "عنوانين على الأقل", "لا يحتاج عناوين عامة"]'::jsonb, 'عنوان IP عام واحد فقط', 'hard', 10);

-- ==========================================
-- البطاقة 3: نموذج OSI وطبقاته السبع
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('99999999-9999-9999-9999-999999999999', 'كم عدد طبقات نموذج OSI؟', 'multiple_choice', '["7 طبقات", "4 طبقات", "5 طبقات", "6 طبقات"]'::jsonb, '7 طبقات', 'easy', 10),

('99999999-9999-9999-9999-999999999999', 'ما هي الطبقة السابعة (العليا) في نموذج OSI؟', 'multiple_choice', '["Application Layer - طبقة التطبيقات", "Physical Layer - الطبقة الفيزيائية", "Network Layer - طبقة الشبكة", "Transport Layer - طبقة النقل"]'::jsonb, 'Application Layer - طبقة التطبيقات', 'easy', 10),

('99999999-9999-9999-9999-999999999999', 'ما هي الطبقة الأولى (السفلى) في نموذج OSI؟', 'multiple_choice', '["Physical Layer - الطبقة الفيزيائية", "Application Layer", "Data Link Layer", "Network Layer"]'::jsonb, 'Physical Layer - الطبقة الفيزيائية', 'easy', 10),

('99999999-9999-9999-9999-999999999999', 'في أي طبقة من OSI يعمل بروتوكول IP؟', 'multiple_choice', '["Network Layer - طبقة الشبكة (الطبقة 3)", "Transport Layer (الطبقة 4)", "Application Layer (الطبقة 7)", "Physical Layer (الطبقة 1)"]'::jsonb, 'Network Layer - طبقة الشبكة (الطبقة 3)', 'medium', 10),

('99999999-9999-9999-9999-999999999999', 'في أي طبقة من OSI يعمل بروتوكول TCP؟', 'multiple_choice', '["Transport Layer - طبقة النقل (الطبقة 4)", "Network Layer (الطبقة 3)", "Application Layer (الطبقة 7)", "Data Link Layer (الطبقة 2)"]'::jsonb, 'Transport Layer - طبقة النقل (الطبقة 4)', 'medium', 10),

('99999999-9999-9999-9999-999999999999', 'ما هي وظيفة Data Link Layer (الطبقة 2)؟', 'multiple_choice', '["توفير اتصال موثوق بين عقدتين متجاورتين ومعالجة عناوين MAC", "توجيه الحزم بين الشبكات", "تشفير البيانات", "إدارة الجلسات"]'::jsonb, 'توفير اتصال موثوق بين عقدتين متجاورتين ومعالجة عناوين MAC', 'medium', 10),

('99999999-9999-9999-9999-999999999999', 'ما اسم وحدة البيانات (PDU) في طبقة النقل (Transport Layer)؟', 'multiple_choice', '["Segment", "Packet", "Frame", "Bit"]'::jsonb, 'Segment', 'hard', 10),

('99999999-9999-9999-9999-999999999999', 'ما اسم وحدة البيانات (PDU) في طبقة الشبكة (Network Layer)؟', 'multiple_choice', '["Packet", "Segment", "Frame", "Data"]'::jsonb, 'Packet', 'hard', 10),

('99999999-9999-9999-9999-999999999999', 'ما هي وظيفة Presentation Layer (طبقة التقديم - الطبقة 6)؟', 'multiple_choice', '["تنسيق البيانات وتشفيرها وضغطها", "توجيه الحزم", "إدارة عناوين MAC", "إرسال البتات"]'::jsonb, 'تنسيق البيانات وتشفيرها وضغطها', 'medium', 10),

('99999999-9999-9999-9999-999999999999', 'أي طبقة في OSI مسؤولة عن إدارة الجلسات بين التطبيقات؟', 'multiple_choice', '["Session Layer - طبقة الجلسة (الطبقة 5)", "Transport Layer (الطبقة 4)", "Application Layer (الطبقة 7)", "Network Layer (الطبقة 3)"]'::jsonb, 'Session Layer - طبقة الجلسة (الطبقة 5)', 'hard', 10);

-- ==========================================
-- البطاقة 4: نموذج TCP/IP والمقارنة
-- ==========================================
INSERT INTO grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, points) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'كم عدد طبقات نموذج TCP/IP؟', 'multiple_choice', '["4 طبقات", "7 طبقات", "5 طبقات", "3 طبقات"]'::jsonb, '4 طبقات', 'easy', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ما هي طبقات نموذج TCP/IP من الأعلى للأسفل؟', 'multiple_choice', '["Application, Transport, Internet, Network Access", "Application, Presentation, Session, Transport", "Physical, Data Link, Network, Transport", "Application, Network, Data Link, Physical"]'::jsonb, 'Application, Transport, Internet, Network Access', 'medium', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ما هو الفرق الرئيسي بين OSI و TCP/IP؟', 'multiple_choice', '["OSI نموذج نظري بـ 7 طبقات، TCP/IP نموذج عملي بـ 4 طبقات", "TCP/IP أقدم من OSI", "OSI لا يستخدم في الشبكات الحقيقية", "لا يوجد فرق"]'::jsonb, 'OSI نموذج نظري بـ 7 طبقات، TCP/IP نموذج عملي بـ 4 طبقات', 'medium', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'أي طبقة في TCP/IP تقابل طبقات Application و Presentation و Session في OSI؟', 'multiple_choice', '["Application Layer في TCP/IP", "Transport Layer", "Internet Layer", "Network Access Layer"]'::jsonb, 'Application Layer في TCP/IP', 'hard', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ما هي وظيفة Internet Layer في نموذج TCP/IP؟', 'multiple_choice', '["توجيه الحزم بين الشبكات المختلفة باستخدام عناوين IP", "نقل البيانات بشكل موثوق", "توفير واجهة للتطبيقات", "إرسال البتات على الوسط المادي"]'::jsonb, 'توجيه الحزم بين الشبكات المختلفة باستخدام عناوين IP', 'medium', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'أي طبقة في TCP/IP تقابل طبقتي Physical و Data Link في OSI؟', 'multiple_choice', '["Network Access Layer في TCP/IP", "Application Layer", "Transport Layer", "Internet Layer"]'::jsonb, 'Network Access Layer في TCP/IP', 'hard', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ما هي البروتوكولات الرئيسية في Transport Layer لنموذج TCP/IP؟', 'multiple_choice', '["TCP و UDP", "IP و ICMP", "HTTP و FTP", "Ethernet و Wi-Fi"]'::jsonb, 'TCP و UDP', 'medium', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'أي بروتوكول يعمل في Internet Layer من TCP/IP؟', 'multiple_choice', '["IP (Internet Protocol)", "TCP", "HTTP", "Ethernet"]'::jsonb, 'IP (Internet Protocol)', 'easy', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'لماذا يُعتبر نموذج TCP/IP أكثر عملية من OSI؟', 'multiple_choice', '["لأنه تم تطويره بناءً على تطبيقات عملية ويستخدم فعلياً في الإنترنت", "لأنه أقدم من OSI", "لأنه أبسط ولا يحتاج معرفة تقنية", "لأنه لا يحتاج بروتوكولات"]'::jsonb, 'لأنه تم تطويره بناءً على تطبيقات عملية ويستخدم فعلياً في الإنترنت', 'hard', 10),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ما هو الاسم الآخر لـ Network Access Layer في TCP/IP؟', 'multiple_choice', '["Link Layer أو Network Interface Layer", "Physical Layer فقط", "Application Layer", "Session Layer"]'::jsonb, 'Link Layer أو Network Interface Layer', 'medium', 10);