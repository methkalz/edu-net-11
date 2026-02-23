

## تقرير الفحص الشامل لمنظومة البجروت + خطة الاصلاح النهائية

### نتائج فحص سلامة البيانات لجميع الامتحانات

تم فحص جميع الامتحانات الاربعة في قاعدة البيانات ومقارنتها مع ملفات PDF الاصلية:

| الامتحان | عدد الاسئلة | حالة البيانات | تفاصيل |
|----------|-------------|--------------|--------|
| 2022 (all_mandatory) | 40 | سليم | لا يوجد تكرار للاسئلة الفرعية |
| 2023 (all_mandatory) | 40 | فساد جزئي | سؤال "ب" (عنوان 192.168.3.254) مكرر تحت سؤال 4 وسؤال 10 بنص متطابق |
| 2024 (standard) | 69 | فساد كبير | 4 اسئلة اب (3, 9, 17, 23) تتشارك نفس الاسئلة الفرعية بنصوص متطابقة |
| 2025 (standard) | 51 | سليم | لا يوجد تكرار |

---

### تفصيل فساد امتحان 2024 (الاخطر)

تم التحقق من ملف PDF الاصلي ومقارنته بقاعدة البيانات:

**في PDF الاصلي:**
- سؤال 3: يسال عن عنوان 192.15.3.0/24 - له 4 فروع (ا: عنوان شبكة، ب: Class B، ج: قناع الشبكة، د: عنوان عمومي)
- سؤال 9: يسال عن عنوان 172.16.3.0/16 - له فرعين (ا: 512 حاسوب فقط، ب: قناع 255.255.255.0)
- سؤال 17: يسال عن بروتوكول DHCP - له 4 فروع (ا: لا يمكن تعريفه بالراوتر، ب: يوزع عناوين IP، ج: فقط عناوين عمومية، د: مطابقة MAC مقابل IP)
- سؤال 23: يسال عن تعليمات الامان - له 4 فروع (ا: اصلاح الشاشة، ب: طريق هروب، ج: مسطح آمن، د: فصل الكهرباء)

**في قاعدة البيانات (الحالة الفاسدة):**
- جميع الاسئلة 3, 9, 17, 23 لديها نفس الاسئلة الفرعية بالضبط:
  - "23ا": "اذا تعطلت شاشة الحاسوب يسمح للطالب ان يحاول اصلاحها بنفسه"
  - "23ب": "يجب معرفة طريق هروب مسبقا لحالات نشوب حريق"
  - "17ج": "يجب استعمال مسطح آمن على طاولة العمل فقط"
  - "17د": "البروتوكول يعرف مطابقة لعناوين MAC مقابل عناوين IP"

هذا يعني ان الذكاء الاصطناعي عند التحليل الاولي نسخ اسئلة فرعية من سؤال واحد ولصقها تحت جميع الاسئلة multi_part.

---

### المشاكل البرمجية المؤكدة (3 مشاكل)

#### المشكلة 1: البحث بـ question_number (غير فريد) بدلا من question_db_id (UUID فريد)

**الملف:** `src/components/bagrut/BagrutExamPreview.tsx`

3 دوال تبحث بـ `question_number`:

1. `updateQuestionInSection` (سطر 222-238): عند تعديل سؤال فرعي اسمه "ا"، تجد اول "ا" في الشجرة - قد يكون تابعا لسؤال آخر
2. `updateImageInQuestions` (سطر 164-174): نفس المشكلة عند رفع صورة
3. `findQuestionDbId` (سطر 177-186): نفس المشكلة عند البحث عن معرف قاعدة البيانات

**الدليل:** في امتحان 2024، الرقم "ا" يظهر 4 مرات تحت 4 آباء مختلفين في نفس القسم.

#### المشكلة 2: React Keys تستخدم array index

- سطر 438: `key={index}` للتبويبات
- سطر 448: `key={sectionIndex}` لمحتوى التبويبات
- سطر 470: `key={qIndex}` للاسئلة الرئيسية
- سطر 942: `key={subIndex}` للاسئلة الفرعية

#### المشكلة 3: عدم ابطال Cache بعد الحفظ

بعد `handleSaveEditsToDb` (سطر 515-520)، يتم استدعاء `handlePreviewExam` لكن بدون `queryClient.invalidateQueries`.

---

### خطة الاصلاح النهائية

#### الاصلاح 1: تحويل البحث من question_number الى question_db_id

**ملف:** `src/components/bagrut/BagrutExamPreview.tsx`

**تغيير `updateQuestionInSection`** (سطر 222-238):
```typescript
// قبل
const updateQuestionInSection = useCallback((
  questions: ParsedQuestion[],
  questionNumber: string,
  updater: (q: ParsedQuestion) => ParsedQuestion
): ParsedQuestion[] => {
  return questions.map(q => {
    if (q.question_number === questionNumber) return updater(q);
    ...
  });
}, []);

// بعد
const updateQuestionInSection = useCallback((
  questions: ParsedQuestion[],
  questionDbId: string,
  updater: (q: ParsedQuestion) => ParsedQuestion
): ParsedQuestion[] => {
  return questions.map(q => {
    if (q.question_db_id === questionDbId) return updater(q);
    if (q.sub_questions && q.sub_questions.length > 0) {
      return {
        ...q,
        sub_questions: updateQuestionInSection(q.sub_questions, questionDbId, updater)
      };
    }
    return q;
  });
}, []);
```

**تغيير `updateImageInQuestions`** (سطر 164-174):
- نفس المنطق: تغيير `q.question_number === questionNumber` الى `q.question_db_id === questionDbId`

**حذف `findQuestionDbId`** (سطر 177-186):
- لم تعد ضرورية لاننا نستخدم question_db_id مباشرة

**تغيير `handleImageUploaded`** (سطر 189-219):
- تغيير المعامل من `questionNumber: string` الى `questionDbId: string`
- استخدام `questionDbId` مباشرة في Supabase update بدلا من البحث عبر `findQuestionDbId`

**تغيير `handleQuestionUpdate`** (سطر 246-272):
- استبدال `editingQuestion.question_number` بـ `editingQuestion.question_db_id`

**تغيير QuestionCard** (حوالي سطر 787):
- في callback `onImageUploaded`، تمرير `question.question_db_id` بدلا من `question.question_number`

#### الاصلاح 2: استبدال React Keys بـ UUID

| السطر | قبل | بعد |
|-------|------|------|
| 438 | `key={index}` | `key={section.section_db_id \|\| \`sec-${index}\`}` |
| 448 | `key={sectionIndex}` | `key={section.section_db_id \|\| \`sec-${sectionIndex}\`}` |
| 470 | `key={qIndex}` | `key={question.question_db_id \|\| \`q-${qIndex}\`}` |
| 942 | `key={subIndex}` | `key={subQ.question_db_id \|\| \`sub-${subIndex}\`}` |

#### الاصلاح 3: ابطال Cache بعد الحفظ

**ملف:** `src/pages/BagrutManagement.tsx`

بعد سطر 515 (`toast.success`):
```typescript
// ابطال cache لضمان تحديث البيانات عند التنقل
queryClient.invalidateQueries({ queryKey: ['bagrut'] });
```

#### الاصلاح 4: خطأ البناء

**ملف:** `src/test/setup.ts`

تغيير السطر 1:
```typescript
// قبل
import "@testing-library/jest-dom";

// بعد
// @ts-ignore
import "@testing-library/jest-dom";
```

---

### ملاحظة بخصوص البيانات الفاسدة الحالية

الاصلاحات البرمجية اعلاه تمنع حدوث المشكلة مستقبلا عند التعديل. لكن الامتحانات التي تحتوي على بيانات فاسدة (2023 و 2024) تحتاج الى:
- **اعادة تحليل من الـ PDF** (الخيار الافضل والاسرع)
- او تعديل يدوي من واجهة السوبر آدمن بعد تطبيق الاصلاحات

### ضمانات السلامة

1. `question_db_id` موجود دائما في الامتحانات المحفوظة (يتم تعيينه في `buildQuestionTree` سطر 167)
2. دالة `handleSaveEditsToDb` تستخدم `q.question_db_id` بالفعل في سطر 506-508 - لذلك الحفظ لقاعدة البيانات لن يتاثر
3. لا يتم تغيير اي منطق في الادخال الاولي (`insertQuestion`) او بناء الشجرة (`buildQuestionTree`)
4. Fallback `|| \`q-${index}\`` في React Keys يحمي الامتحانات الجديدة قبل الحفظ

### الملفات المتاثرة
1. `src/components/bagrut/BagrutExamPreview.tsx` - الاصلاح الجوهري (UUID + Keys)
2. `src/pages/BagrutManagement.tsx` - ابطال Cache
3. `src/test/setup.ts` - اصلاح خطا البناء

