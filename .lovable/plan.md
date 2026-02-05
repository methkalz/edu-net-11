
# خطة دعم الأسئلة الفرعية المتداخلة (Nested Sub-questions)

## ✅ تم التنفيذ

### التعديلات المنجزة

#### 1. Edge Function (`parse-bagrut-exam/index.ts`)
- ✅ **Tool Schema محدث** - يدعم `sub_questions` متداخلة لمستويين
- ✅ **`visitQuestionsRecursive`** - دالة عودية لزيارة جميع الأسئلة بأي عمق
- ✅ **`distributePointsToLeaves`** - توزيع عودي للعلامات على الأسئلة الطرفية فقط
- ✅ **`countLeavesRecursive`** - حساب الأسئلة الطرفية عودياً
- ✅ **System Prompt محسّن** - قواعد صريحة للتعامل مع الأسئلة متعددة المستويات

#### 2. BagrutQuestionRenderer (`src/components/bagrut/BagrutQuestionRenderer.tsx`)
- ✅ **عرض عودي** - يعرض الأسئلة الفرعية بأي عمق (lines 171-185)
- ✅ **FallbackAnswerArea** - يتحقق من `hasSubQuestions` قبل العرض

#### 3. BagrutQuestionEditDialog (`src/components/bagrut/BagrutQuestionEditDialog.tsx`)
- ✅ **SubQuestionEditor** - مكون جديد عودي لتحرير الأسئلة الفرعية المتداخلة
- ✅ **تغيير نوع السؤال** - إمكانية تغيير نوع أي سؤال فرعي
- ✅ **تعديل الخيارات** - تحرير خيارات الأسئلة الفرعية الموضوعية
- ✅ **دعم التداخل العميق** - المكون يستدعي نفسه لأي مستوى من التداخل

#### 4. BagrutGradingPage (`src/pages/BagrutGradingPage.tsx`)
- ✅ **QuestionCard عودي** - يعرض الأسئلة الفرعية بأي عمق
- ✅ **collectLeafQuestions** - يجمع الأسئلة الطرفية عودياً لحساب العلامات

---

## الهيكل المدعوم

```
سؤال 23 (multi_part - حاوية)
├── سؤال 23-أ (multi_part - حاوية أيضاً!)
│   ├── بند 1: صح/خطأ (1.33 علامة)
│   ├── بند 2: صح/خطأ (1.33 علامة)
│   └── بند 3: صح/خطأ (1.33 علامة)
├── سؤال 23-ب (open_ended)
├── سؤال 23-ج (calculation)
└── ...
```

---

## التوافق

| المكون | دعم التداخل | الحالة |
|--------|------------|--------|
| قاعدة البيانات (`parent_question_id`) | غير محدود | ✅ |
| `buildQuestionTree` | غير محدود (recursive) | ✅ |
| `BagrutQuestionRenderer` | غير محدود (recursive) | ✅ |
| `BagrutQuestionEditDialog` | غير محدود (recursive) | ✅ |
| `QuestionCard` في التصحيح | غير محدود (recursive) | ✅ |
| Tool Schema في Edge Function | مستويان | ✅ |
| `visitQuestions` في Edge Function | غير محدود (recursive) | ✅ |
| `distributePoints` في Edge Function | غير محدود (recursive) | ✅ |
