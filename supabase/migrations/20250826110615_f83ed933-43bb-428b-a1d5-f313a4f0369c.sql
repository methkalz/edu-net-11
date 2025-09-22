-- إنشاء جدول للمهام الافتراضية
CREATE TABLE public.grade12_default_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_number INTEGER NOT NULL,
  phase_title TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول لتتبع تقدم الطلاب في المهام الافتراضية
CREATE TABLE public.grade12_student_task_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  default_task_id UUID NOT NULL REFERENCES public.grade12_default_tasks(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, default_task_id)
);

-- تفعيل RLS
ALTER TABLE public.grade12_default_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade12_student_task_progress ENABLE ROW LEVEL SECURITY;

-- إنشاء RLS policies للمهام الافتراضية
CREATE POLICY "Everyone can view default tasks" 
ON public.grade12_default_tasks 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "School admins can manage default tasks" 
ON public.grade12_default_tasks 
FOR ALL 
USING (get_user_role() = ANY(ARRAY['school_admin'::app_role, 'superadmin'::app_role]));

-- إنشاء RLS policies لتقدم الطلاب
CREATE POLICY "Students can view their own progress" 
ON public.grade12_student_task_progress 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own progress" 
ON public.grade12_student_task_progress 
FOR ALL 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student progress in their school" 
ON public.grade12_student_task_progress 
FOR SELECT 
USING (
  get_user_role() = ANY(ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
);

-- إدراج المهام الافتراضية
INSERT INTO public.grade12_default_tasks (phase_number, phase_title, task_title, order_index) VALUES
-- المرحلة 1: التخطيط والتصميم
(1, 'التخطيط والتصميم', 'اختيار اسم الشركة والفروع الثلاثة', 1),
(1, 'التخطيط والتصميم', 'تحديد الأقسام في كل فرع (إدارة، محاسبة، …)', 2),
(1, 'التخطيط والتصميم', 'تحديد عدد الأجهزة في كل قسم', 3),
(1, 'التخطيط والتصميم', 'إعداد جدول بالعناوين المقترحة (IP, Subnet, VLAN)', 4),
(1, 'التخطيط والتصميم', 'رسم خريطة أولية للشبكة', 5),

-- المرحلة 2: بناء الشبكة في Packet Tracer
(2, 'بناء الشبكة في Packet Tracer', 'إضافة الأجهزة (PC, Printer, Switch, Router)', 1),
(2, 'بناء الشبكة في Packet Tracer', 'توصيل الأجهزة بالكابلات المناسبة (Straight, Crossover)', 2),
(2, 'بناء الشبكة في Packet Tracer', 'تسمية الأجهزة بصيغة واضحة (PC1-MNG-HFA)', 3),
(2, 'بناء الشبكة في Packet Tracer', 'التأكد من اتصال الأجهزة بالسويتش', 4),

-- المرحلة 3: إعدادات أساسية للأجهزة
(3, 'إعدادات أساسية للأجهزة', 'تغيير اسم الجهاز (hostname)', 1),
(3, 'إعدادات أساسية للأجهزة', 'ضبط كلمات مرور (enable secret, console, vty)', 2),
(3, 'إعدادات أساسية للأجهزة', 'إعداد Banner للترحيب والتحذير', 3),
(3, 'إعدادات أساسية للأجهزة', 'تعيين عناوين IP لكل جهاز', 4),
(3, 'إعدادات أساسية للأجهزة', 'ضبط Default Gateway على الحواسيب', 5),

-- المرحلة 4: إعداد VLANs
(4, 'إعداد VLANs', 'إنشاء VLAN لكل قسم', 1),
(4, 'إعداد VLANs', 'ربط المنافذ بـ VLANs المناسبة', 2),
(4, 'إعداد VLANs', 'تفعيل VTP (Server/Client + Domain + Password)', 3),
(4, 'إعداد VLANs', 'إعداد منافذ Trunk بين السويتشات والراوتر', 4),

-- المرحلة 5: إعداد السيرفرات والخدمات
(5, 'إعداد السيرفرات والخدمات', 'إعداد DHCP Server لتوزيع العناوين تلقائيًا', 1),
(5, 'إعداد السيرفرات والخدمات', 'إعداد DNS Server لترجمة الأسماء', 2),
(5, 'إعداد السيرفرات والخدمات', 'إعداد HTTP Server لموقع الشركة الداخلي', 3),
(5, 'إعداد السيرفرات والخدمات', 'إعداد FTP Server للملفات', 4),
(5, 'إعداد السيرفرات والخدمات', 'إعداد Email Server للبريد الداخلي', 5),

-- المرحلة 6: إعداد الراوتر (Router-on-a-Stick)
(6, 'إعداد الراوتر (Router-on-a-Stick)', 'إنشاء Sub-Interfaces لكل VLAN', 1),
(6, 'إعداد الراوتر (Router-on-a-Stick)', 'ضبط encapsulation dot1Q لكل Sub-Interface', 2),
(6, 'إعداد الراوتر (Router-on-a-Stick)', 'تعيين عنوان IP لكل Sub-Interface كـ Gateway', 3),
(6, 'إعداد الراوتر (Router-on-a-Stick)', 'إضافة ip helper-address لدعم DHCP', 4),
(6, 'إعداد الراوتر (Router-on-a-Stick)', 'تفعيل OSPF بين الفروع', 5),

-- المرحلة 7: تعزيز الأمان
(7, 'تعزيز الأمان', 'تفعيل Port Security على المنافذ', 1),
(7, 'تعزيز الأمان', 'تحديد عدد MAC المسموح به لكل منفذ', 2),
(7, 'تعزيز الأمان', 'اختبار إغلاق المنفذ عند محاولة اختراق', 3),
(7, 'تعزيز الأمان', 'إنشاء ACL للتحكم بالوصول', 4),
(7, 'تعزيز الأمان', 'اختبار ACL (مثال: منع قسم من الإنترنت)', 5),

-- المرحلة 8: الاختبار والتوثيق
(8, 'الاختبار والتوثيق', 'اختبار Ping بين أجهزة من VLAN مختلفة', 1),
(8, 'الاختبار والتوثيق', 'استخدام أوامر show running-config وshow ip interface brief', 2),
(8, 'الاختبار والتوثيق', 'اختبار DHCP (هل الحواسيب أخذت IP تلقائي؟)', 3),
(8, 'الاختبار والتوثيق', 'اختبار DNS (هل google.com يُترجم إلى IP؟)', 4),
(8, 'الاختبار والتوثيق', 'اختبار FTP, HTTP, Email', 5),
(8, 'الاختبار والتوثيق', 'كتابة تقرير نهائي عن المشروع (خطوات، مشاكل، حلول)', 6);

-- إنشاء triggers للتحديث التلقائي للتواريخ
CREATE TRIGGER update_grade12_default_tasks_updated_at
BEFORE UPDATE ON public.grade12_default_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grade12_student_task_progress_updated_at
BEFORE UPDATE ON public.grade12_student_task_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();