

# خطة التعديلات على نظام أسئلة البجروت

## ملخص المهام (مرتبة حسب الأولوية والتبعية)

### المهمة 1: إضافة محرر النصوص الغني (Rich Text Editor) لحقول السؤال في نافذة التحرير

**الملف:** `src/components/bagrut/BagrutQuestionEditDialog.tsx`

**الحقول المتأثرة:**
1. **نص السؤال** (`question_text`) - سطر 755: حالياً `Textarea` عادي، سيُستبدل بـ `RichTextEditor`
2. **الإجابة الصحيحة** (`correct_answer`) - سطر 215 (أسئلة فرعية) وليس له حقل مستقل في السؤال الرئيسي حالياً
3. **شرح الإجابة** (`answer_explanation`) - سطر 1151: حالياً `Textarea` عادي
4. **نفس التعديلات في الأسئلة الفرعية** (`SubQuestionEditor`) - سطر 177 (نص السؤال) وسطر 215 (الإجابة)

**التعديلات:**
- استيراد `RichTextEditor` (موجود بالفعل في المشروع)
- استبدال `Textarea` بـ `RichTextEditor` في الحقول الثلاثة (نص السؤال، الإجابة، الشرح)
- نفس الشيء في `SubQuestionEditor` للأسئلة الفرعية المتداخلة

---

### المهمة 2: إضافة إمكانية تعديل معرّف/عنوان السؤال (question_number)

**الملف:** `src/components/bagrut/BagrutQuestionEditDialog.tsx`

**الوضع الحالي:** `question_number` يظهر فقط في عنوان الـ Dialog (سطر 701) وغير قابل للتعديل.

**التعديل:**
- إضافة حقل `Input` جديد لتعديل `question_number` بعد حقل نوع السؤال مباشرة
- بتسمية "معرّف السؤال" مع ملاحظة توضيحية
- مثال: يمكن تغيير "3" إلى "3 أ)" أو "3-i"

---

### المهمة 3: إصلاح عرض النصوص متعددة الأسطر (الإجابات والشرح)

**المشكلة:** النصوص التي تحتوي HTML (بعد استخدام Rich Text Editor) تظهر كنص خام بدون تنسيق.

**الملفات المتأثرة:**

#### أ) المعاينة (Super Admin): `src/components/bagrut/BagrutExamPreview.tsx`
- **سطر 674**: نص السؤال يعرض بـ `{question.question_text}` -- يجب عرضه بـ `dangerouslySetInnerHTML` مع DOMPurify (مستورد بالفعل)
- **سطر 853**: الإجابة الصحيحة تعرض بـ `{question.correct_answer}` -- نفس المعالجة
- **سطر 859**: الشرح يعرض بـ `{question.answer_explanation}` -- نفس المعالجة

#### ب) صفحة التصحيح (المعلم): `src/pages/BagrutGradingPage.tsx`
- **سطر 460**: نص السؤال `{question.question_text}` -- عرض كـ HTML
- **سطر 492**: شرح الحل `{question.answer_explanation}` -- عرض كـ HTML
- **سطر 1036**: الإجابة الصحيحة `{question.correct_answer}` -- عرض كـ HTML

#### ج) واجهة الطالب: `src/components/bagrut/BagrutQuestionRenderer.tsx`
- **سطر 82**: نص السؤال `<p>{question.question_text}</p>` -- عرض كـ HTML
- **سطر 191**: الإجابة الصحيحة `{question.correct_answer}` -- عرض كـ HTML
- **سطر 196**: الشرح `{question.answer_explanation}` -- عرض كـ HTML

**الأسلوب الموحد:** استخدام `DOMPurify.sanitize()` مع `dangerouslySetInnerHTML` وكلاسات `prose prose-sm` للتنسيق. سيتم إنشاء مكون مساعد صغير `SafeHtml` لتجنب التكرار.

---

### المهمة 4: إصلاح خيارات MCQ متعددة الأسطر

**المشكلة:** خيارات الاختيار من متعدد (choices) التي تحتوي `\n` تظهر على سطر واحد.

**الملفات المتأثرة:**
- `src/components/bagrut/BagrutExamPreview.tsx` سطر 824: `{choice.text}` -- إضافة `whitespace-pre-wrap`
- `src/components/bagrut/BagrutQuestionRenderer.tsx` سطر 250: `{choice.text}` -- إضافة `whitespace-pre-wrap`
- `src/pages/BagrutGradingPage.tsx` (عرض الخيارات في التصحيح) -- نفس المعالجة

---

## ترتيب التنفيذ

```text
المهمة 1: Rich Text Editor في نافذة التحرير
    ↓
المهمة 2: تعديل معرّف السؤال (تعديل بسيط في نفس الملف)
    ↓
المهمة 3: عرض HTML المنسق في جميع الواجهات (معاينة + تصحيح + طالب)
    ↓
المهمة 4: إصلاح الخيارات متعددة الأسطر
```

---

## الملفات المتأثرة (مُلخص)

| الملف | نوع التعديل |
|-------|------------|
| `src/components/bagrut/BagrutQuestionEditDialog.tsx` | استبدال Textarea بـ RichTextEditor + حقل question_number |
| `src/components/bagrut/BagrutExamPreview.tsx` | عرض HTML منسق لنص السؤال والإجابة والشرح + خيارات متعددة الأسطر |
| `src/pages/BagrutGradingPage.tsx` | عرض HTML منسق لنص السؤال والإجابة والشرح |
| `src/components/bagrut/BagrutQuestionRenderer.tsx` | عرض HTML منسق لنص السؤال والإجابة والشرح + خيارات متعددة الأسطر |

**لا حاجة لتعديل قاعدة البيانات** -- الحقول الحالية (text) تدعم تخزين HTML بدون مشاكل.

