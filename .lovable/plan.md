
# اصلاح نظام توليد الأسئلة الذكية (نسخة محسّنة)

## ملخص التغييرات

تعديل ملف واحد فقط: `supabase/functions/generate-smart-questions/index.ts`

لا تأثير على الأسئلة المخزنة أو الامتحانات الحالية - التغييرات تطال عملية التوليد فقط.

---

## التغيير 1: ازالة قص المحتوى بالكامل

**الوضع الحالي:** سطر 48 يقص المحتوى عند 8000 حرف
```
lessonContent.substring(0, 8000)
```

**التغيير:** ازالة `.substring(0, 8000)` وارسال `lessonContent` كاملاً بدون أي قص.

---

## التغيير 2: تحسين System Prompt لتغطية جميع الدروس

اضافة تعليمات صريحة في الـ System Prompt:
```text
"المحتوى المقدم قد يتضمن عدة دروس. يجب تحليل النص كاملاً واستخراج الدروس المختلفة، ثم توزيع الأسئلة بالتساوي على جميع الدروس الموجودة. لا تركز على درس واحد وتتجاهل البقية."
```

---

## التغيير 3: اصلاح منطق صح/خطأ

### 3a: تقييد الـ Schema بـ enum

في تعريف الـ Tool Schema (سطر 120)، تغيير وصف `correct_answer_text`:

```javascript
correct_answer_text: { 
  type: 'string', 
  description: 'نص الإجابة الصحيحة. لأسئلة صح/خطأ يجب أن تكون القيمة "صح" أو "خطأ" فقط بدون أي كلمات اضافية'
}
```

### 3b: استخدام مطابقة تامة بدل includes

استبدال سطر 318:
```javascript
// قبل (خاطئ)
correctChoice = q.correct_answer_index === 0 ? choicesWithIds[0] : choicesWithIds[1];

// بعد (صحيح)
const answerText = q.correct_answer_text?.trim();
const isTrue = answerText === 'صح' || answerText === 'صحيح' || answerText === 'true';
correctChoice = isTrue ? choicesWithIds[0] : choicesWithIds[1];
```

ملاحظة: نضيف `'صحيح'` و `'true'` كاحتياط فقط مع المطابقة التامة (===) وليس includes، لأن النموذج قد يستخدمها رغم التعليمات. هذا لا يسبب False Positives لأن المطابقة تامة.

### 3c: تحسين الـ Fallback

استبدال سطر 330:
```javascript
// قبل (خطير - يختار الأول صامتاً)
correct_answer: correctChoice?.id || choicesWithIds[0].id,

// بعد (يسجل تحذير عند الفشل)
correct_answer: correctChoice?.id || (() => {
  console.warn('⚠️ Could not match correct answer for:', q.question_text, 'answer:', q.correct_answer_text);
  return choicesWithIds[0].id;
})(),
```

---

## ملخص الملفات المتأثرة

| الملف | نوع التغيير |
|---|---|
| `supabase/functions/generate-smart-questions/index.ts` | تعديل (ازالة القص + اصلاح صح/خطأ + تحسين prompt) |

## التأثير على البيانات الحالية

لا يوجد أي تأثير. التغييرات تطال فقط عملية توليد أسئلة جديدة. جميع الأسئلة والامتحانات المخزنة تبقى كما هي.
