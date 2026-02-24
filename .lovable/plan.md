

# إضافة اسم الدرس في بطاقة السؤال المولّد

## الفكرة

عند عرض الأسئلة المولّدة في مرحلة المراجعة، يظهر حالياً نوع السؤال (صح/خطأ أو اختيار متعدد) ومستوى الصعوبة فقط. المطلوب إضافة مستطيل (Badge) يعرض **اسم الدرس** الذي تم توليد السؤال منه.

## التغييرات المطلوبة

### 1. تحديث Edge Function لإرجاع اسم الدرس

ملف: `supabase/functions/generate-smart-questions/index.ts`

- إضافة حقل `lesson_name` إلى Tool Schema (بجانب question_text، question_type، إلخ)
- وصفه: "اسم الدرس الذي تم استخراج السؤال منه، يجب أن يكون من عناوين الدروس الموجودة في المحتوى"
- إضافته إلى `required`

### 2. تحديث واجهة GeneratedQuestion

ملف: `src/components/exam/GeneratedQuestionCard.tsx`

- إضافة حقل اختياري `lesson_name?: string` إلى interface `GeneratedQuestion`
- عرض Badge جديد بجانب نوع السؤال يحتوي اسم الدرس (بلون مميز مثل أزرق فاتح)

### 3. لا تغيير على SmartQuestionGenerator

البيانات تأتي من الـ Edge Function مباشرة وتُمرر كما هي إلى `GeneratedQuestionCard`، فلا حاجة لتعديل إضافي.

## التفاصيل التقنية

### التغيير في Tool Schema (Edge Function)

```text
إضافة حقل جديد في properties:
  lesson_name: { type: 'string', description: 'اسم الدرس المصدر للسؤال' }

إضافته في required
```

### التغيير في البطاقة

```text
بجانب:
  <Badge variant="outline">{TYPE_LABELS[question.question_type]}</Badge>

يُضاف:
  {question.lesson_name && (
    <Badge className="bg-blue-100 text-blue-800">اسم الدرس</Badge>
  )}
```

## الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `supabase/functions/generate-smart-questions/index.ts` | إضافة `lesson_name` للـ Tool Schema |
| `src/components/exam/GeneratedQuestionCard.tsx` | إضافة الحقل للـ interface + عرض Badge |

