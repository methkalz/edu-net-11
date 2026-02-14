

# اصلاح مشاكل تعديل اسئلة التخصص ورفع الصور في امتحانات البجروت

## المشاكل المكتشفة

### المشكلة الاولى: تعديل السؤال الخاطئ (السبب الرئيسي)
دالة `updateQuestionInSection` في `BagrutExamPreview.tsx` تبحث عن السؤال بواسطة `question_number`. في قسم التخصص، السؤال 23 يحتوي على اسئلة فرعية (أ، ب، ج...) وكل منها يحتوي على اسئلة فرعية اخرى مرقمة (1، 2، 3). هذا يعني ان الرقم "1" موجود عدة مرات في شجرة الاسئلة (تحت أ وتحت ح وتحت ط وتحت ي). عند تعديل سؤال فرعي، الدالة تجد اول تطابق وتحدثه - وقد يكون السؤال الخاطئ. هذا يسبب فشل التعديل او تعديل سؤال غير المطلوب.

### المشكلة الثانية: رفع الصور لا يعمل للاسئلة الفرعية
دالة `handleImageUploaded` تبحث فقط في الاسئلة الرئيسية (المستوى الاول) ولا تدخل في الاسئلة الفرعية. بما ان جميع اسئلة التخصص هي فرعية تحت السؤال 23، فان رفع الصور لا يعمل لاي منها.

---

## الحل

### التعديل 1: استخدام `question_db_id` بدلا من `question_number` للبحث

**الملف:** `src/components/bagrut/BagrutExamPreview.tsx`

تعديل دالة `updateQuestionInSection` للبحث باستخدام `question_db_id` (المعرف الفريد من قاعدة البيانات) بدلا من `question_number` الذي قد يتكرر. وكذلك تحديث `handleQuestionUpdate` لاستخدام `question_db_id` الاصلي.

```text
قبل:
  updateQuestionInSection(questions, questionNumber, updater)
    -> يبحث بـ q.question_number === questionNumber

بعد:
  updateQuestionInSection(questions, questionDbId, questionNumber, updater)
    -> يبحث بـ q.question_db_id === questionDbId اولا
    -> fallback: q.question_number === questionNumber (للامتحانات غير المحفوظة)
```

### التعديل 2: جعل `handleImageUploaded` عودية (Recursive)

**الملف:** `src/components/bagrut/BagrutExamPreview.tsx`

تعديل `handleImageUploaded` لتبحث في الاسئلة الفرعية بشكل عودي بدلا من المستوى الاول فقط. ايضا استخدام `question_db_id` عند توفره.

```text
قبل:
  questions.map(q => q.question_number === questionNumber ? ... : q)

بعد:
  updateQuestionRecursive(questions, identifier) - يبحث عوديا في كل المستويات
```

### التعديل 3: تمرير معرف فريد في `onImageUploaded`

**الملف:** `src/components/bagrut/BagrutExamPreview.tsx`

تحديث `QuestionCard` و`handleImageUploaded` لتمرير `question_db_id` (ان وجد) مع `question_number` لضمان تحديد السؤال الصحيح.

---

## التفاصيل التقنية

الملفات المتأثرة:
- `src/components/bagrut/BagrutExamPreview.tsx` - التعديلات الثلاثة اعلاه

التعديلات محصورة في ملف واحد وتحافظ على التوافق مع الامتحانات غير المحفوظة (التي ليس لها `question_db_id`) عبر fallback للبحث بـ `question_number`.

