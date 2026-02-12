

# اصلاح مشكلة عدم حفظ الصور بعد الرفع في ادارة امتحانات البجروت

## المشكلة
عند رفع صورة لسؤال في صفحة ادارة البجروت، الصورة تظهر مباشرة في الواجهة لكنها تختفي بعد تحديث الصفحة. السبب ان التغيير يُحفظ فقط في الذاكرة المحلية (state) ولا يظهر زر "حفظ التعديلات" لارساله لقاعدة البيانات.

## السبب الجذري
في ملف `BagrutExamPreview.tsx`، الدالة `handleImageUploaded` (سطر 159) تقوم بتحديث `localExam` state وتستدعي `onExamUpdate`، لكنها **لا تستدعي `setHasEdits(true)`**. بالمقارنة، الدالة `handleQuestionUpdate` (سطر 226) تستدعي `setHasEdits(true)` بشكل صحيح.

زر "حفظ التعديلات" يظهر فقط عندما `hasEdits === true` (سطر 437)، لذلك لا يظهر ابدا بعد رفع صورة.

## التحليل الوظيفي
- دالة الحفظ `handleSaveEditsToDb` في `BagrutManagement.tsx` (سطر 499-500) تتعامل مع `image_url` و `has_image` بشكل صحيح فعلا.
- الخلل فقط في عدم اظهار زر الحفظ.

## الاصلاح المطلوب

### الملف: `src/components/bagrut/BagrutExamPreview.tsx`

**تعديل واحد فقط** -- اضافة `setHasEdits(true)` داخل دالة `handleImageUploaded`:

```typescript
// سطر 159-176 -- قبل:
const handleImageUploaded = useCallback((sectionIndex, questionNumber, imageUrl) => {
  setLocalExam(prev => {
    // ... تحديث image_url في السؤال
    onExamUpdate?.(updated);
    return updated;
  });
  // <-- هنا ينقص setHasEdits(true)
}, [onExamUpdate]);

// بعد:
const handleImageUploaded = useCallback((sectionIndex, questionNumber, imageUrl) => {
  setLocalExam(prev => {
    // ... نفس الكود بدون تغيير
  });
  setHasEdits(true);  // <-- اضافة هذا السطر فقط
}, [onExamUpdate]);
```

## التاثير الوظيفي
- رفع صورة من "صورة مطلوبة للسؤال" -- سيظهر زر حفظ التعديلات فورا
- رفع صورة من داخل محرر النصوص (BagrutQuestionEditDialog) -- يعمل بالفعل لان `handleQuestionUpdate` يستدعي `setHasEdits(true)` عند اغلاق الحوار
- تعديل اي سؤال اخر -- لا يتاثر (يعمل كالسابق)
- الحفظ لقاعدة البيانات -- يعمل كالسابق (الدالة تحفظ image_url بالفعل)
- عرض الصور للطلاب والمعلمين -- يعمل كالسابق بعد الحفظ

## ملاحظة
هذا اصلاح بسيط جدا -- سطر واحد فقط. لا توجد مخاطر وظيفية لان الكود الحالي يتعامل مع كل شيء بشكل صحيح، والمشكلة فقط في عدم تفعيل علامة "يوجد تعديلات".
