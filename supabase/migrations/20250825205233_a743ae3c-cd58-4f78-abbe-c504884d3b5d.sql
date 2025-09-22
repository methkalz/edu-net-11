-- Add third section: البروتوكولات والنماذج
INSERT INTO public.grade11_sections (title, description, order_index) VALUES 
('البروتوكولات والنماذج (פרוטוקולים ומודולים)', 'في هذا القسم نتعرف على البروتوكولات التي تنظّم الاتصال في الشبكات، وعلى النماذج التي تساعدنا نفهم كيف تنتقل البيانات خطوة بخطوة من جهاز إلى آخر. الهدف أن نرى أن كل عملية اتصال، حتى لو كانت "إرسال رسالة واتساب"، تعتمد على قواعد واضحة ومنظمة.', 3);

-- Get the section ID for topics insertion
DO $$
DECLARE
    section_id uuid;
    topic1_id uuid;
    topic2_id uuid;
    topic3_id uuid;
    topic4_id uuid;
    topic5_id uuid;
BEGIN
    -- Get section ID
    SELECT id INTO section_id FROM public.grade11_sections WHERE title = 'البروتوكولات والنماذج (פרוטוקולים ומודולים)';
    
    -- Insert topics
    INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
    (section_id, 'القوانين (החוקים)', '', 1) RETURNING id INTO topic1_id;
    
    INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
    (section_id, 'حزمة بروتوكولات TCP/IP (חבילת הפרוטוקולים TCP/IP)', '', 2) RETURNING id INTO topic2_id;
    
    INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
    (section_id, 'منظمات المعايير (ארגוני תקינה)', '', 3) RETURNING id INTO topic3_id;
    
    INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
    (section_id, 'نموذج الطبقات (מודל השכבות)', '', 4) RETURNING id INTO topic4_id;
    
    INSERT INTO public.grade11_topics (section_id, title, content, order_index) VALUES 
    (section_id, 'تغليف البيانات (כימוס של מידע)', '', 5) RETURNING id INTO topic5_id;
    
    -- Insert lessons for Topic 1: القوانين
    INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
    (topic1_id, 'أساس الاتصال – المرسل والمستقبل', 'أي اتصال يحتاج طرف يرسل المعلومة (Sender) وطرف آخر يستقبلها (Receiver). مثلًا: عندما يرسل الطالب رسالة عبر الهاتف، الجهاز هو المرسل، والهاتف الآخر هو المستقبل.', 1),
    (topic1_id, 'الاتصال عبر قناة مشتركة', 'البيانات تمر في "طريق" واحد مثل كابل شبكة أو موجات Wi-Fi. لذلك نحتاج تنظيم لتفادي الفوضى، مثل إشارات المرور في الشارع.', 2),
    (topic1_id, 'البروتوكولات كقوانين اتصال', 'البروتوكولات (Protocols) هي القوانين التي تحدد كيف تُرسل البيانات، كيف تُترتب وتُشفّر، ومتى يتم تأكيد استلامها. بدونها لن تستطيع الأجهزة المختلفة التفاهم مع بعضها.', 3);
    
    -- Insert lessons for Topic 2: حزمة بروتوكولات TCP/IP
    INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
    (topic2_id, 'لماذا نحتاج بروتوكولات؟', 'البروتوكولات تجعل الاتصال منظمًا وواضحًا. فهي تحدد حجم كل رسالة، طريقة تقسيمها (Segmentation)، كيفية التشفير (Encoding)، ومتى يرسل الجهاز رسالة "تم الاستلام" (Acknowledgment). هكذا نضمن أن الرسالة تصل صحيحة وكاملة للطرف الآخر.', 1);
    
    -- Insert lessons for Topic 3: منظمات المعايير
    INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
    (topic3_id, 'من هم منظمات المعايير؟', 'هناك هيئات عالمية مثل IEEE، ISO، IETF تضع قواعد موحدة للشبكات. بفضلها، حاسوب من شركة معينة يمكنه التواصل مع راوتر من شركة أخرى.', 1),
    (topic3_id, 'ما هو المعيار؟', 'المعيار (Standard) هو اتفاق عالمي على طريقة عمل محددة. مثال: معيار Wi-Fi يحدد كيف تتصل أجهزتنا بالإنترنت اللاسلكي.', 2),
    (topic3_id, 'الهدف من هذه المنظمات', 'الهدف الأساسي هو ضمان التوافقية (Interoperability) بين الأجهزة المختلفة وتطوير تقنيات جديدة مثل Ethernet وBluetooth و5G. بدون هذه المنظمات، كل شركة كانت ستصنع نظامها الخاص ولن يكون هناك تواصل مشترك.', 3);
    
    -- Insert lessons for Topic 4: نموذج الطبقات
    INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
    (topic4_id, 'لماذا نستخدم نموذج الطبقات؟', 'تقسيم الشبكة إلى طبقات يجعل كل طبقة مسؤولة عن وظيفة معينة. هذا يسهل على المهندسين فهم الأعطال وحل المشاكل، مثل الطبيب الذي يعرف أي جهاز في الجسم مسؤول عن أي وظيفة.', 1),
    (topic4_id, 'نموذج OSI', 'نموذج OSI يحتوي على سبع طبقات تبدأ من الطبقة الفيزيائية (الكابلات والإشارات) وتنتهي بطبقة التطبيقات (البرامج). يُستخدم أساسًا للتعليم والفهم.', 2),
    (topic4_id, 'نموذج TCP/IP', 'النموذج العملي المستخدم اليوم في الإنترنت. يتكون من أربع طبقات: الوصول للشبكة، الإنترنت، النقل (Transport)، والتطبيق (Application).', 3),
    (topic4_id, 'مقارنة بين OSI وTCP/IP', 'نموذج OSI مفصل أكثر لكنه نظري، بينما TCP/IP عملي ويُطبق في حياتنا اليومية. كلاهما يساعدنا على فهم عملية انتقال البيانات خطوة بخطوة.', 4);
    
    -- Insert lessons for Topic 5: تغليف البيانات
    INSERT INTO public.grade11_lessons (topic_id, title, content, order_index) VALUES 
    (topic5_id, 'تقسيم البيانات إلى مقاطع', 'عندما نرسل معلومة كبيرة، يتم تقسيمها إلى أجزاء صغيرة ليسهل نقلها عبر الشبكة. هذه الأجزاء تسمى Segments أو Packets حسب المرحلة.', 1),
    (topic5_id, 'أسماء وحدات البيانات', 'في كل طبقة من النموذج يُستخدم اسم مختلف: Bits في الطبقة الفيزيائية (0 و1). Frame في طبقة ربط البيانات. Packet في طبقة الشبكة. Segment في طبقة النقل. هذا يشبه تغليف طرد بريدي: تضع الرسالة في ظرف، ثم في صندوق، ثم تُلصق عليه عنوان التوصيل.', 2);
    
END $$;