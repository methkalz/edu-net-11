
# إصلاح فوري — توسيع CHECK constraint على `job_type`

## المشكلة
حقل `job_type` في `pdf_comparison_jobs` محمي بـ CHECK constraint يقبل فقط:
`('internal', 'repository', 'add_to_repo')`

عند محاولة إدخال الأنواع الجديدة (`internal_shard`, `aggregate_internal`) من البنية المعمارية الجديدة، يفشل الإدخال:

```
code: "23514"
message: 'new row for relation "pdf_comparison_jobs" violates check constraint "pdf_comparison_jobs_job_type_check"'
```

## الحل (Migration واحدة)

```sql
ALTER TABLE public.pdf_comparison_jobs
  DROP CONSTRAINT IF EXISTS pdf_comparison_jobs_job_type_check;

ALTER TABLE public.pdf_comparison_jobs
  ADD CONSTRAINT pdf_comparison_jobs_job_type_check
  CHECK (job_type IN (
    'internal',           -- legacy (لن تُستخدم بعد الآن)
    'internal_shard',     -- جديد
    'aggregate_internal', -- جديد
    'repository',
    'add_to_repo',
    'prepare_file'        -- محجوز للمرحلة 3
  ));
```

## ما سيحدث بعد التطبيق
- المحاولة التالية لرفع الـ 17 ملف ستنجح في إنشاء الـ shards (تقريباً 4 shards × 40 زوج)
- الـ cron سيلتقطها وينفّذها بالتوازي
- النتائج تظهر خلال ~30 ثانية

## لا تغييرات أخرى
- لا توجد تغييرات على الكود أو الواجهة — البنية الحالية صحيحة
- فقط constraint قديم لم نحدّثه في المرحلة السابقة
