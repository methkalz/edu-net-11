
# خطة إعادة هندسة نظام مقارنة PDF — جاهز لمئات الملفات

## 1. تشخيص المشاكل الحالية (بناءً على مراجعة الكود)

### ❌ مشاكل بنيوية (Architectural)
1. **Job واحد لكل الدفعة (`internal`)** يعالج كل أزواج المقارنة O(N²/2) في تنفيذ واحد
   - 17 ملف = 136 زوج → CPU timeout (~2s)
   - 100 ملف = 4,950 زوج → مستحيل ضمن حدود Edge Function
2. **لا يوجد Stuck Job Recovery** — أي job عالق في `processing` لا يُستعاد أبداً
3. **النص الكامل (`extracted_text`) داخل جدول النتائج** — كل قراءة للدفعة تجلب ميغابايتات مكررة
4. **Sequential awaits داخل `for` loop** في `pdf-process-jobs` (لا parallelism)
5. **N+1 Query**: `processRepositoryComparison` يجلب كل نتائج الدفعة + كل الـ hashes لكل ملف على حدة
6. **`pdf-enqueue-batch` يولد embeddings synchronously** — لـ 100 ملف قد يصل إلى 10 ثوانٍ (timeout على enqueue)
7. **Insert sequential** للنتائج (loop مع await) بدلاً من bulk insert
8. **لا يوجد عمود تقدّم على مستوى الدفعة** — UI يحسبها من تجميع الصفوف (ثقيل + غير لحظي)
9. **Cron كل 10 ثوانٍ فقط** — مع 10 jobs/run = throughput محدود جداً

---

## 2. الحل المقترح — معمارية Sharded Work Queue

### 🎯 المبدأ الأساسي
تحويل كل وحدة عمل ثقيلة إلى **مهمة ذرّية صغيرة** (≤ 500ms) قابلة للتوازي والاسترداد.

### 🧱 طبقات النظام الجديدة

```text
┌──────────────────────────────────────────────────────────┐
│  1. Enqueue (خفيف فقط — لا embeddings هنا)             │
│     → ينشئ batch + N صفوف نتائج بـ bulk insert         │
│     → ينشئ N "prepare" jobs                            │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  2. prepare_file job (واحد لكل ملف)                    │
│     → يولّد embedding + keywords + hash                 │
│     → يحفظ النص في pdf_comparison_texts (جدول منفصل)   │
│     → عند اكتمال كل الـ prepare → ينشئ shards          │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  3. internal_shard jobs (مقسومة لقطع 50 زوج)           │
│     → كل shard يعالج مجموعة أزواج (i,j) محددة         │
│     → 100 ملف = 4950 زوج / 50 = 99 shard متوازية      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  4. aggregate_internal job                              │
│     → يجمع نتائج كل الـ shards → يحدّث صفوف النتائج    │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  5. repository jobs (موجود — يبقى)                     │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  6. add_to_repo jobs (موجود — يبقى)                    │
└──────────────────────────────────────────────────────────┘
```

---

## 3. تغييرات قاعدة البيانات

### جدول جديد: `pdf_comparison_texts`
فصل النصوص الكبيرة عن صفوف النتائج (تقليل حجم القراءة 90%+):
- `result_id` (FK)
- `extracted_text` (TEXT)
- `embedding` (vector 1024)
- `top_keywords` (text[])

### جدول جديد: `pdf_comparison_shards`
نتائج وسيطة للـ shards:
- `batch_id`, `shard_index`, `pair_results` (JSONB), `status`

### إضافة لـ `pdf_comparison_jobs`
- `payload` (JSONB) — لتخزين نطاق الأزواج لكل shard `{from_idx, to_idx, pair_ranges}`
- `processing_started_at` (timestamp) — لكشف الـ stuck jobs
- `worker_id` (uuid) — لتجنّب صراع العمال

### إضافة لـ `pdf_comparison_results` — عمود تقدّم سريع
- `progress_percent` (int)
- `progress_phase` (text: prepare/internal/repository/add_to_repo/done)

### دالة SQL محدّثة `claim_pdf_jobs`:
- تستخدم `FOR UPDATE SKIP LOCKED` (atomicity حقيقية)
- **تستعيد** الـ jobs العالقة `processing` لأكثر من 60 ثانية تلقائياً
- ترفع `attempts`، تضع `worker_id` و`processing_started_at`

### دالة SQL جديدة `compute_batch_progress(batch_id)`:
- تُرجع التقدّم الإجمالي بضربة واحدة (للـ UI)

---

## 4. تغييرات Edge Functions

### `pdf-enqueue-batch` (تبسيط جذري)
- يستقبل metadata فقط (filePath + fileName) — **لا نص ولا embedding**
- bulk insert لـ N صفوف + N `prepare_file` jobs
- يُرجع `batchId` فوراً (< 500ms حتى لـ 500 ملف)

### `pdf-prepare-file` (جديد — handler داخل process-jobs)
- يقرأ النص من Storage مرة واحدة
- يولد embedding + keywords + hash
- يحفظ في `pdf_comparison_texts`
- آخر prepare يُنشئ `internal_shard` jobs بناءً على عدد الملفات

### `pdf-process-jobs` (إعادة كتابة)
- **Parallel processing**: `Promise.all` بدل for-await (حتى 5 jobs بالتوازي داخل نفس الاستدعاء)
- استدعاء RPC `claim_pdf_jobs` فقط (بدون fallback القديم)
- handler منفصل لكل نوع job (prepare/internal_shard/aggregate/repository/add_to_repo)
- timeout watchdog: إذا اقترب الوقت من 25s → يُرجع الـ jobs غير المكتملة لـ pending

### Cron محدّث
- يبقى كل 10 ثوانٍ، لكن يستدعي **3 instances بالتوازي** (3× throughput)
- كل instance يأخذ 5 jobs → 15 job/10s = 90 job/دقيقة

---

## 5. تغييرات الواجهة (Frontend)

### `BatchProgressTracker`
- يستخدم `compute_batch_progress` RPC بدل تجميع الصفوف يدوياً
- يعرض المرحلة الحالية (تحضير → مقارنة داخلية → مستودع → إضافة)
- شريط تقدّم حقيقي 0-100% بدل "في الانتظار"

### `cancelBatch`
- يبقى كما هو (DELETE policies جاهزة) + يحذف الـ shards و الـ texts

---

## 6. مكاسب الأداء المتوقعة

| السيناريو | النظام الحالي | النظام الجديد |
|-----------|---------------|----------------|
| 17 ملف | عالق ❌ | ~30 ثانية ✅ |
| 50 ملف | مستحيل ❌ | ~90 ثانية ✅ |
| 100 ملف | مستحيل ❌ | ~3 دقائق ✅ |
| 500 ملف | مستحيل ❌ | ~15 دقيقة ✅ |
| Stuck recovery | لا يوجد ❌ | تلقائي خلال 60s ✅ |

---

## 7. خطة التنفيذ (مراحل آمنة)

**المرحلة 1 — Recovery فوري (5 دقائق):**
- إلغاء الـ jobs العالقة الحالية
- إضافة `processing_started_at` + recovery في `claim_pdf_jobs`

**المرحلة 2 — تقسيم العمل الداخلي (الأهم):**
- جدول `pdf_comparison_shards` + payload
- shard generator + aggregate job
- إعادة كتابة `processInternalComparison` كـ shard handler

**المرحلة 3 — فصل النصوص + prepare phase:**
- جدول `pdf_comparison_texts`
- `prepare_file` job
- تبسيط `pdf-enqueue-batch`

**المرحلة 4 — تقدّم لحظي + تحسينات UI:**
- `compute_batch_progress` RPC
- تحديث `BatchProgressTracker`

**المرحلة 5 — Parallel workers:**
- `Promise.all` في process-jobs
- 3× cron instances

---

## 8. ضمانات الأمان والاستقرار

- ✅ كل jobs ذرّية (≤ 500ms) — لا CPU timeout أبداً
- ✅ Stuck recovery تلقائي (60s)
- ✅ `SKIP LOCKED` يمنع double-processing
- ✅ `attempts < max_attempts` يمنع loops لانهائية
- ✅ Cancel batch ينظّف كل الـ shards + texts (cascade)
- ✅ RLS policies تبقى كما هي (نضيف فقط للجداول الجديدة)
- ✅ خوارزمية المقارنة (الأوزان + coverage) **لا تتغير** — فقط طريقة التشغيل

---

## ⚠️ ملاحظة مهمة
هذه إعادة هندسة جوهرية تمسّ:
- 3 جداول قاعدة بيانات (إضافة جداول جديدة + أعمدة)
- 2 Edge Functions (إعادة كتابة جزئية)
- 1 RPC function (تحديث)
- 1 component (تحديث UI)

سأنفّذها على مراحل، وكل مرحلة قابلة للاختبار باستقلال. هل توافق على البدء بالمرحلة 1 (Recovery الفوري) ثم المرحلة 2 (تقسيم العمل)؟
