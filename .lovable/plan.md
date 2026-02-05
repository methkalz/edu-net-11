
# خطة دعم الأسئلة الفرعية المتداخلة (Nested Sub-questions)

## تشخيص المشكلة

من الصورة المرفقة، السؤال 23-أ يحتوي على 3 بنود فرعية (صح/خطأ) وليس سؤالاً واحداً. هذا يعني:

```
سؤال 23 (multi_part - حاوية)
├── سؤال 23-أ (multi_part - حاوية أيضاً!)
│   ├── بند 1: صح/خطأ
│   ├── بند 2: صح/خطأ  
│   └── بند 3: صح/خطأ
├── سؤال 23-ب
├── سؤال 23-ج
└── ...
```

## التحليل التقني

| المكون | دعم التداخل | الحالة |
|--------|------------|--------|
| قاعدة البيانات (`parent_question_id`) | غير محدود | يعمل |
| `buildQuestionTree` | غير محدود (recursive) | يعمل |
| `mapDbQuestionToParsed` | غير محدود (recursive) | يعمل |
| `BagrutQuestionRenderer` | غير محدود (recursive) | يعمل |
| `insertQuestion` في BagrutManagement | غير محدود (recursive) | يعمل |
| **Tool Schema في Edge Function** | **مستوى واحد فقط!** | المشكلة |
| `visitQuestions` في Edge Function | **مستوى واحد فقط!** | يحتاج تعديل |
| `distributePoints` في Edge Function | **مستويان فقط** | يحتاج تحسين |

### المشكلة المحددة في Tool Schema

الـ Schema الحالي:
```javascript
sub_questions: {
  type: 'array',
  items: {
    properties: {
      question_number, question_text, question_type, points, ...
      // لا يوجد sub_questions هنا!
    }
  }
}
```

يجب أن يكون:
```javascript
sub_questions: {
  type: 'array',
  items: {
    properties: {
      question_number, question_text, question_type, points, ...
      sub_questions: { ... } // تداخل عودي!
    }
  }
}
```

---

## التعديلات المطلوبة

### التعديل 1: تحديث Tool Schema في Edge Function

**الملف:** `supabase/functions/parse-bagrut-exam/index.ts`

**التغييرات:**
1. جعل `sub_questions` تدعم مستوى إضافي من التداخل
2. إضافة كل الخصائص اللازمة (choices, has_image, has_table, etc.) للمستوى الثاني

**السبب:** لكي يتمكن الـ AI من استخراج أسئلة مثل:
- سؤال 23 → أ، ب، ج، ...
- سؤال 23-أ → 1، 2، 3 (صح/خطأ)

---

### التعديل 2: تحديث دالة `visitQuestions` لتكون عودية بالكامل

**الملف:** `supabase/functions/parse-bagrut-exam/index.ts`

**الكود الحالي:**
```typescript
const visitQuestions = (parsedExam, visitor) => {
  for (const section of parsedExam.sections) {
    for (const q of section.questions) {
      visitor(q);
      if (q.sub_questions) {
        for (const sub of q.sub_questions) visitor(sub);
      }
    }
  }
};
```

**الكود المطلوب:**
```typescript
const visitQuestionsRecursive = (question, visitor) => {
  visitor(question);
  if (question.sub_questions) {
    for (const sub of question.sub_questions) {
      visitQuestionsRecursive(sub, visitor);
    }
  }
};

const visitQuestions = (parsedExam, visitor) => {
  for (const section of parsedExam.sections) {
    for (const q of section.questions) {
      visitQuestionsRecursive(q, visitor);
    }
  }
};
```

---

### التعديل 3: تحديث دالة `distributePoints` لدعم التداخل العميق

**الملف:** `supabase/functions/parse-bagrut-exam/index.ts`

**التغييرات:**
- جعل توزيع العلامات عودياً لأي عمق من التداخل
- السؤال الأب يحصل على 0 علامة إذا كان له أسئلة فرعية
- العلامات تُوزع على الأسئلة "الطرفية" (leaf questions) فقط

---

### التعديل 4: تحسين System Prompt للتعامل مع الأسئلة المتداخلة

**الملف:** `supabase/functions/parse-bagrut-exam/index.ts`

**إضافة تعليمات:**
```
**قاعدة صارمة للأسئلة متعددة المستويات:**
- السؤال الذي يحتوي على بنود فرعية (مثل 23-أ الذي فيه 3 بنود صح/خطأ) يكون من نوع multi_part
- البنود الفرعية تُخزن في sub_questions
- يمكن أن يكون هناك تداخل: سؤال 23 → أ (multi_part) → 1، 2، 3 (true_false)
- توزيع العلامات: علامة السؤال الأب تُوزع على أبنائه
  - مثال: سؤال 23-أ = 4 علامات، فيه 3 بنود → كل بند ≈ 1.33 علامة
```

---

### التعديل 5: التأكد من توافق واجهة التعديل

**الملف:** `src/components/bagrut/BagrutQuestionEditDialog.tsx`

**التحقق:**
- الواجهة تدعم عرض الأسئلة الفرعية للتعديل
- يجب التأكد من إمكانية إضافة أسئلة فرعية للأسئلة الفرعية

**ملاحظة:** بناءً على فحص الكود، التعديل الأخير على واجهة التعديل **لا يتعارض** مع التداخل، لكن قد نحتاج لتحسينها لاحقاً لإضافة أسئلة فرعية داخل فرعية.

---

## ملخص الملفات المتأثرة

| الملف | التعديلات |
|-------|-----------|
| `supabase/functions/parse-bagrut-exam/index.ts` | Tool Schema + visitQuestions + distributePoints + System Prompt |

---

## التفاصيل التقنية

### Tool Schema المحدث لـ sub_questions

```javascript
sub_questions: {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question_number: { type: 'string' },
      question_text: { type: 'string' },
      question_type: { type: 'string' },
      points: { type: 'number' },
      has_image: { type: 'boolean' },
      has_table: { type: 'boolean' },
      has_code: { type: 'boolean' },
      table_data: { type: 'object', additionalProperties: true },
      choices: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            is_correct: { type: 'boolean' }
          }
        }
      },
      correct_answer: { type: 'string' },
      answer_explanation: { type: 'string' },
      // تداخل عودي - مستوى ثاني
      sub_questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question_number: { type: 'string' },
            question_text: { type: 'string' },
            question_type: { type: 'string' },
            points: { type: 'number' },
            choices: { type: 'array', items: { type: 'object' } },
            correct_answer: { type: 'string' }
          }
        }
      }
    }
  }
}
```

### دالة توزيع العلامات العودية

```typescript
const distributePointsRecursive = (questions: any[], totalPoints: number) => {
  // حساب الأسئلة الطرفية (بدون فرعية)
  const leafCount = countLeaves(questions);
  
  if (leafCount === 0) return;
  
  const pointsPerLeaf = totalPoints / leafCount;
  
  for (const q of questions) {
    if (q.sub_questions && q.sub_questions.length > 0) {
      // الأب يحصل على 0 - العلامات على الأطراف فقط
      q.points = 0;
      distributePointsRecursive(q.sub_questions, q.points || pointsPerLeaf * countLeaves([q]));
    } else {
      q.points = pointsPerLeaf;
    }
  }
};
```

---

## التوافق مع التعديلات السابقة

| التعديل السابق | التوافق |
|---------------|---------|
| `FallbackAnswerArea` | متوافق - يتحقق من `hasSubQuestions` |
| `normalizeExamForReliability` | يحتاج تعديل ليكون عودياً |
| `hasAnswerMethod` في EditDialog | متوافق |

---

## ملاحظات مهمة

1. **الأداء**: التداخل العودي لن يؤثر على الأداء (عادة 2-3 مستويات كحد أقصى)
2. **قاعدة البيانات**: لا تحتاج تعديلات - `parent_question_id` يدعم أي عمق
3. **عرض الطالب**: `BagrutQuestionRenderer` عودي بالفعل - يعمل
4. **التصحيح**: منطق جمع العلامات في `buildBagrutPreview` يستخدم `sumPointsLeafOnly` العودي - يعمل
