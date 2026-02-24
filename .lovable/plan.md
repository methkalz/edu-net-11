

## تنفيذ الإصلاحات الثلاثة الشاملة لنظام البجروت

---

### النقطة 1: فرض حد "اختر N من M" على الطالب

**ملف `src/hooks/useBagrutAttempt.ts`** — تعديل دالة `updateAnswer` (سطر 374-380):
- قبل قبول الإجابة، البحث عن القسم الذي ينتمي له السؤال (بحث عودي يشمل الأسئلة الفرعية)
- إذا القسم لديه `max_questions_to_answer`: حساب عدد الأسئلة الجذر المجابة
- السماح بـ: تعديل إجابة موجودة، حذف إجابة
- الرفض مع toast إذا: عدد الأسئلة الجذر المجابة >= الحد الأقصى والسؤال الحالي ليس من ضمن المجابة

**ملف `src/pages/StudentBagrutAttempt.tsx`** — عرض حالة القفل في واجهة الطالب:
- إضافة دالة `isQuestionLocked(question)` تتحقق إذا القسم وصل لحده والسؤال غير مجاب
- تمرير `disabled={isQuestionLocked(currentQuestion) || isSubmitting}` لمكون `BagrutQuestionRenderer`
- عرض `Alert` تنبيهي واضح فوق السؤال المقفل يشرح للطالب ماذا يفعل
- تلوين أزرار الأسئلة المقفلة في الشريط الجانبي بلون مميز (رمادي مع قفل)

---

### النقطة 2: إصلاح التصحيح التلقائي لأسئلة MCQ

**ملف `src/pages/BagrutGradingPage.tsx`** — تعديل سطور 647-661:
- استبدال المقارنة الحالية `parseInt(value)` بمنطق ثلاثي:
  1. مقارنة مباشرة: `String(value) === String(correctChoice.id)`
  2. مقارنة نصية: `String(value) === String(correctChoice.text)`
  3. fallback رقمي: `parseInt(value) === indexOf(correctChoice) + 1`
- هذا يضمن عمل التصحيح مع المعرفات النصية ("a","b","أ","ب") والرقمية

---

### النقطة 3: عرض الأسئلة المتداخلة عودياً في صفحة النتائج

**ملف `src/pages/StudentBagrutResult.tsx`** — إعادة كتابة قسم عرض تفاصيل الأسئلة:
- إضافة دالة `buildQuestionTree(flatQuestions)` تحول القائمة المسطحة لشجرة متداخلة عبر `parent_question_id`
- إضافة مكون عودي `ResultQuestionNode` يعرض سؤالاً واحداً ثم يستدعي نفسه لكل سؤال فرعي
  - يدعم N مستويات تداخل بدون حد
  - الأسئلة الأم تعرض مجموع علامات أبنائها
  - الأسئلة الطرفية تعرض إجابة الطالب والإجابة الصحيحة
  - مسافة بادئة متزايدة حسب العمق
- استبدال `questions.map(...)` المسطح بـ `questionTree.map(rootQ => <ResultQuestionNode />)`

---

### الملفات المتأثرة

| الملف | التعديل |
|-------|---------|
| `src/hooks/useBagrutAttempt.ts` | فرض حد N في `updateAnswer` |
| `src/pages/StudentBagrutAttempt.tsx` | عرض قفل الأسئلة + تنبيه |
| `src/pages/BagrutGradingPage.tsx` | إصلاح مقارنة MCQ |
| `src/pages/StudentBagrutResult.tsx` | شجرة أسئلة عودية |

