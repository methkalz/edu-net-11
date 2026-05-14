## الحالة الفعلية بعد الفحص

| Migration | الحالة |
|---|---|
| `20260514120000_pdf_comparison_jobs_queue.sql` | ✅ مطبَّق (الجدول والأعمدة `batch_status`, `embedding`, `top_keywords` موجودة) |
| `20260514140000_pdf_jobs_delete_policy.sql` | ✅ مطبَّق (سياسة `users_delete_own_jobs` موجودة) |
| `20260514130000_add_compared_file_pages.sql` | ❌ **غير مطبَّق** — العمود `compared_file_pages` مفقود |

## الخطة

تطبيق migration واحد فقط — إضافة العمود الناقص:

```sql
ALTER TABLE public.pdf_comparison_results
  ADD COLUMN IF NOT EXISTS compared_file_pages INTEGER DEFAULT 1;
```

هذا العمود يستعيد حساب تشابه الطول المعتمِد على عدد الصفحات (سلوك `pdf-compare-batch` القديم).

## بعد التطبيق

- لا حاجة لتعديل كود إضافي — الـ edge functions الحالية ستستخدم العمود تلقائياً عند توفّره.
- لا تأثير على البيانات الموجودة (DEFAULT = 1).
