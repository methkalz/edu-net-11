

# اصلاح مشكلة عدم حفظ التعديلات في امتحانات البجروت -- الحل النهائي

## السبب الجذري (Race Condition)

المشكلة ليست في عملية الحفظ نفسها بل في **اختفاء زر الحفظ قبل ان يتمكن المستخدم من الضغط عليه** بسبب تسلسل زمني خاطئ:

```text
handleQuestionUpdate يعمل:
  1. setLocalExam(updated) -- يحدّث الحالة المحلية
  2. onExamUpdate(updated) -- يحدّث parsedExam في المكون الاب
  3. setHasEdits(true) -- يُظهر زر الحفظ

لكن بعد ذلك مباشرة:
  4. exam prop يتغير (لان parsedExam تغير في الخطوة 2)
  5. useEffect([exam]) يعمل تلقائيا
  6. setHasEdits(false) -- يُخفي زر الحفظ فوراً!
```

نفس المشكلة تحدث مع `handleImageUploaded` بالضبط.

**النتيجة:** زر "حفظ التعديلات" يظهر لجزء من الثانية ثم يختفي. المستخدم لا يستطيع الضغط عليه ابدا.

## الاصلاحات المطلوبة

### الاصلاح 1: ازالة `setHasEdits(false)` من useEffect (الاصلاح الرئيسي)

**الملف:** `src/components/bagrut/BagrutExamPreview.tsx` -- السطر 122-125

**قبل:**
```typescript
useEffect(() => {
  setLocalExam(exam);
  setHasEdits(false);
}, [exam]);
```

**بعد:**
```typescript
useEffect(() => {
  setLocalExam(exam);
  // لا نعيد تعيين hasEdits هنا -- يتم تعيينها false فقط بعد الحفظ الناجح
  // في handleSaveEditsClick (سطر 237)
}, [exam]);
```

**لماذا هذا آمن:**
- بعد الحفظ الناجح: `handleSaveEditsClick` يستدعي `setHasEdits(false)` في سطر 237
- بعد الحفظ: `handleSaveEditsToDb` يستدعي `handlePreviewExam` الذي يعيد جلب البيانات من DB ويحدث `exam` prop، و`setLocalExam(exam)` يمزامن البيانات
- عند اغلاق المعاينة: المكون يُدمر بالكامل ولا حاجة لتصفير hasEdits

**السيناريوهات المختبرة:**

| السيناريو | النتيجة |
|-----------|---------|
| تعديل سؤال ثم حفظ | زر الحفظ يظهر ويبقى حتى الضغط عليه -- يعمل |
| رفع صورة ثم حفظ | زر الحفظ يظهر ويبقى -- يعمل |
| تعديل ثم اغلاق بدون حفظ | المكون يُدمر، لا مشكلة |
| حفظ ناجح | hasEdits = false في handleSaveEditsClick ثم refetch يحدث exam |
| حفظ فاشل | hasEdits يبقى true (الزر يبقى ظاهرا) -- سلوك صحيح |

### الاصلاح 2: تعيين `has_image: true` عند رفع صورة

**الملف:** `src/components/bagrut/BagrutExamPreview.tsx` -- سطر 168

**قبل:**
```typescript
? { ...q, image_url: imageUrl }
```

**بعد:**
```typescript
? { ...q, image_url: imageUrl, has_image: true }
```

**السبب:** بدون هذا، عند حفظ التعديلات، يتم ارسال `has_image: false` مع `image_url` صحيح. هذا يسبب تناقض في البيانات.

### الاصلاح 3: اضافة `question_number` في payload الحفظ

**الملف:** `src/pages/BagrutManagement.tsx` -- سطر 488-503

**قبل:**
```typescript
const updatePayload: any = {
  question_text: q.question_text,
  points: Math.round(q.points || 0),
  // ... باقي الحقول
};
```

**بعد:**
```typescript
const updatePayload: any = {
  question_number: q.question_number,
  question_text: q.question_text,
  points: Math.round(q.points || 0),
  // ... باقي الحقول
};
```

**السبب:** المحرر يسمح بتعديل معرف السؤال (question_number) لكنه لا يُحفظ حاليا لانه غير موجود في payload التحديث.

## ملخص التغييرات

| الملف | التغيير | عدد الاسطر |
|-------|---------|-----------|
| BagrutExamPreview.tsx سطر 124 | حذف `setHasEdits(false)` | حذف سطر واحد |
| BagrutExamPreview.tsx سطر 168 | اضافة `has_image: true` | تعديل سطر |
| BagrutManagement.tsx سطر 488 | اضافة `question_number` في payload | اضافة سطر |

## التحقق من عدم كسر وظائف اخرى

1. **وضع المعاينة للامتحان الجديد (viewState='preview'):** لا يتاثر -- لا يوجد `onSaveEdits` في هذا الوضع ولا يظهر زر حفظ التعديلات
2. **حفظ الارشادات:** لا يتاثر -- يستخدم `handleSaveInstructions` مباشرة بدون hasEdits
3. **ترتيب الاسئلة بعد الحفظ:** يعمل -- `setLocalExam(exam)` في useEffect لا يزال يمزامن البيانات من DB
4. **عرض الامتحان للطالب:** لا علاقة -- مكون مختلف تماما
5. **تصحيح البجروت للمعلم:** لا علاقة -- يقرا من DB مباشرة

