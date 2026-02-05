
# خطة تحسين نظام امتحانات البجروت - 4 تعديلات رئيسية

## ملخص الطلبات

1. **إرشادات الامتحان**: إتاحة تعديلها من قبل السوبر آدمن بمحرر نصوص غني (Rich Text Editor)
2. **شرح الحل للطالب**: عرض الشرح بتنسيق متعدد الأسطر + إمكانية التعديل من السوبر آدمن
3. **شرح الحل للمعلم**: إظهار طريقة الحل أثناء التصحيح
4. **مشكلة الترجمة**: التأكد من عدم ترجمة النصوص العربية للإنجليزية عند الاستيراد

---

## التحليل التفصيلي

### الوضع الحالي

| العنصر | الوضع الحالي |
|--------|-------------|
| **إرشادات الامتحان** | نص عادي (`text`) في جدول `bagrut_exams.instructions` - يُعرض كقائمة مرقمة بفصل الأسطر |
| **شرح الحل** | نص عادي (`text`) في جدول `bagrut_questions.answer_explanation` - يُعرض في سطر واحد |
| **عرض الشرح للمعلم** | غير متاح حالياً أثناء التصحيح |
| **الترجمة** | System Prompt في Edge Function لا يمنع الترجمة صراحةً |

### التغييرات المطلوبة

---

## التعديل الأول: إرشادات الامتحان بمحرر غني

### المشكلة
- السوبر آدمن لا يستطيع تعديل الإرشادات بعد استيراد الامتحان
- لا يوجد تنسيق (حجم خط، ألوان، قوائم)

### الحل

**1. تعديل واجهة BagrutExamPreview.tsx:**
- إضافة زر "تعديل الإرشادات" للسوبر آدمن
- فتح Dialog يحتوي على `RichTextEditor`
- حفظ الإرشادات كـ HTML

**2. تعديل واجهة BagrutManagement.tsx:**
- عند حفظ الامتحان، يتم حفظ الإرشادات كـ HTML
- إضافة زر تعديل الإرشادات في قائمة الإجراءات

**3. تعديل عرض الإرشادات للطالب:**
- في `BagrutSectionSelector.tsx` و `AllMandatoryExamStart.tsx`
- عرض الإرشادات باستخدام `dangerouslySetInnerHTML` بدلاً من فصل الأسطر
- تطبيق كلاسات Tailwind للتنسيق

**الملفات المتأثرة:**
- `src/components/bagrut/BagrutExamPreview.tsx` - إضافة Dialog للتعديل
- `src/components/bagrut/BagrutSectionSelector.tsx` - تعديل طريقة العرض
- `src/components/bagrut/AllMandatoryExamStart.tsx` - تعديل طريقة العرض
- `src/pages/BagrutManagement.tsx` - إضافة حفظ الإرشادات

---

## التعديل الثاني: شرح الحل بتنسيق متعدد الأسطر

### المشكلة
- `answer_explanation` يُخزن ويُعرض كنص عادي (سطر واحد)
- لا يدعم التنسيق (أسطر متعددة، قوائم، كود)

### الحل

**1. تعديل BagrutQuestionEditDialog.tsx:**
- استبدال `Textarea` العادي بـ `RichTextEditor` لحقل شرح الإجابة
- السماح بإضافة أسطر متعددة وتنسيق النص

**2. تعديل Edge Function (parse-bagrut-exam):**
- تعديل System Prompt لطلب الحفاظ على تنسيق الشرح (أسطر متعددة)
- عدم ترجمة النصوص

**3. تعديل عرض الشرح للطالب:**
- في `BagrutQuestionRenderer.tsx` و `StudentBagrutResult.tsx`
- عرض الشرح باستخدام `dangerouslySetInnerHTML` أو `whitespace-pre-wrap`

**الملفات المتأثرة:**
- `src/components/bagrut/BagrutQuestionEditDialog.tsx` - استخدام Rich Editor
- `src/components/bagrut/BagrutQuestionRenderer.tsx` - تعديل العرض
- `src/pages/StudentBagrutResult.tsx` - تعديل العرض
- `supabase/functions/parse-bagrut-exam/index.ts` - تحديث Prompt

---

## التعديل الثالث: إظهار شرح الحل للمعلم أثناء التصحيح

### المشكلة
- المعلم لا يرى طريقة الحل الصحيحة أثناء تصحيح إجابات الطالب

### الحل

**تعديل BagrutGradingPage.tsx - مكون QuestionCard:**
- إضافة قسم جديد لعرض `answer_explanation` تحت الإجابة الصحيحة
- عرضه بتنسيق HTML إذا كان موجوداً
- تصميم مميز (لون أخضر فاتح مع أيقونة)

**الكود المقترح:**
```tsx
{/* شرح الحل - للمعلم */}
{question.answer_explanation && (
  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
    <p className="text-sm font-medium mb-1 flex items-center gap-2">
      <BookOpen className="h-4 w-4 text-emerald-600" />
      طريقة الحل:
    </p>
    <div 
      className="text-sm whitespace-pre-wrap prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: question.answer_explanation }}
    />
  </div>
)}
```

**الملفات المتأثرة:**
- `src/pages/BagrutGradingPage.tsx` - إضافة عرض الشرح في QuestionCard

---

## التعديل الرابع: منع الترجمة في Edge Function

### المشكلة
- في بعض الحالات، الـ AI يترجم نصوصاً عربية للإنجليزية

### الحل

**تعديل System Prompt في parse-bagrut-exam/index.ts:**
إضافة تعليمات صريحة:

```
**قاعدة صارمة - اللغة:**
- لا تترجم أي نص من العربية إلى أي لغة أخرى
- حافظ على اللغة الأصلية للنص كما هي في الملف
- إذا كان السؤال بالعربية، يجب أن يبقى بالعربية
- إذا كان الشرح بالعربية، يجب أن يبقى بالعربية
- لا تستخدم مصطلحات إنجليزية بدلاً من العربية
```

**الملفات المتأثرة:**
- `supabase/functions/parse-bagrut-exam/index.ts` - تحديث System Prompt

---

## ملخص الملفات المتأثرة

| الملف | التعديلات |
|-------|-----------|
| `src/components/bagrut/BagrutExamPreview.tsx` | إضافة Dialog لتعديل الإرشادات |
| `src/components/bagrut/BagrutSectionSelector.tsx` | عرض الإرشادات كـ HTML |
| `src/components/bagrut/AllMandatoryExamStart.tsx` | عرض الإرشادات كـ HTML |
| `src/components/bagrut/BagrutQuestionEditDialog.tsx` | Rich Editor لشرح الإجابة |
| `src/components/bagrut/BagrutQuestionRenderer.tsx` | عرض الشرح بتنسيق متعدد الأسطر |
| `src/pages/BagrutManagement.tsx` | دعم حفظ/تحديث الإرشادات |
| `src/pages/BagrutGradingPage.tsx` | عرض شرح الحل للمعلم |
| `src/pages/StudentBagrutResult.tsx` | عرض الشرح بتنسيق متعدد الأسطر |
| `supabase/functions/parse-bagrut-exam/index.ts` | منع الترجمة + الحفاظ على التنسيق |

---

## ترتيب التنفيذ

1. **Edge Function أولاً** - لمنع مشاكل الترجمة في الامتحانات المستقبلية
2. **شرح الحل للمعلم** - أسرع تعديل (ملف واحد)
3. **شرح الحل للطالب** - تعديل العرض + المحرر
4. **إرشادات الامتحان** - التعديل الأكثر شمولاً

---

## ملاحظات تقنية

- **التوافق العكسي**: الإرشادات القديمة (نص عادي) ستعمل مع العرض الجديد
- **الأمان**: استخدام `prose` classes للتحكم في HTML المعروض
- **الأداء**: لا تأثير على الأداء (تغييرات عرض فقط)
- **قاعدة البيانات**: لا تحتاج تعديلات - الحقول موجودة (`text` يدعم HTML)
