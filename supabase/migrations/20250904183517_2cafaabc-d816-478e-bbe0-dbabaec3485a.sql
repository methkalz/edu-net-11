-- إضافة أزواج المستوى الثالث: البروتوكولات والنماذج

-- المستوى 3 المرحلة 1: قوانين البروتوكولات
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('65972433-86dd-4601-88f6-e55d1ba998c0', 'المرسل (Sender)', 'الجهاز الذي يبدأ عملية الاتصال', 'term', 'definition', 'الطرف الذي ينشئ الرسالة ويرسلها', 1),
('65972433-86dd-4601-88f6-e55d1ba998c0', 'المستقبل (Receiver)', 'الجهاز الذي يستقبل ويعالج البيانات', 'term', 'definition', 'الطرف الذي يستلم الرسالة ويفسرها', 2),
('65972433-86dd-4601-88f6-e55d1ba998c0', 'القناة المشتركة', 'الوسط الذي تنتقل عبره البيانات', 'term', 'definition', 'الطريق أو الوسيلة لنقل المعلومات', 3),
('65972433-86dd-4601-88f6-e55d1ba998c0', 'قوانين البروتوكول', 'القواعد التي تحكم عملية التواصل', 'term', 'definition', 'الاتفاقيات التي تضمن نجاح التواصل', 4);

-- المستوى 3 المرحلة 2: حزمة بروتوكولات TCP/IP
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'TCP/IP Suite', 'مجموعة بروتوكولات الإنترنت الأساسية', 'term', 'definition', 'المجموعة الأساسية للاتصال عبر الإنترنت', 1),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'IEEE', 'منظمة معايير الكهرباء والإلكترونيات', 'term', 'definition', 'تضع معايير للتقنيات الكهربائية', 2),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'IETF', 'مجموعة عمل هندسة الإنترنت', 'term', 'definition', 'تطور معايير وبروتوكولات الإنترنت', 3),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'RFC', 'طلب للتعليقات - وثائق المعايير', 'term', 'definition', 'وثائق تحتوي على مواصفات التقنيات', 4),
('7fe8ace2-e114-47e6-ad44-fd3aab96ee13', 'Standardization', 'توحيد القوانين لضمان التوافق', 'term', 'definition', 'جعل الأجهزة تتفاهم مع بعضها البعض', 5);

-- المستوى 3 المرحلة 3: نموذج الطبقات OSI وTCP/IP
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Physical Layer', 'طبقة فيزيائية - الإشارات والكابلات', 'term', 'definition', 'الطبقة الأولى - التوصيلات المادية', 1),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Data Link Layer', 'طبقة ربط البيانات - إطارات الإيثرنت', 'term', 'definition', 'الطبقة الثانية - التحكم في الوصول للوسط', 2),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Network Layer', 'طبقة الشبكة - التوجيه والعناوين IP', 'term', 'definition', 'الطبقة الثالثة - توجيه البيانات', 3),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Transport Layer', 'طبقة النقل - TCP وUDP', 'term', 'definition', 'الطبقة الرابعة - ضمان التسليم الصحيح', 4),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'Application Layer', 'طبقة التطبيق - البرامج والخدمات', 'term', 'definition', 'الطبقة العليا - التطبيقات التي يستخدمها المستخدم', 5),
('ba9aa974-b000-4d6c-a3b4-a4aa0da76445', 'OSI Model', 'نموذج من 7 طبقات للشبكات', 'term', 'definition', 'نموذج مرجعي لفهم كيفية عمل الشبكات', 6);

-- المستوى 3 المرحلة 4: تغليف البيانات
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Data Encapsulation', 'عملية تغليف البيانات عبر الطبقات', 'term', 'definition', 'إضافة معلومات تحكم لكل طبقة', 1),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Segments', 'وحدة البيانات في طبقة النقل', 'term', 'definition', 'البيانات مع معلومات TCP أو UDP', 2),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Packets', 'وحدة البيانات في طبقة الشبكة', 'term', 'definition', 'البيانات مع عناوين IP المصدر والهدف', 3),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Frames', 'وحدة البيانات في طبقة ربط البيانات', 'term', 'definition', 'البيانات مع عناوين MAC للأجهزة المجاورة', 4),
('a69327fa-e3e2-455a-a9a4-0a0616f49921', 'Bits', 'وحدة البيانات في الطبقة الفيزيائية', 'term', 'definition', 'الإشارات الكهربائية أو الضوئية', 5);