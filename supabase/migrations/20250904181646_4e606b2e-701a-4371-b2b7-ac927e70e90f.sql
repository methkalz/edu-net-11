-- إعادة ترتيب الألعاب حسب التسلسل التعليمي الصحيح للصف الحادي عشر

-- المستوى الأول: أساسيات الاتصال والشبكات (יסודות התקשורת)
UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 1,
  title = 'مطابقة أساسيات الشبكات والاتصال',
  description = 'المفاهيم الأساسية في عالم الشبكات والاتصال'
WHERE id = '2e0ab6cf-b2bd-456d-b86b-863363029c4c'; -- أساسيات الشبكات

UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 2,
  title = 'مطابقة أجهزة الإدخال والإخراج',
  description = 'تعرف على أجهزة الإدخال والإخراج الأساسية والأجهزة الوسيطة'
WHERE id = '6ade5280-64fd-4ad6-b078-631b4b5408b9'; -- أجهزة الإدخال والإخراج

UPDATE pair_matching_games SET 
  level_number = 1, 
  stage_number = 3,
  title = 'مطابقة أساسيات الحاسوب',
  description = 'تعلم المفاهيم الأساسية لمكونات الحاسوب'
WHERE id = 'ea07614d-722f-4624-b7f1-f1eac546033c'; -- أساسيات الحاسوب

-- المستوى الثاني: نظام تشغيل الراوتر والسويتش (מערכת הפעלה)
UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 1,
  title = 'مطابقة مفاهيم أنظمة التشغيل',
  description = 'أساسيات أنظمة تشغيل الراوتر والسويتش وإدارة الموارد'
WHERE id = '4c10adc2-2064-45cc-b73b-7d7978bc6611'; -- أنظمة التشغيل

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 2,
  title = 'مطابقة البرمجة الكائنية',
  description = 'المفاهيم الأساسية في البرمجة الكائنية والتنظيم'
WHERE id = '7156bd1d-781c-41d5-9afb-d94c6d2f2bfb'; -- البرمجة الكائنية

UPDATE pair_matching_games SET 
  level_number = 2, 
  stage_number = 3,
  title = 'مطابقة لغات البرمجة',
  description = 'تعرف على خصائص لغات البرمجة المختلفة'
WHERE id = 'f5595589-38a2-4d77-bd0d-58d185a065dc'; -- لغات البرمجة

-- المستوى الثالث: البروتوكولات والأمان (פרוטוקולים ואבטחה)
UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 1,
  title = 'مطابقة بروتوكولات الشبكة',
  description = 'تعلم البروتوكولات المختلفة المستخدمة في الشبكات والاتصال'
WHERE id = '2f161c05-07ef-4616-b66c-e2bfcf662e28'; -- بروتوكولات الشبكة

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 2,
  title = 'مطابقة المفاهيم التقنية',
  description = 'مطابقة المصطلحات التقنية المتقدمة بتعريفاتها'
WHERE id = '9dabf609-1ebc-438b-9866-6851a68dc097'; -- المفاهيم التقنية

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 3,
  title = 'مطابقة مفاهيم أمن المعلومات',
  description = 'أساسيات أمن المعلومات والحماية الرقمية في الشبكات'
WHERE id = 'ede1351d-709b-4669-b5dd-27b246c759cc'; -- أمن المعلومات

UPDATE pair_matching_games SET 
  level_number = 3, 
  stage_number = 4,
  title = 'مطابقة مفاهيم قواعد البيانات',
  description = 'أساسيات قواعد البيانات وإدارتها في بيئة الشبكات'
WHERE id = 'e4690183-2fe0-4f6b-95c8-66bfb9696740'; -- قواعد البيانات

-- إضافة أزواج مطابقة للألعاب التي تحتاج محتوى إضافي
INSERT INTO pair_matching_pairs (game_id, left_content, right_content, left_type, right_type, explanation, order_index) VALUES

-- أزواج إضافية لأساسيات الشبكات والاتصال
('2e0ab6cf-b2bd-456d-b86b-863363029c4c', 'Host', 'جهاز طرفي يرسل أو يستقبل البيانات في الشبكة', 'term', 'definition', 'المضيف هو نقطة البداية أو النهاية في الاتصال', 5),

-- أزواج إضافية لأجهزة الإدخال والإخراج  
('6ade5280-64fd-4ad6-b078-631b4b5408b9', 'الراوتر', 'جهاز وسيط يوجه البيانات بين الشبكات المختلفة', 'term', 'definition', 'الراوتر يربط بين شبكات منفصلة', 5),

-- أزواج إضافية لبروتوكولات الشبكة
('2f161c05-07ef-4616-b66c-e2bfcf662e28', 'TCP/IP', 'مجموعة بروتوكولات أساسية للاتصال عبر الإنترنت', 'term', 'definition', 'TCP/IP هو أساس الإنترنت الحديث', 7),

-- أزواج إضافية للمفاهيم التقنية
('9dabf609-1ebc-438b-9866-6851a68dc097', 'Bandwidth', 'السعة القصوى لنقل البيانات عبر وسيلة الاتصال', 'term', 'definition', 'عرض النطاق يحدد سرعة الشبكة', 6);