-- Add Section 21: WLAN - الشبكات اللاسلكية
INSERT INTO public.grade11_sections (title, description, order_index, created_by) VALUES
('WLAN - الشبكات اللاسلكية', 'الشبكات اللاسلكية تسمح بالاتصال عبر موجات الراديو بدل الكابلات. تُستخدم في البيوت، المدارس، والأماكن العامة لأنها تمنح مرونة وسهولة في الحركة.', 21, NULL);

-- Add Section 22: إعداد الشبكة اللاسلكية
INSERT INTO public.grade11_sections (title, description, order_index, created_by) VALUES
('הגדרת הרשת האלחוטית - إعداد الشبكة اللاسلكية', 'هذا القسم يوضح كيف نُعد راوتر أو نقطة وصول لاسلكية في البيت أو المدرسة، بدءًا من الأساسيات وحتى الإعدادات المتقدمة.', 22, NULL);

-- Add Topics for Section 21: WLAN
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_sections WHERE order_index = 21), 'مقدمة للشبكات اللاسلكية', 'مفاهيم أساسية حول الشبكات اللاسلكية وأنواعها', 1),
((SELECT id FROM public.grade11_sections WHERE order_index = 21), 'مكونات الشبكة اللاسلكية', 'المكونات الرئيسية للشبكات اللاسلكية', 2),
((SELECT id FROM public.grade11_sections WHERE order_index = 21), 'آلية عمل الشبكة اللاسلكية', 'كيفية عمل الشبكات اللاسلكية وبروتوكولاتها', 3),
((SELECT id FROM public.grade11_sections WHERE order_index = 21), 'أمان الشبكات اللاسلكية', 'طرق حماية وتأمين الشبكات اللاسلكية', 4);

-- Add Topics for Section 22: Wireless Network Configuration
INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_sections WHERE order_index = 22), 'إعداد الراوتر اللاسلكي', 'الإعدادات الأساسية للراوتر اللاسلكي', 1),
((SELECT id FROM public.grade11_sections WHERE order_index = 22), 'خيارات إضافية في إعداد الراوتر', 'الإعدادات المتقدمة والخيارات الإضافية', 2);

-- Add Lessons for Section 21 Topic 1: مقدمة للشبكات اللاسلكية
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 1), 'أنواع الشبكات اللاسلكية', 'تشمل WPAN لمسافات قصيرة مثل Bluetooth، WLAN للشبكات المنزلية، WMAN للمدن، وWWAN لشبكات المحمول.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 1), 'تقنيات لاسلكية', 'مثل Wi-Fi، WiMAX، Bluetooth، Cellular Broadband، وكلها توفر سرعات ومديات مختلفة.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 1), 'بروتوكولات 802.11', 'كل جيل من Wi-Fi له معيار مثل 802.11n و802.11ac و802.11ax (Wi-Fi 6) التي تقدم سرعات أعلى وتغطية أفضل.', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 1), 'منظمات المعايير', 'منظمات مثل IEEE وWi-Fi Alliance تحدد المواصفات وتضمن أن جميع الأجهزة متوافقة مع بعضها.', 4);

-- Add Lessons for Section 21 Topic 2: مكونات الشبكة اللاسلكية
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 2), 'بطاقة الشبكة اللاسلكية', 'هي التي تسمح للجهاز بالاتصال عبر Wi-Fi.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 2), 'نقطة الوصول (Access Point)', 'هي الجهاز الذي يربط الشبكة اللاسلكية بالشبكة السلكية.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 2), 'أنواع نقاط الوصول', 'منها مستقلة (Standalone) أو مُدارة مركزيًا عبر وحدة تحكم (Controller-based).', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 2), 'الهوائيات', 'قد تكون متعددة الاتجاهات (Omnidirectional) أو موجهة (Directional) أو بتقنية MIMO لزيادة السرعة.', 4);

-- Add Lessons for Section 21 Topic 3: آلية عمل الشبكة اللاسلكية
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 3), 'CSMA/CA', 'بروتوكول لتنظيم الإرسال، حيث يتحقق الجهاز أن القناة فارغة قبل الإرسال لتجنب التصادم.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 3), 'SSID', 'هو اسم الشبكة اللاسلكية الذي يظهر عند البحث عن Wi-Fi.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 3), 'العنوان الفيزيائي MAC', 'كل بطاقة لاسلكية لها عنوان MAC مميز يُستخدم للتعرف على الجهاز.', 3);

-- Add Lessons for Section 21 Topic 4: أمان الشبكات اللاسلكية
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 4), 'طرق المصادقة', 'مثل Open System (مفتوح) أو Shared Key (بمفتاح مشترك).', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 4), 'بروتوكولات الأمان', 'WEP قديم وغير آمن، أما WPA/WPA2/WPA3 فهي الأحدث وتوفر حماية قوية.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 4), 'أنواع الاستخدام', 'الوضع المنزلي (Personal) يستخدم كلمة مرور، والوضع المؤسسي (Enterprise) يستخدم خادم مصادقة.', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 21) AND order_index = 4), 'طرق التشفير', 'مثل TKIP وAES التي تحمي البيانات المرسلة عبر الهواء.', 4);

-- Add Lessons for Section 22 Topic 1: إعداد الراوتر اللاسلكي
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 1), 'الإعدادات الأساسية', 'تشمل تغيير كلمة المرور الافتراضية للراوتر وضبط اسم الشبكة (SSID).', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 1), 'إعداد DHCP', 'الراوتر يوزع تلقائيًا عناوين IP للأجهزة عبر DHCP.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 1), 'تحديث عناوين IP', 'يمكن للأجهزة أن تجدد عنوانها عبر أمر "تجديد" أو عند إعادة الاتصال بالشبكة.', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 1), 'تحديد القنوات اللاسلكية', 'اختيار القناة (Channel) المناسبة يقلل التداخل مع الشبكات الأخرى.', 4);

-- Add Lessons for Section 22 Topic 2: خيارات إضافية في إعداد الراوتر
INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 2), 'إعداد SSID', 'يمكن إظهار الشبكة أو إخفاؤها لتعزيز الأمان.', 1),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 2), 'إعداد الأمان', 'اختيار نوع التشفير (WPA2 أو WPA3) مع كلمة مرور قوية لحماية الشبكة.', 2),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 2), 'وضع Mesh', 'ميزة حديثة تسمح بربط عدة نقاط وصول معًا لتغطية أكبر بدون انقطاع.', 3),
((SELECT id FROM public.grade11_topics WHERE section_id = (SELECT id FROM public.grade11_sections WHERE order_index = 22) AND order_index = 2), 'NAT وPort Forwarding', 'NAT يترجم بين العناوين الخاصة والعامة للإنترنت، وPort Forwarding يسمح بفتح خدمات معينة مثل تشغيل سيرفر ألعاب.', 4);