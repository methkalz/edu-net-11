-- إضافة فيديوهات أساسيات الويندوز للصف العاشر
-- استخدام معرف نظام مؤقت للمالك
DO $$
DECLARE
    system_user_id uuid;
BEGIN
    -- محاولة العثور على أول مدير عام أو إنشاء معرف نظام
    SELECT user_id INTO system_user_id 
    FROM profiles 
    WHERE role = 'superadmin' 
    LIMIT 1;
    
    -- إذا لم يوجد مدير عام، استخدم معرف نظام افتراضي
    IF system_user_id IS NULL THEN
        system_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- إدراج الفيديوهات
    INSERT INTO grade10_videos (
        title, 
        description, 
        video_url, 
        thumbnail_url, 
        source_type, 
        category, 
        video_category, 
        grade_level, 
        owner_user_id, 
        is_visible, 
        allowed_roles, 
        order_index
    ) VALUES 
    (
        'إضافة لغة إضافية للكيبورد',
        'تعلم كيفية إضافة لغات متعددة للوحة المفاتيح في نظام التشغيل ويندوز للتبديل بينها بسهولة أثناء الكتابة.',
        'https://drive.google.com/file/d/1k4s2UgBVK43G7n3294m40RQGujr392yk/preview',
        'https://drive.google.com/thumbnail?id=1k4s2UgBVK43G7n3294m40RQGujr392yk&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        1
    ),
    (
        'تشغيل أو تعطيل الحماية (Windows Defender)',
        'شرح مفصل لكيفية إدارة برنامج الحماية Windows Defender المدمج في ويندوز وطريقة تشغيله أو تعطيله حسب الحاجة.',
        'https://drive.google.com/file/d/1anid6MCJu2ET3qZby5gzEIH8WsokUkBm/preview',
        'https://drive.google.com/thumbnail?id=1anid6MCJu2ET3qZby5gzEIH8WsokUkBm&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        2
    ),
    (
        'تشغيل جهاز عرض أو شاشة إضافية (Projector/Monitor)',
        'دليل خطوة بخطوة لتوصيل وإعداد جهاز عرض أو شاشة إضافية مع الحاسوب وضبط إعدادات العرض.',
        'https://drive.google.com/file/d/1YAVC4eDUMUCWnqmg7gIIw8RHOCeSXiGa/preview',
        'https://drive.google.com/thumbnail?id=1YAVC4eDUMUCWnqmg7gIIw8RHOCeSXiGa&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        3
    ),
    (
        'تغيير عنوان IP للحاسوب',
        'تعلم كيفية تغيير عنوان IP الخاص بالحاسوب في شبكة محلية وإعداد الشبكة بشكل صحيح.',
        'https://drive.google.com/file/d/169VsAkr-114yNUz6AFRlhh9RgBzPBak5/preview',
        'https://drive.google.com/thumbnail?id=169VsAkr-114yNUz6AFRlhh9RgBzPBak5&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        4
    ),
    (
        'ضغط ملف أو فك الضغط عنه (Zip/Unzip)',
        'شرح كامل لعملية ضغط الملفات والمجلدات وفك الضغط عنها باستخدام الأدوات المدمجة في ويندوز.',
        'https://drive.google.com/file/d/1AqO6yEY98983z1cIyJP2X8Z0iRD_ok35/preview',
        'https://drive.google.com/thumbnail?id=1AqO6yEY98983z1cIyJP2X8Z0iRD_ok35&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        5
    ),
    (
        'طريقة تعريف الطابعة',
        'دليل شامل لتثبيت وتعريف الطابعات المختلفة على نظام ويندوز وحل مشاكل الطباعة الشائعة.',
        'https://drive.google.com/file/d/1PObF14ILxLt-2hbFzeKnU30M83srIgWh/preview',
        'https://drive.google.com/thumbnail?id=1PObF14ILxLt-2hbFzeKnU30M83srIgWh&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        6
    ),
    (
        'عرض الملفات المخفية في Windows Explorer',
        'تعلم كيفية إظهار الملفات والمجلدات المخفية في مستكشف ويندوز للوصول إلى ملفات النظام والإعدادات.',
        'https://drive.google.com/file/d/1nIzJAEw1VZ_niryLsu2ea5ivblWncxxz/preview',
        'https://drive.google.com/thumbnail?id=1nIzJAEw1VZ_niryLsu2ea5ivblWncxxz&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        7
    ),
    (
        'مستخدم جديد على الحاسوب',
        'شرح كيفية إنشاء حساب مستخدم جديد على ويندوز وإدارة صلاحيات المستخدمين والأمان.',
        'https://drive.google.com/file/d/1iNUzU49K68VQlpcYoscwS1aEZH4xjoNl/preview',
        'https://drive.google.com/thumbnail?id=1iNUzU49K68VQlpcYoscwS1aEZH4xjoNl&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        8
    ),
    (
        'معرفة مواصفات الحاسوب',
        'طرق مختلفة لمعرفة مواصفات الحاسوب التفصيلية مثل المعالج والذاكرة وكرت الشاشة باستخدام أدوات ويندوز.',
        'https://drive.google.com/file/d/1RIxMFTeyYX_pyJINga3z_Hq6zK1IXOPE/preview',
        'https://drive.google.com/thumbnail?id=1RIxMFTeyYX_pyJINga3z_Hq6zK1IXOPE&sz=w480-h360',
        'google_drive',
        'windows_tutorials',
        'windows_basics',
        '10',
        system_user_id,
        true,
        ARRAY['all'],
        9
    );
END $$;