-- Add Section 19: DHCP - بروتوكول توزيع العناوين
INSERT INTO public.grade11_sections (title, description, order_index, created_by) VALUES
('DHCP - بروتوكول توزيع العناوين', 'بروتوكول DHCP يوزع عناوين IP بشكل تلقائي على الأجهزة المتصلة بالشبكة، بدل أن يقوم مدير الشبكة بإعداد كل جهاز يدويًا.', 19, NULL);

-- Add Section 20: إعدادات الأمان في السويتش
INSERT INTO public.grade11_sections (title, description, order_index, created_by) VALUES
('הגדרות אבטחה במתג - إعدادات الأمان في السويتش', 'السويتشات الحديثة توفر ميزات أمان لحماية الشبكة من الهجمات أو الاستخدام غير المصرح به، خصوصًا عبر تقنية Port Security.', 20, NULL);

-- Add Topics for Section 19: DHCP
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_sections WHERE order_index = 19), 'مفاهيم في DHCP', 'المفاهيم الأساسية لبروتوكول DHCP وآلية عمله', 1),
((SELECT id FROM public.grade11_sections WHERE order_index = 19), 'إعداد DHCP على الراوتر', 'كيفية تكوين خادم DHCP على الراوتر', 2),
((SELECT id FROM public.grade11_sections WHERE order_index = 19), 'إعداد DHCP كعميل', 'إعداد الراوتر والأجهزة كعملاء DHCP', 3);

-- Add Topics for Section 20: Switch Security
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_sections WHERE order_index = 20), 'تطبيق الأمان في السويتش', 'كيفية تطبيق إعدادات الأمان في السويتش', 1),
((SELECT id FROM public.grade11_sections WHERE order_index = 20), 'أوضاع Port Security', 'الأوضاع المختلفة لميزة Port Security', 2),
((SELECT id FROM public.grade11_sections WHERE order_index = 20), 'التحقق من الأمان', 'كيفية التحقق من إعدادات الأمان والمراقبة', 3);

-- Add Lessons for Section 19 Topic 1: مفاهيم في DHCP
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 1), 'خادم وعميل DHCP', 'الخادم (Server) يعطي عناوين IP، والعميل (Client) مثل الحاسوب أو الهاتف يستقبلها ويستخدمها.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 1), 'وظيفة DHCP', 'يُسهل إدارة الشبكة عبر توزيع عناوين IP، مع قناع الشبكة (Subnet Mask)، والبوابة الافتراضية (Gateway)، وخوادم DNS تلقائيًا.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 1), 'المراحل الأربع لعمل DHCP', 'تمر العملية بأربع خطوات: Discover (اكتشاف)، Offer (عرض)، Request (طلب)، Acknowledge (تأكيد).', 3);

-- Add Lessons for Section 19 Topic 2: إعداد DHCP على الراوتر
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 2), 'خطوات الإعداد', 'نُعرّف نطاق العناوين (Pool)، نحدد الشبكة، قناع الشبكة، والبوابة، مع استثناء عناوين الخوادم الثابتة.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 2), 'IP Helper', 'يُستخدم عندما يكون خادم DHCP في شبكة بعيدة، حيث يقوم الراوتر بتمرير طلبات DHCP عبر Relay.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 2), 'DHCP Relay', 'ميزة تجعل الراوتر وسيطًا بين العميل والخادم إذا لم يكونا في نفس الشبكة.', 3);

-- Add Lessons for Section 19 Topic 3: إعداد DHCP كعميل
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 3), 'إعداد الراوتر كعميل DHCP', 'يمكن للراوتر نفسه أن يحصل على عنوان IP من خادم DHCP عبر الأمر ip address dhcp.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 19) AND order_index = 3), 'إعداد جهاز بيتي', 'في الشبكات المنزلية، المودم يعمل كخادم DHCP ويعطي كل الأجهزة المتصلة عناوين تلقائية.', 2);

-- Add Lessons for Section 20 Topic 1: تطبيق الأمان في السويتش
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 1), 'حماية المنافذ غير المستخدمة', 'يُنصح بتعطيل المنافذ غير المستعملة (Shutdown) حتى لا يتم استغلالها للدخول غير الشرعي.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 1), 'التعامل مع هجمات MAC Table', 'في بعض الهجمات، يتم إغراق جدول MAC بعناوين مزيفة. Port Security يمنع ذلك بتحديد عدد العناوين المسموح بها.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 1), 'تفعيل Port Security', 'يتم على منفذ معين لتحديد الأجهزة المسموح لها بالاتصال عبر عناوين MAC محددة.', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 1), 'تقييد عدد عناوين MAC', 'يمكن ضبط المنفذ بحيث يقبل مثلًا عنوان MAC واحد فقط، وإذا حاول جهاز آخر الاتصال يتم منع الوصول.', 4);

-- Add Lessons for Section 20 Topic 2: أوضاع Port Security
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 2), 'وضع Shutdown', 'المنفذ يتوقف تلقائيًا عن العمل إذا اكتشف جهاز غير مصرح به.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 2), 'وضع Restrict', 'يمنع الاتصال غير المصرح به لكن يبقي المنفذ فعالًا مع تسجيل الحدث.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 2), 'وضع Protect', 'يسمح فقط للعناوين المصرح بها بالعمل، ويهمل البقية دون تسجيل الحدث.', 3);

-- Add Lessons for Section 20 Topic 3: التحقق من الأمان
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 20) AND order_index = 3), 'أوامر الفحص', 'باستخدام show port-security يمكن للمدير التأكد من حالة المنافذ وعدد العناوين المقبولة عليها', 1);