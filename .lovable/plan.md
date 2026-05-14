
## نتائج الفحص الفعلي للمشروع

| البند | الحالة |
|---|---|
| ملف migration `20260514120000_pdf_comparison_jobs_queue.sql` موجود في الكود | ✅ |
| **جدول `pdf_comparison_jobs` في قاعدة البيانات** | ❌ غير موجود |
| **أعمدة `batch_status`, `embedding`, `top_keywords`** على `pdf_comparison_results` | ❌ مفقودة (فقط `batch_id` موجود) |
| **Extensions `pg_cron` و `pg_net`** | ❌ غير مفعّلتين (schema `cron` غير موجود) |
| **Cron job `process-pdf-comparison-jobs`** | ❌ غير مجدول |
| **RPC `claim_pdf_jobs`** | ❌ غير موجود |
| RPC `match_documents_hybrid` | ✅ موجود |
| Realtime على `pdf_comparison_results` | ✅ مُضاف للـ publication |
| Edge functions `pdf-enqueue-batch`, `pdf-process-jobs`, `pdf-add-to-repository` | ✅ موجودة في الكود (تُنشر تلقائياً) |

**الخلاصة:** الـ migration الموجود في المستودع لم يُنفَّذ على قاعدة البيانات إطلاقاً. كل البنية التحتية للطابور مفقودة. بالإضافة إلى ذلك، الـ migration الأصلي يحتوي على ثغرتين يجب إصلاحهما قبل التطبيق.

---

## مشاكل يجب إصلاحها في الـ migration الأصلي

1. **جدولة cron داخل migration بقيم `current_setting('app.settings.supabase_url')`** — هذه الإعدادات غير مضبوطة، لذلك ستفشل الجدولة بصمت (مغلّفة بـ `EXCEPTION WHEN OTHERS`). يجب إخراج جدولة الـ cron من الـ migration نهائياً وتنفيذها عبر أداة `insert` بقيم صريحة (per project conventions: لا نضع URL/service_role_key في migrations لأنها تُنسخ للمشاريع المستنسخة).
2. **عدم وجود `claim_pdf_jobs`** — الـ edge function يعتمد على fallback أقل أماناً عند تشغيلات cron متزامنة.

---

## الخطة

### 1) تطبيق migration بنيوي معدّل (عبر أداة migration)

ينشئ كل ما يلي:
- جدول `pdf_comparison_jobs` + الفهارس الثلاثة + trigger `updated_at` + RLS policies (`users_view_own_jobs`, `users_insert_own_jobs`)
- إضافة `batch_status`, `embedding FLOAT8[]`, `top_keywords TEXT[]` على `pdf_comparison_results`
- تفعيل extensions: `pg_cron`, `pg_net`
- إنشاء **`claim_pdf_jobs(max_jobs INT)`** مع `FOR UPDATE SKIP LOCKED` لمنع race conditions
- **بدون** `cron.schedule` (يُنفَّذ في الخطوة 2 منفصلاً)

### 2) جدولة cron عبر أداة insert (لا migration)

تنفيذ صريح بـ URL + service_role_key مباشرة — مطابق لإرشادات Lovable لجدولة المهام:

```sql
SELECT cron.schedule(
  'process-pdf-comparison-jobs',
  '10 seconds',
  $$SELECT net.http_post(
    url := 'https://swlwhjnwycvjdhgclwlx.supabase.co/functions/v1/pdf-process-jobs',
    headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
```

ملاحظة: إذا لم يدعم plan الحالي صياغة `'10 seconds'`، نسقط تلقائياً إلى `'* * * * *'` (كل دقيقة).

### 3) تحديث ملف الـ migration الأصلي في المستودع

تعديل `20260514120000_pdf_comparison_jobs_queue.sql` لحذف بلوك `cron.schedule` وإضافة `claim_pdf_jobs` — حتى يبقى المستودع متّسقاً مع ما طُبِّق فعلياً (ولا يُعاد تنفيذ migration معطوب لاحقاً).

### 4) تحقق نهائي

- `SELECT * FROM cron.job;` — تأكيد جدولة الـ job
- `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;` — مراقبة التنفيذ بعد ~30 ثانية
- استدعاء `pdf-enqueue-batch` تجريبياً ومراقبة `pdf_comparison_jobs.status` ينتقل من `pending` → `processing` → `completed`
- التحقق من logs الـ edge function `pdf-process-jobs`

---

## ما لن يتغيّر

- لن يُمَس كود `pdf-add-to-repository`, `pdf-enqueue-batch`, `pdf-process-jobs` — جميعها موجودة وتعمل، نحتاج فقط البنية التحتية.
- لن تُمَس RLS أو policies على `pdf_comparison_results` أو الجداول الأخرى.
- لن يُمَس Realtime — مُفعَّل مسبقاً.

## السرّ المطلوب

`SUPABASE_SERVICE_ROLE_KEY` يجب وضعه نصياً داخل أمر `cron.schedule` (هذه ممارسة Supabase الموصى بها لأن `pg_cron` يعمل داخل قاعدة البيانات نفسها ولا يستطيع قراءة env vars). سأستخرجه من إعدادات المشروع وقت التنفيذ.
