-- Add Section 18: Inter-VLAN Routing
INSERT INTO public.grade11_sections (title, description, order_index, created_by) VALUES
('Inter-VLAN Routing - التوجيه بين شبكات VLAN', 'شبكات VLAN تفصل الأجهزة إلى مجموعات منطقية، لكن الأجهزة في VLAN مختلفة لا تستطيع التواصل مع بعضها بشكل مباشر. هنا يأتي دور Inter-VLAN Routing الذي يسمح بتمرير البيانات بين VLANs مختلفة باستخدام الراوتر أو السويتش متعدد الطبقات.', 18, NULL);

-- Add Topics for Section 18
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_sections WHERE order_index = 18), 'آلية عمل Inter-VLAN Routing', 'كيفية عمل التوجيه بين شبكات VLAN المختلفة', 1),
((SELECT id FROM public.grade11_sections WHERE order_index = 18), 'بروتوكول DOT1Q', 'البروتوكول المسؤول عن وسم إطارات VLAN', 2),
((SELECT id FROM public.grade11_sections WHERE order_index = 18), 'حلول مشاكل Inter-VLAN Routing', 'كيفية تشخيص وحل مشاكل التوجيه بين VLANs', 3);

-- Add Lessons for Topic 1: آلية عمل Inter-VLAN Routing
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 1), 'ما هو Inter-VLAN Routing؟', 'هو عملية نقل البيانات بين شبكات VLAN مختلفة. بدون هذا التوجيه، كل VLAN تعمل كشبكة منفصلة تمامًا.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 1), 'Inter-VLAN Routing قديمًا', 'في الماضي كان يتم باستخدام راوتر مع عدة منافذ فيزيائية، كل منفذ مخصص لـVLAN مختلفة. هذه الطريقة بطيئة لأنها تحتاج لعدة كابلات.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 1), 'التوجيه باستخدام سويتش متعدد الطبقات (Router on a Stick)', 'اليوم غالبًا يتم عبر سويتش من الطبقة الثالثة أو باستخدام راوتر مع منفذ واحد مُقسم إلى Sub-Interfaces لكل VLAN.', 3);

-- Add Lessons for Topic 2: بروتوكول DOT1Q
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 2), 'ما هو بروتوكول DOT1Q؟', 'هو البروتوكول المسؤول عن وضع علامة (Tag) على كل إطار لتحديد أي VLAN ينتمي لها أثناء مروره عبر وصلة Trunk. بفضله يمكن لمنفذ واحد أن ينقل عدة VLANs', 1);

-- Add Lessons for Topic 3: حلول مشاكل Inter-VLAN Routing
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 3), 'مشاكل شائعة', 'من المشاكل المعروفة أن الأجهزة لا تستطيع التواصل بسبب خطأ في إعداد Trunk أو نسيان تفعيل Sub-Interface.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 3), 'التحقق باستخدام أوامر', 'أوامر مثل show vlan brief وshow ip route تساعد في معرفة إذا كانت VLANs معرفة بشكل صحيح وإن كان التوجيه يعمل.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 3), 'اختبار الاتصال', 'Ping بين جهازين في VLAN مختلفة يثبت أن التوجيه بين VLANs يعمل.', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 18) AND order_index = 3), 'مثال تطبيقي', 'إذا كان حاسوب في VLAN10 بعنوان 192.168.10.10 يمكنه الاتصال بحاسوب في VLAN20 بعنوان 192.168.20.20 بعد إعداد Inter-VLAN Routing.', 4);