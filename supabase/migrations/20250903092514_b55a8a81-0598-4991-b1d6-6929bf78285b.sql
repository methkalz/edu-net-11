-- إصلاح تنسيق خيارات جميع الأسئلة المعطوبة
-- تحويل جميع الخيارات إلى التنسيق الصحيح {id, text}

-- إصلاح سؤال "ما الذي يحتاجه المضيف للاتصال بالشبكة؟"
UPDATE grade11_game_questions 
SET choices = '[
  {"id": "A", "text": "عنوان IP"}, 
  {"id": "B", "text": "كلمة مرور"}, 
  {"id": "C", "text": "برنامج خاص"}, 
  {"id": "D", "text": "إذن من المدير"}
]',
correct_answer = 'A'
WHERE question_text = 'ما الذي يحتاجه المضيف للاتصال بالشبكة؟';

-- إصلاح سؤال "ما هو المضيف في الشبكة؟"
UPDATE grade11_game_questions 
SET choices = '[
  {"id": "A", "text": "أي جهاز متصل بالشبكة"}, 
  {"id": "B", "text": "فقط الخوادم"}, 
  {"id": "C", "text": "فقط أجهزة الحاسوب"}, 
  {"id": "D", "text": "الهواتف الذكية"}
]',
correct_answer = 'A'
WHERE question_text = 'ما هو المضيف في الشبكة؟';

-- إصلاح سؤال "ما خصائص شبكة النظير إلى النظير؟"
UPDATE grade11_game_questions 
SET choices = '[
  {"id": "A", "text": "الأجهزة تتصل مباشرة ببعضها"}, 
  {"id": "B", "text": "تحتاج خادم مركزي"}, 
  {"id": "C", "text": "معقدة التركيب"}, 
  {"id": "D", "text": "مكلفة جداً"}
]',
correct_answer = 'A'
WHERE question_text = 'ما خصائص شبكة النظير إلى النظير؟';

-- إصلاح سؤال "في شبكة العميل/الخادم، ما دور الخادم؟"
UPDATE grade11_game_questions 
SET choices = '[
  {"id": "A", "text": "يقدم الخدمات للعملاء"}, 
  {"id": "B", "text": "يطلب الخدمات من العملاء"}, 
  {"id": "C", "text": "يراقب الشبكة فقط"}, 
  {"id": "D", "text": "ينظف البيانات"}
]',
correct_answer = 'A'
WHERE question_text = 'في شبكة العميل/الخادم، ما دور الخادم؟';