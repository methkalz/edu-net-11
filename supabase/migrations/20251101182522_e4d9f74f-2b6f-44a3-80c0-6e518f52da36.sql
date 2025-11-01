-- إنشاء البطاقتين في موضوع عناوين الشبكة
INSERT INTO grade11_lessons (id, topic_id, title, content, order_index, is_active)
VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'بطاقة 1: عناوين IP الأساسية',
  '<p>🎯 بطاقة لعبة تحتوي على 10 أسئلة حول:</p><ul><li>تعريف العنوان المنطقي (IP)</li><li>فئات العناوين (Classes)</li><li>العناوين العامة والخاصة</li><li>Subnet Mask</li></ul>',
  200,
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'بطاقة 2: IPv6 وتمثيل الأرقام',
  '<p>🎯 بطاقة لعبة تحتوي على 10 أسئلة حول:</p><ul><li>IPv6 وخصائصه</li><li>الفرق بين IPv4 و IPv6</li><li>طرق تمثيل الأرقام (Binary, Decimal, Hex)</li><li>تحويل الأرقام</li></ul>',
  201,
  true
);

-- البطاقة 1: عناوين IP الأساسية - 10 أسئلة
-- أسئلة سهلة (4)
INSERT INTO grade11_game_questions (lesson_id, topic_id, question_text, question_type, difficulty_level, choices, correct_answer, points)
VALUES
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو العنوان المنطقي IP Address؟',
  'multiple_choice',
  'easy',
  '[{"text": "عنوان فيزيائي مطبوع على كرت الشبكة", "isCorrect": false}, {"text": "عنوان منطقي يُعطى للجهاز للتواصل في الشبكة", "isCorrect": true}, {"text": "رقم تسلسلي للجهاز", "isCorrect": false}, {"text": "اسم الجهاز في الشبكة", "isCorrect": false}]'::jsonb,
  'عنوان منطقي يُعطى للجهاز للتواصل في الشبكة',
  10
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'كم عدد الأرقام (octets) في عنوان IPv4؟',
  'multiple_choice',
  'easy',
  '[{"text": "2", "isCorrect": false}, {"text": "4", "isCorrect": true}, {"text": "6", "isCorrect": false}, {"text": "8", "isCorrect": false}]'::jsonb,
  '4',
  10
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو Subnet Mask؟',
  'multiple_choice',
  'easy',
  '[{"text": "قناع يحدد جزء الشبكة من عنوان IP", "isCorrect": true}, {"text": "بروتوكول لتشفير البيانات", "isCorrect": false}, {"text": "جهاز لتوزيع الإشارة", "isCorrect": false}, {"text": "نوع من الكابلات", "isCorrect": false}]'::jsonb,
  'قناع يحدد جزء الشبكة من عنوان IP',
  10
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'أي من العناوين التالية هو عنوان IP خاص؟',
  'multiple_choice',
  'easy',
  '[{"text": "8.8.8.8", "isCorrect": false}, {"text": "192.168.1.1", "isCorrect": true}, {"text": "1.1.1.1", "isCorrect": false}, {"text": "104.26.10.1", "isCorrect": false}]'::jsonb,
  '192.168.1.1',
  10
);

-- أسئلة متوسطة (4)
INSERT INTO grade11_game_questions (lesson_id, topic_id, question_text, question_type, difficulty_level, choices, correct_answer, points)
VALUES
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو نطاق عناوين Class A؟',
  'multiple_choice',
  'medium',
  '[{"text": "1.0.0.0 إلى 126.0.0.0", "isCorrect": true}, {"text": "128.0.0.0 إلى 191.255.0.0", "isCorrect": false}, {"text": "192.0.0.0 إلى 223.255.255.0", "isCorrect": false}, {"text": "224.0.0.0 إلى 239.255.255.255", "isCorrect": false}]'::jsonb,
  '1.0.0.0 إلى 126.0.0.0',
  20
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما الفرق بين Public IP و Private IP؟',
  'multiple_choice',
  'medium',
  '[{"text": "Public يُستخدم على الإنترنت، Private داخل الشبكة المحلية", "isCorrect": true}, {"text": "Public أسرع من Private", "isCorrect": false}, {"text": "Private مشفّر أكثر من Public", "isCorrect": false}, {"text": "لا يوجد فرق بينهما", "isCorrect": false}]'::jsonb,
  'Public يُستخدم على الإنترنت، Private داخل الشبكة المحلية',
  20
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو العنوان الافتراضي لـ Subnet Mask في Class C؟',
  'multiple_choice',
  'medium',
  '[{"text": "255.0.0.0", "isCorrect": false}, {"text": "255.255.0.0", "isCorrect": false}, {"text": "255.255.255.0", "isCorrect": true}, {"text": "255.255.255.255", "isCorrect": false}]'::jsonb,
  '255.255.255.0',
  20
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'أي فئة من عناوين IP تُستخدم للبث المتعدد (Multicast)؟',
  'multiple_choice',
  'medium',
  '[{"text": "Class A", "isCorrect": false}, {"text": "Class B", "isCorrect": false}, {"text": "Class C", "isCorrect": false}, {"text": "Class D", "isCorrect": true}]'::jsonb,
  'Class D',
  20
);

-- أسئلة صعبة (2)
INSERT INTO grade11_game_questions (lesson_id, topic_id, question_text, question_type, difficulty_level, choices, correct_answer, points)
VALUES
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'كم عدد العناوين المتاحة في شبكة 192.168.1.0/24؟',
  'multiple_choice',
  'hard',
  '[{"text": "254 عنوان قابل للاستخدام", "isCorrect": true}, {"text": "256 عنوان", "isCorrect": false}, {"text": "128 عنوان", "isCorrect": false}, {"text": "512 عنوان", "isCorrect": false}]'::jsonb,
  '254 عنوان قابل للاستخدام',
  30
),
(
  '33333333-3333-3333-3333-333333333333',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو Network Address و Broadcast Address في شبكة 172.16.0.0/16؟',
  'multiple_choice',
  'hard',
  '[{"text": "Network: 172.16.0.0, Broadcast: 172.16.255.255", "isCorrect": true}, {"text": "Network: 172.16.0.1, Broadcast: 172.16.255.254", "isCorrect": false}, {"text": "Network: 172.16.1.0, Broadcast: 172.16.254.255", "isCorrect": false}, {"text": "Network: 172.0.0.0, Broadcast: 172.255.255.255", "isCorrect": false}]'::jsonb,
  'Network: 172.16.0.0, Broadcast: 172.16.255.255',
  30
);

-- البطاقة 2: IPv6 وتمثيل الأرقام - 10 أسئلة
-- أسئلة سهلة (4)
INSERT INTO grade11_game_questions (lesson_id, topic_id, question_text, question_type, difficulty_level, choices, correct_answer, points)
VALUES
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'كم عدد البتات (bits) في عنوان IPv6؟',
  'multiple_choice',
  'easy',
  '[{"text": "32 bit", "isCorrect": false}, {"text": "64 bit", "isCorrect": false}, {"text": "128 bit", "isCorrect": true}, {"text": "256 bit", "isCorrect": false}]'::jsonb,
  '128 bit',
  10
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو النظام العددي المستخدم لكتابة IPv6؟',
  'multiple_choice',
  'easy',
  '[{"text": "النظام الثنائي (Binary)", "isCorrect": false}, {"text": "النظام العشري (Decimal)", "isCorrect": false}, {"text": "النظام الست عشري (Hexadecimal)", "isCorrect": true}, {"text": "النظام الثماني (Octal)", "isCorrect": false}]'::jsonb,
  'النظام الست عشري (Hexadecimal)',
  10
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'كيف نحول الرقم الثنائي 1111 إلى النظام العشري؟',
  'multiple_choice',
  'easy',
  '[{"text": "10", "isCorrect": false}, {"text": "15", "isCorrect": true}, {"text": "16", "isCorrect": false}, {"text": "11", "isCorrect": false}]'::jsonb,
  '15',
  10
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما الرمز المستخدم للفصل بين مجموعات IPv6؟',
  'multiple_choice',
  'easy',
  '[{"text": "النقطة (.)", "isCorrect": false}, {"text": "النقطتان الرأسيتان (:)", "isCorrect": true}, {"text": "الشرطة المائلة (/)", "isCorrect": false}, {"text": "الفاصلة (,)", "isCorrect": false}]'::jsonb,
  'النقطتان الرأسيتان (:)',
  10
);

-- أسئلة متوسطة (4)
INSERT INTO grade11_game_questions (lesson_id, topic_id, question_text, question_type, difficulty_level, choices, correct_answer, points)
VALUES
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو الفرق الرئيسي بين IPv4 و IPv6 من حيث عدد العناوين؟',
  'multiple_choice',
  'medium',
  '[{"text": "IPv6 يوفر عناوين أكثر بكثير من IPv4", "isCorrect": true}, {"text": "IPv4 أسرع من IPv6", "isCorrect": false}, {"text": "لا يوجد فرق", "isCorrect": false}, {"text": "IPv4 أكثر أماناً", "isCorrect": false}]'::jsonb,
  'IPv6 يوفر عناوين أكثر بكثير من IPv4',
  20
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'كيف نحول الرقم العشري 192 إلى النظام الثنائي؟',
  'multiple_choice',
  'medium',
  '[{"text": "11000000", "isCorrect": true}, {"text": "10101010", "isCorrect": false}, {"text": "11111111", "isCorrect": false}, {"text": "10000001", "isCorrect": false}]'::jsonb,
  '11000000',
  20
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هي قاعدة اختصار عنوان IPv6؟',
  'multiple_choice',
  'medium',
  '[{"text": "حذف الأصفار البادئة واستبدال مجموعة أصفار متتالية بـ ::", "isCorrect": true}, {"text": "حذف جميع الأصفار من العنوان", "isCorrect": false}, {"text": "استبدال الأرقام بحروف", "isCorrect": false}, {"text": "تقسيم العنوان إلى نصفين", "isCorrect": false}]'::jsonb,
  'حذف الأصفار البادئة واستبدال مجموعة أصفار متتالية بـ ::',
  20
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو عنوان Loopback في IPv6؟',
  'multiple_choice',
  'medium',
  '[{"text": "127.0.0.1", "isCorrect": false}, {"text": "::1", "isCorrect": true}, {"text": "0:0:0:0:0:0:0:0", "isCorrect": false}, {"text": "FF00::1", "isCorrect": false}]'::jsonb,
  '::1',
  20
);

-- أسئلة صعبة (2)
INSERT INTO grade11_game_questions (lesson_id, topic_id, question_text, question_type, difficulty_level, choices, correct_answer, points)
VALUES
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'حول عنوان IPv6 التالي للشكل المختصر: 2001:0db8:0000:0000:0000:ff00:0042:8329',
  'multiple_choice',
  'hard',
  '[{"text": "2001:db8::ff00:42:8329", "isCorrect": true}, {"text": "2001:db8:0:0:0:ff00:42:8329", "isCorrect": false}, {"text": "2001:0db8::ff00:0042:8329", "isCorrect": false}, {"text": "2001:db8:ff00:42:8329", "isCorrect": false}]'::jsonb,
  '2001:db8::ff00:42:8329',
  30
),
(
  '44444444-4444-4444-4444-444444444444',
  '4295cd31-e59e-418d-bac6-a103355e0ac4',
  'ما هو الرقم الست عشري (Hexadecimal) المكافئ للرقم الثنائي 11010110؟',
  'multiple_choice',
  'hard',
  '[{"text": "D6", "isCorrect": true}, {"text": "C6", "isCorrect": false}, {"text": "E6", "isCorrect": false}, {"text": "A6", "isCorrect": false}]'::jsonb,
  'D6',
  30
);