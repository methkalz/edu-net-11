
# إصلاح: عدم حفظ تغيير نوع السؤال في امتحانات البجروت

## السبب الجذري

في ملف `src/pages/BagrutManagement.tsx`، عند حفظ تعديلات سؤال موجود (سطر 500-516)، يتم بناء `updatePayload` يحتوي على جميع حقول السؤال **ما عدا `question_type`**.

```text
updatePayload = {
  question_number,
  question_text,
  points,
  choices,
  correct_answer,
  ...
  // question_type مفقود!
}
```

لذلك عند تغيير نوع السؤال من `open_ended` إلى `fill_blank` (أو أي نوع آخر) والضغط على "حفظ"، يتم تحديث كل شيء في قاعدة البيانات **إلا النوع** - فيبقى كما كان.

## الحل

إضافة سطر واحد في `updatePayload`:

```text
question_type: q.question_type,
```

### الملف المتأثر

| الملف | التعديل |
|---|---|
| `src/pages/BagrutManagement.tsx` | إضافة `question_type` إلى `updatePayload` (سطر 500) |

### التفاصيل التقنية

في السطر 500 من الملف، بعد السطر:
```
question_text: q.question_text,
```
يُضاف:
```
question_type: q.question_type,
```

هذا يضمن أن أي تغيير في نوع السؤال (مفتوح، اختيار متعدد، اكمال فراغ، صح/خطأ، جدول، إلخ) يُحفظ فعلياً في قاعدة البيانات عند الضغط على زر الحفظ.

لا حاجة لتغييرات أخرى - الخطأ محصور في حقل واحد مفقود من كائن التحديث.
