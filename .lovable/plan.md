

# إصلاح مشكلة صور base64 في أسئلة البجروت - حل نهائي

## الأسباب الجذرية المكتشفة

بعد فحص الكود بدقة، وُجدت **ثغرتان** تسمحان بتسرب بيانات base64 الى قاعدة البيانات:

1. **SubQuestionEditor لا يمرر `onImageUpload`**: مكون تحرير الأسئلة الفرعية (سطر 179 و 216) يستخدم `RichTextEditor` بدون تمرير `onImageUpload`، مما يعني أن أي صورة تُلصق في سؤال فرعي (مثل سؤال ز) تُخزن كـ base64 مباشرة بدل رفعها الى Storage.

2. **validateAndSubmit لا ينظف البيانات**: دالة الحفظ (سطر 691-715) تحفظ المحتوى كما هو دون فحص أو تنظيف صور base64 المضمنة.

## الحل المقترح

### تعديل ملف واحد: `src/components/bagrut/BagrutQuestionEditDialog.tsx`

**1. إضافة دالة `sanitizeBase64Images`:**

دالة غير متزامنة (async) تبحث في أي نص HTML عن `<img src="data:image/...">` وترفع كل صورة الى Supabase Storage وتستبدل الـ src برابط URL عام.

```text
sanitizeBase64Images(html: string) -> Promise<string>
  1. يبحث بـ regex عن كل <img src="data:image/...;base64,...">
  2. لكل صورة:
     - يحول base64 الى Blob عبر fetch()
     - يرفع الى bagrut-exam-images/inline/
     - يستبدل src بالرابط العام
  3. يعيد HTML النظيف
```

**2. تطبيق التنظيف عند الحفظ:**

تحويل `validateAndSubmit` الى دالة async، وقبل استدعاء `onSubmit`:
- تمرير `question_text` و `correct_answer` و `answer_explanation` عبر `sanitizeBase64Images`
- تطبيق نفس التنظيف بشكل عودي (recursive) على كل الأسئلة الفرعية `sub_questions`

**3. تمرير `onImageUpload` الى SubQuestionEditor:**

- إضافة prop `onImageUpload` الى مكون `SubQuestionEditor`
- تمريره الى كل `RichTextEditor` داخل المكون (نص السؤال والإجابة الصحيحة)
- هذا يمنع تسرب base64 مستقبلاً من الأسئلة الفرعية

### النتيجة المضمونة

- البيانات القديمة (مثل أسئلة ز، و، ج): تُنظف تلقائياً عند فتح السؤال والضغط على حفظ
- البيانات الجديدة: لا يمكن أن تتسرب base64 لأن الاعتراض يعمل في الأسئلة الفرعية أيضاً + التنظيف النهائي عند الحفظ كطبقة أمان إضافية

