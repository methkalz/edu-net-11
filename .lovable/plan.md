
# تحسين تجربة المقارنة — 4 تحسينات متناسقة

## 1. تنظيف قائمة الملفات المرفوعة بعد اكتمال الدفعة

`ComparisonUploadZone.tsx`:
- بعد نجاح إرسال الـ batch (`onBatchComplete` يُستدعى)، نُفرّغ `setFiles([])` بعد ثانية واحدة (toast قصير: "تم إرسال الملفات للمعالجة في الخلفية").
- هذا يُفرّغ منطقة الرفع تلقائياً، فيرى المعلم بطاقة التقدم فقط بدون قائمة الملفات المكدّسة.

## 2. "عرض النتائج" يفلتر حسب الـ batch، "سجل المقارنات" يعرض الكل

### تعديل `getComparisonHistory` في `usePDFComparison.ts`
- يقبل وسيطاً ثانياً اختيارياً: `batchId?: string`. عند تمريره، يضيف `.eq('batch_id', batchId)` ويزيل قيد `.limit(50)`.

### تعديل `ComparisonHistory.tsx`
- يضيف prop `batchId?: string` و`onBackToAll?: () => void`.
- يمرّر `batchId` إلى `getComparisonHistory`.
- إذا تم تمرير `batchId`: يعرض شريط أعلى الجدول "نتائج هذه الجلسة (17 ملف) — [عرض كامل السجل]" — زر يستدعي `onBackToAll`.
- العنوان في الـ header يصبح "نتائج هذه المقارنة" بدل "سجل المقارنات".

### تعديل `TeacherPDFComparisonPage.tsx` (و`PDFComparisonPage.tsx` بنفس النمط)
- حالة جديدة `viewingBatchId: string | null`.
- زر "عرض النتائج" في `BatchProgressTracker` → `setViewingBatchId(batch.batchId)` ثم `setActiveTab('history')`.
- الضغط على تاب "سجل المقارنات" يدوياً → `setViewingBatchId(null)`.
- يمرّر `batchId={viewingBatchId}` و`onBackToAll={() => setViewingBatchId(null)}` إلى `ComparisonHistory`.

### تعديل `BatchProgressTracker.tsx`
- `onViewResults` يستقبل `batchId` بدلاً من بدون وسيط: `onViewResults?: (batchId: string) => void`.

## 3. عدّاد "X من Y اكتمل" يتقدّم تدريجياً

المشكلة الحالية: العداد يحسب فقط الملفات التي وصلت قيمة 3 (نهائية). أثناء التقدم تكون كل الملفات في `internal_done` (1) أو `repository_done` (3 الآن)، فيظهر إما 0 أو 17.

### الحل في `BatchProgressTracker.tsx` — `computeBatchView`
- نُغيّر مفهوم "completed counter": ملف يُعتبر مكتملاً عند `repository_done` فما فوق (قيمة ≥ 3 — وهي الحالة النهائية الفعلية كما اتفقنا).
- نضيف عداداً وسطياً اختياري: `processedAtLeastInternal = values.filter(v => v >= 1).length` ونعرض "X من Y تمت المقارنة الداخلية" أثناء المرحلة الأولى.
- النص يصبح ديناميكياً:
  - إذا `completed === 0 && processedAtLeastInternal > 0`: "تمت مقارنة X من Y داخلياً..."
  - وإلا: "X من Y ملف اكتمل" (كما هو).
- العدّاد سيتدرّج فعلاً لأن كل ملف ينتقل من 0 → 1 → 3 بشكل مستقل (الـ aggregate يحدّث الـ batch_status لكل ملف على حدة).

## 4. تحذير "لا تُغلق الصفحة" أثناء الرفع + الإرسال

### في `ComparisonUploadZone.tsx`
- عند الضغط على "بدء المقارنة" وقبل اكتمال إرسال الدفعة (أي بين `setIsComparing(true)` و`onBatchComplete`):
  - نعرض **بانر بارز** أعلى منطقة الرفع (خلفية صفراء/ambar):
    - أيقونة `AlertTriangle`
    - النص: "⚠️ جارٍ رفع الملفات وإنشاء مهام المقارنة... **لا تُغلق الصفحة ولا تُحدّثها** حتى يكتمل الرفع وتظهر بطاقة التقدم. ستتمكن بعدها من مغادرة الصفحة بأمان."
  - نضيف `useEffect` يربط `beforeunload` خلال هذه المرحلة فقط لمنع الإغلاق غير المقصود.
- بعد ظهور بطاقة التقدم (batch صار في DB)، نُزيل البانر والـ beforeunload — التحذير يبقى خفيفاً داخل البطاقة نفسها كما هو.

## ملخص الملفات المُعدّلة

1. `src/components/pdf-comparison/ComparisonUploadZone.tsx` — تنظيف الملفات + بانر التحذير + beforeunload
2. `src/components/pdf-comparison/BatchProgressTracker.tsx` — عداد ديناميكي + تمرير batchId في onViewResults
3. `src/components/pdf-comparison/ComparisonHistory.tsx` — props جديدة (batchId, onBackToAll) + شريط "عرض كامل السجل"
4. `src/hooks/usePDFComparison.ts` — `getComparisonHistory(gradeLevel?, batchId?)`
5. `src/pages/TeacherPDFComparisonPage.tsx` — حالة `viewingBatchId` + ربط الأزرار
6. `src/pages/PDFComparisonPage.tsx` — نفس التعديل لصفحة الـ admin
