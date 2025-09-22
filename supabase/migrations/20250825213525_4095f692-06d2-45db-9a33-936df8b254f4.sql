-- Insert Section 17: VLAN - الشبكات المحلية الافتراضية
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('VLAN - الشبكات المحلية الافتراضية', 'VLAN هي تقنية تسمح بتقسيم شبكة محلية واحدة إلى عدة شبكات منطقية منفصلة، حتى لو كانت الأجهزة متصلة بنفس السويتش. هذا يزيد الأمان، يقلل الازدحام، ويسهل إدارة الشبكات الكبيرة.', 17);

-- Insert topics for Section 17
WITH section_17 AS (
  SELECT id FROM public.grade11_sections WHERE title = 'VLAN - الشبكات المحلية الافتراضية'
)
INSERT INTO public.grade11_topics (section_id, title, content, order_index) 
SELECT 
  section_17.id,
  topic_data.title,
  topic_data.content,
  topic_data.order_index
FROM section_17, (VALUES 
  ('نظرة عامة على VLAN (סקירה על VLAN)', 'مقدمة شاملة عن VLAN ومزاياها وأنواعها', 1),
  ('VLAN في شبكة مترابطة (VLAN ברשת מרובת מתגים)', 'كيفية عمل VLAN عبر عدة سويتشات باستخدام TRUNK', 2),
  ('إعداد VLAN على السويتش (הגדרת VLAN על המתג)', 'الخطوات العملية لإنشاء وإدارة VLAN', 3),
  ('TRUNK', 'إعداد وإدارة وصلات TRUNK بين السويتشات', 4),
  ('DTP (Dynamic Trunking Protocol)', 'بروتوكول التفاوض التلقائي لوصلات TRUNK', 5),
  ('VTP (VLAN Trunking Protocol)', 'بروتوكول إدارة VLAN عبر عدة سويتشات', 6)
) AS topic_data(title, content, order_index);

-- Insert lessons for Section 17
WITH section_topics AS (
  SELECT t.id, t.title, ROW_NUMBER() OVER (ORDER BY t.order_index) as topic_num
  FROM grade11_topics t
  JOIN grade11_sections s ON t.section_id = s.id
  WHERE s.title = 'VLAN - الشبكات المحلية الافتراضية'
  ORDER BY t.order_index
)
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index)
SELECT 
  section_topics.id,
  lesson_data.title,
  lesson_data.content,
  lesson_data.order_index
FROM section_topics
JOIN (VALUES 
  -- Topic 1: نظرة عامة على VLAN
  (1, 'ما هي VLAN', 'VLAN هي شبكة محلية افتراضية تُنشأ داخل السويتش لتقسيم الأجهزة إلى مجموعات منطقية. هذا يعني أن الطلاب والمعلمين في نفس المبنى يمكن وضعهم في شبكتين منفصلتين دون تغيير الكابلات.', 1),
  (1, 'مزايا VLAN', 'VLAN تعطي أمانًا أكبر لأنها تفصل بين المجموعات، وأداءً أفضل لأنها تقلل رسائل البث، وإدارة أسهل حيث يمكن تحديد من ينتمي لأي شبكة.', 2),
  (1, 'أنواع VLAN', 'من الأمثلة: Default VLAN وهي الافتراضية دائمًا (عادةً VLAN1)، وManagement VLAN وهي VLAN خاصة بإدارة السويتش.', 3),
  -- Topic 2: VLAN في شبكة مترابطة
  (2, 'ما هو TRUNK', 'وصلة Trunk هي اتصال بين سويتشين ينقل أكثر من VLAN في نفس الوقت باستخدام تقنية الوسم (Tagging).', 1),
  (2, 'ما هو VLAN TAG', 'الـTag هو علامة تُضاف للإطار لتحديد أي VLAN ينتمي لها أثناء مروره عبر الوصلة.', 2),
  (2, 'ما هو Native VLAN وعلاقته بـ802.1Q', 'Native VLAN هي VLAN التي تمر عبر الوصلة بدون وسم (Untagged). معيار 802.1Q هو البروتوكول المستخدم لوضع الوسم على الإطارات بين السويتشات.', 3),
  -- Topic 3: إعداد VLAN على السويتش
  (3, 'أنواع الأرقام الخاصة بالـVLAN', 'لكل VLAN رقم (ID) يميزها. مثل VLAN10 أو VLAN20، ولا يمكن أن يتكرر الرقم نفسه مرتين على نفس السويتش.', 1),
  (3, 'الأوامر لتعريف VLAN', 'يتم إنشاء VLAN باستخدام أوامر مثل vlan 10 ثم إعطائها اسمًا يوضح وظيفتها.', 2),
  (3, 'ربط المنافذ مع VLAN', 'يمكن تخصيص منفذ معين ليكون جزءًا من VLAN عبر الأمر switchport access vlan 10.', 3),
  (3, 'تعديل أو حذف VLAN', 'يمكن تغيير إعدادات منفذ من VLAN إلى أخرى أو حذف VLAN غير مستخدمة لتحسين إدارة الشبكة.', 4),
  -- Topic 4: TRUNK
  (4, 'أوامر إعداد Trunk', 'تُستخدم أوامر مثل switchport mode trunk لتحويل المنفذ إلى وضع Trunk ونقل أكثر من VLAN.', 1),
  (4, 'التحقق من إعداد Trunk', 'بأوامر مثل show interfaces trunk يمكن التأكد من أن الوصلة تعمل بشكل صحيح وتنقل جميع الـVLANs.', 2),
  (4, 'إعادة Trunk للوضع الأصلي', 'يمكن إرجاع المنفذ إلى Access Mode عبر الأمر switchport mode access.', 3),
  -- Topic 5: DTP
  (5, 'ما هو DTP', 'بروتوكول DTP يُستخدم لتبادل التفاوض بين السويتشات لتحديد ما إذا كان المنفذ سيكون Access أو Trunk. يُستخدم في طبقة البيانات فقط.', 1),
  -- Topic 6: VTP
  (6, 'ما هو VTP', 'VTP هو بروتوكول يُسهّل إدارة VLAN بين عدة سويتشات. عند إنشاء VLAN على سويتش رئيسي، تُوزع تلقائيًا على باقي السويتشات في نفس المجال.', 1),
  (6, 'إعداد VTP', 'يمكن ضبط السويتش كـServer أو Client أو Transparent. كذلك يتم تحديد مجال (Domain) وكلمة مرور (Password) لتأمين التوزيع.', 2),
  (6, 'أوامر التحقق من VTP', 'الأوامر مثل show vtp status وshow vtp password تُستخدم للتأكد من عمل البروتوكول بشكل صحيح.', 3)
) AS lesson_data(topic_num, title, content, order_index) 
ON section_topics.topic_num = lesson_data.topic_num;