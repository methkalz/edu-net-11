-- إنشاء جدول جلسات الاختبارات المخلوطة
CREATE TABLE public.grade11_quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  quiz_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  shuffled_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  shuffled_choices JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_grade11_quiz_sessions_user_lesson ON public.grade11_quiz_sessions (user_id, lesson_id);
CREATE INDEX idx_grade11_quiz_sessions_status ON public.grade11_quiz_sessions (status);
CREATE INDEX idx_grade11_quiz_sessions_expires ON public.grade11_quiz_sessions (expires_at);

-- إنشاء تريجر لتحديث updated_at
CREATE TRIGGER update_grade11_quiz_sessions_updated_at
  BEFORE UPDATE ON public.grade11_quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- تمكين RLS
ALTER TABLE public.grade11_quiz_sessions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "Users can manage their own quiz sessions" 
  ON public.grade11_quiz_sessions 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can view quiz sessions in their school" 
  ON public.grade11_quiz_sessions 
  FOR SELECT 
  USING (
    get_user_role() = ANY (ARRAY['teacher'::app_role, 'school_admin'::app_role, 'superadmin'::app_role])
  );

-- إضافة المزيد من الأسئلة لدرس الشبكات
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, explanation, points) VALUES
-- أسئلة سهلة
('lesson-networks', 'ما هو الهدف الرئيسي من استخدام جدار الحماية؟', 'multiple_choice', 
 '[{"id": "A", "text": "تسريع الإنترنت"}, {"id": "B", "text": "حماية الشبكة من التهديدات"}, {"id": "C", "text": "توصيل الأجهزة"}, {"id": "D", "text": "حفظ البيانات"}]', 
 'B', 'easy', 'جدار الحماية يحمي الشبكة من التهديدات الخارجية والداخلية', 10),

('lesson-networks', 'أي من البروتوكولات التالية يستخدم لإرسال البريد الإلكتروني؟', 'multiple_choice', 
 '[{"id": "A", "text": "HTTP"}, {"id": "B", "text": "FTP"}, {"id": "C", "text": "SMTP"}, {"id": "D", "text": "DNS"}]', 
 'C', 'easy', 'SMTP (Simple Mail Transfer Protocol) يستخدم لإرسال البريد الإلكتروني', 10),

('lesson-networks', 'هل يمكن للشبكة اللاسلكية أن تكون أبطأ من الشبكة السلكية؟', 'true_false', 
 '[{"id": "true", "text": "صحيح"}, {"id": "false", "text": "خطأ"}]', 
 'true', 'easy', 'الشبكة اللاسلكية قد تكون أبطأ بسبب التداخل والمسافة', 10),

('lesson-networks', 'ما هو اختصار WiFi؟', 'multiple_choice', 
 '[{"id": "A", "text": "Wireless Fidelity"}, {"id": "B", "text": "Wide Area Fidelity"}, {"id": "C", "text": "Wired Function"}, {"id": "D", "text": "Web Interface"}]', 
 'A', 'easy', 'WiFi يرمز إلى Wireless Fidelity', 10),

-- أسئلة متوسطة
('lesson-networks', 'كم عدد طبقات نموذج OSI؟', 'multiple_choice', 
 '[{"id": "A", "text": "5 طبقات"}, {"id": "B", "text": "6 طبقات"}, {"id": "C", "text": "7 طبقات"}, {"id": "D", "text": "8 طبقات"}]', 
 'C', 'medium', 'نموذج OSI يتكون من 7 طبقات من الفيزيائية إلى التطبيق', 15),

('lesson-networks', 'ما هو الفرق بين Switch و Hub؟', 'multiple_choice', 
 '[{"id": "A", "text": "لا يوجد فرق"}, {"id": "B", "text": "Switch أذكى ويرسل البيانات للجهاز المحدد فقط"}, {"id": "C", "text": "Hub أسرع"}, {"id": "D", "text": "Switch لاسلكي فقط"}]', 
 'B', 'medium', 'Switch يرسل البيانات للجهاز المحدد بينما Hub يرسلها لجميع الأجهزة', 15),

('lesson-networks', 'هل يمكن للشبكة المحلية LAN أن تحتوي على أكثر من 1000 جهاز؟', 'true_false', 
 '[{"id": "true", "text": "صحيح"}, {"id": "false", "text": "خطأ"}]', 
 'true', 'medium', 'الشبكة المحلية يمكن أن تحتوي على آلاف الأجهزة مع التصميم المناسب', 15),

-- أسئلة صعبة
('lesson-networks', 'ما هو البروتوكول المستخدم لترجمة أسماء النطاقات إلى عناوين IP؟', 'multiple_choice', 
 '[{"id": "A", "text": "DHCP"}, {"id": "B", "text": "DNS"}, {"id": "C", "text": "ARP"}, {"id": "D", "text": "ICMP"}]', 
 'B', 'hard', 'DNS (Domain Name System) يترجم أسماء النطاقات إلى عناوين IP', 20),

('lesson-networks', 'في أي طبقة من طبقات OSI يعمل بروتوكول TCP؟', 'multiple_choice', 
 '[{"id": "A", "text": "الطبقة الفيزيائية"}, {"id": "B", "text": "طبقة ربط البيانات"}, {"id": "C", "text": "طبقة الشبكة"}, {"id": "D", "text": "طبقة النقل"}]', 
 'D', 'hard', 'TCP يعمل في طبقة النقل (Transport Layer) - الطبقة الرابعة', 20),

('lesson-networks', 'هل يمكن لبروتوكول UDP أن يضمن وصول البيانات بنفس الترتيب؟', 'true_false', 
 '[{"id": "true", "text": "صحيح"}, {"id": "false", "text": "خطأ"}]', 
 'false', 'hard', 'UDP لا يضمن الترتيب أو التسليم، بينما TCP يضمن ذلك', 20);

-- إضافة أسئلة إضافية للدروس الأخرى
INSERT INTO public.grade11_game_questions (lesson_id, question_text, question_type, choices, correct_answer, difficulty_level, explanation, points) VALUES
-- أسئلة لدرس البرمجة
('lesson-programming', 'ما هو الفرق بين المتغير والثابت؟', 'multiple_choice', 
 '[{"id": "A", "text": "لا يوجد فرق"}, {"id": "B", "text": "المتغير يمكن تغيير قيمته، الثابت لا"}, {"id": "C", "text": "الثابت أسرع"}, {"id": "D", "text": "المتغير يحفظ نص فقط"}]', 
 'B', 'easy', 'المتغير قابل للتغيير بينما الثابت لا يتغير بعد التعريف', 10),

('lesson-programming', 'أي من هذه ليس لغة برمجة؟', 'multiple_choice', 
 '[{"id": "A", "text": "Python"}, {"id": "B", "text": "HTML"}, {"id": "C", "text": "Java"}, {"id": "D", "text": "C++"}]', 
 'B', 'medium', 'HTML هو لغة ترميز وليس لغة برمجة', 15),

-- أسئلة لدرس قواعد البيانات  
('lesson-database', 'ما هو المفتاح الأساسي في قاعدة البيانات؟', 'multiple_choice', 
 '[{"id": "A", "text": "عمود اختياري"}, {"id": "B", "text": "عمود فريد يحدد كل سجل"}, {"id": "C", "text": "عمود نصي"}, {"id": "D", "text": "عمود رقمي فقط"}]', 
 'B', 'medium', 'المفتاح الأساسي عمود فريد يحدد كل سجل في الجدول بشكل وحيد', 15),

('lesson-database', 'هل يمكن لجدول واحد أن يحتوي على أكثر من مفتاح أساسي؟', 'true_false', 
 '[{"id": "true", "text": "صحيح"}, {"id": "false", "text": "خطأ"}]', 
 'false', 'easy', 'كل جدول يمكن أن يحتوي على مفتاح أساسي واحد فقط', 10);

-- إنشاء وظيفة لتنظيف الجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_quiz_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- حذف الجلسات المنتهية الصلاحية
  DELETE FROM public.grade11_quiz_sessions 
  WHERE expires_at < now() AND status = 'active';
  
  -- تحديث الجلسات المنتهية الصلاحية لتصبح expired
  UPDATE public.grade11_quiz_sessions 
  SET status = 'expired', updated_at = now()
  WHERE expires_at < now() AND status = 'active';
END;
$$;