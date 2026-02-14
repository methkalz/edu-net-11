
# إصلاح زر "حفظ التعديلات" الذي لا يعمل

## السبب الجذري

في ملف `BagrutExamPreview.tsx` سطر 246-272، الدالة `handleQuestionUpdate` مغلّفة بـ `useCallback` وتستخدم متغير `editingQuestion` داخلها، لكن هذا المتغير **غير مذكور في مصفوفة الاعتمادات (dependency array)**:

```text
handleQuestionUpdate يستخدم editingQuestion (سطر 247)
لكن الاعتمادات (سطر 272): [editingContext, updateQuestionInSection, onExamUpdate]
                               ← editingQuestion مفقود!
```

هذا يعني أن React يحتفظ بنسخة قديمة من الدالة حيث `editingQuestion = null`، فعند الضغط على "حفظ التعديلات" يدخل الشرط `if (!editingQuestion) return;` ولا يحدث شيء.

## الحل

### تعديل ملف: `src/components/bagrut/BagrutExamPreview.tsx`

إضافة `editingQuestion` الى مصفوفة اعتمادات `useCallback` في سطر 272:

```text
قبل: }, [editingContext, updateQuestionInSection, onExamUpdate]);
بعد: }, [editingContext, editingQuestion, updateQuestionInSection, onExamUpdate]);
```

هذا إصلاح من سطر واحد يحل المشكلة بالكامل.
