# مرجع Edge Functions الشامل — منصة EDU-NET

> آخر تحديث: 2026-08-17 · مشروع Supabase: `swlwhjnwycvjdhgclwlx` · عدد الدوال: **39**

هذا الملف يوثّق كل Edge Function موجودة في `supabase/functions/`: الغرض، المدخلات، المخرجات، المتغيّرات السرّية، الجداول المتأثرة، من يستدعيها في الواجهة، ومستوى الحماية.

---

## 0) نظرة معمارية عامة

- **بيئة التشغيل**: Deno على Supabase Edge Runtime. النشر تلقائي عند تعديل الملفات.
- **الكود المشترك**: مجلد `supabase/functions/_shared/` فقط (قاعدة صارمة: لا استيراد من دالة إلى أخرى).
  - `cors.ts` — رؤوس CORS الموحّدة.
  - `pdf-helpers.ts` — أدوات تطبيع النص، التقطيع (segments)، التشابه.
  - `pdf-settings.ts` — قراءة إعدادات المقارنة من قاعدة البيانات (ممنوع أي قيم مضمّنة في الكود).
  - `embeddings.ts` — توليد المتجهات الدلالية.
  - `stopwords.ts` — كلمات التوقف العربية/العبرية/الإنجليزية.
- **نمط الأمان القياسي المتبع**:
  1. معالجة `OPTIONS` وإرجاع `corsHeaders`.
  2. قراءة `Authorization: Bearer <jwt>` ورفض الطلب بـ 401 عند غيابه.
  3. عميل `anon` بالتوكن للتحقق من الهوية (`auth.getUser()`)، ثم عميل `service_role` للعمليات الإدارية.
  4. التحقق من الدور من جدول `profiles` (`superadmin` / `school_admin` / `teacher`) قبل أي عملية حساسة.
  5. تسجيل العملية في `audit_log` (best-effort، لا يُفشل الطلب).
- **الأسرار المستخدمة عبر المشروع**:
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` (بوابة Lovable AI), `GOOGLE_SERVICE_ACCOUNT`, `GOOGLE_FOLDER`, `RESEND_API_KEY`, `APP_URL`.
- **`verify_jwt`**: مضبوط في `supabase/config.toml` للدوال المذكورة هناك؛ الدوال غير المذكورة تعمل بالإعداد الافتراضي وتقوم بالتحقق يدويًا داخل الكود.

---

## 1) إدارة المستخدمين والصلاحيات

### `admin-set-user-password`
- **الغرض**: تعيين كلمة مرور جديدة لمستخدم مباشرة من لوحة السوبر أدمن (بديل رابط الاستعادة عند فشله).
- **المدخلات**: `{ user_id: string, new_password: string }` (طول 8–128).
- **المخرجات**: `{ success: true }` أو `{ error }` مع 400/401/403/500.
- **الأمان**: JWT مطلوب + الدور يجب أن يكون `superadmin`؛ **ممنوع** تغيير كلمة مرور سوبر أدمن آخر.
- **الجداول**: `profiles` (قراءة)، `audit_log` (كتابة `admin_set_password`).
- **الأسرار**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **الاستدعاء**: `src/pages/UserManagement.tsx`.
- **ملاحظة تقنية**: يستخدم `auth.getUser()` وليس `getClaims()` (سبب خطأ non-2xx سابقًا).

### `create-admin` / `update-admin`
- **الغرض**: إنشاء/تحديث حساب مدير نظام مع سجل `profiles` مطابق.
- **الأمان**: `service_role` داخليًا؛ أدوات تشغيلية (لا تُستدعى من الواجهة حاليًا).
- **الجداول**: `profiles` + `auth.admin.createUser/updateUserById`.

### `create-school-admin`
- **الغرض**: إنشاء مدير مدرسة مع إنشاء/ربط المدرسة وباقتها.
- **المدخلات**: `CreateSchoolAdminRequest` (بيانات المدير + المدرسة + `package_id`).
- **الجداول**: `profiles`, `schools`, `school_packages`.

### `create-user-without-login`
- **الغرض**: إنشاء مستخدم + مدرسة دون تسجيل دخول تلقائي (تفادي استبدال جلسة الأدمن الحالي).
- **المدخلات**: `{ email, password, full_name, school_name, city, package_id }`.
- **الاستدعاء**: `src/components/SchoolAdminManagement.tsx`.

### `create-teacher`
- **الغرض**: إنشاء معلم، ربطه بالمدرسة والصفوف المختارة.
- **الجداول**: `profiles`, `classes`, `teacher_classes`, `audit_log`.
- **الاستدعاء**: `src/components/TeacherManagement.tsx`.

### `create-student`
- **الغرض**: إنشاء طالب وربطه بالمدرسة/الصف.
- **المدخلات**: `{ school_id, full_name, email, phone, password }`.
- **الجداول**: `profiles`, `students`.
- **الاستدعاء**: `ClassForm.tsx`, `ClassStudentsManager.tsx`.

### `create-demo-users`
- **الغرض**: تهيئة بيانات تجريبية (سوبر أدمن، معلم، طالب، ولي أمر، مدرسة، صفوف).
- **الجداول**: `profiles`, `schools`, `courses`, `enrollments`, `guardians`.
- **ملاحظة**: كلمة المرور الافتراضية للحسابات التجريبية `Demo123!`.

### `delete-user-completely`
- **الغرض**: حذف شامل للمستخدم عبر كل الجداول المرتبطة ثم من `auth`.
- **المدخلات**: `{ userId, userType }`.
- **الجداول**: `profiles`, `students`, `class_students`, `teacher_classes`, `enrollments`, `audit_log`.
- **الاستدعاء**: `TeacherManagement.tsx`.

### `cleanup-orphaned-users`
- **الغرض**: كشف وحذف حسابات `auth` بلا `profiles` (أو العكس).
- **المدخلات**: `{ dryRun = false, confirmDelete = false }` — وضع المعاينة أولًا ثم التأكيد.
- **الاستدعاء**: `src/components/admin/OrphanedUsersCleanup.tsx`.

### `impersonate-user`
- **الغرض**: دخول السوبر أدمن إلى حساب مستخدم عبر Magic Link مؤقّت للدعم الفني.
- **المخرجات**: `{ success, magicLink }` ثم إعادة توجيه المتصفح.
- **الجداول**: `profiles`, `audit_log` (حدث `USER_IMPERSONATION_STARTED`).
- **الاستدعاء**: `src/components/admin/DirectImpersonationButton.tsx`.

### `generate-access-pin` + `login-with-pin`
- **الغرض**: دخول إداري برمز PIN مؤقّت بدل كلمة المرور.
- **`generate-access-pin`**: يولّد رمزًا مع صلاحية زمنية ويخزّنه في `admin_access_pins` (+ `audit_log`).
- **`login-with-pin`**: يتحقق من الرمز ويصدر رابط دخول (يستخدم `APP_URL` لتحديد وجهة إعادة التوجيه).
- **الاستدعاء**: `src/components/admin/PinLoginDialog.tsx`.

### `track-login` / `update-user-login`
- **الغرض**: تحديث آخر دخول وعدّاد الدخول في `profiles`.
- **المدخلات**: `{ user_id }` / `{ p_user_id, p_login_timestamp, p_login_count }`.
- **الحالة**: تُستدعى من طبقة تتبّع الدخول (`useLoginTracking`) أو من قواعد خلفية؛ `verify_jwt = true` لـ `track-login`.

---

## 2) امتحانات البجروت (Bagrut)

### `parse-bagrut-exam` — الدالة الأضخم (1689 سطرًا)
- **الغرض**: تحليل ملف امتحان بجروت (PDF/صور) بالذكاء الاصطناعي وتحويله إلى بنية أسئلة كاملة.
- **آلية العمل**:
  1. إنشاء صف في `bagrut_parsing_jobs` (حالة `pending`) وإرجاع `jobId` فورًا.
  2. المعالجة في الخلفية (`EdgeRuntime.waitUntil`) مع تحديث `progress` و`current_step` لعرض شريط تقدّم حقيقي.
  3. استدعاء نموذج `gemini-2.5-pro` عبر بوابة Lovable AI (`LOVABLE_API_KEY`).
  4. **تمريرة ثانية** مخصّصة للجداول التفاعلية (استخدام `?` للفراغات) و`[BLANK:X]` لأسئلة ملء الفراغ.
  5. `open_ended` كنوع احتياطي عند عدم القدرة على التصنيف.
  6. `sanitizeBase64Images`: رفع أي صور مضمّنة إلى Supabase Storage واستبدالها بروابط (مع تحويل المفاتيح العربية إلى لاتينية لسلامة المسارات).
  7. تطبيع النقاط: حد أدنى 0.5، توزيع الباقي تنازليًا، دون إجبار الأعداد الصحيحة.
- **الأمان**: JWT + التحقق من الدور من `profiles`.
- **الاستدعاء**: `src/components/bagrut/BagrutExamUploader.tsx`.

### `check-bagrut-job`
- **الغرض**: استعلام حالة مهمة التحليل (Polling).
- **المدخلات**: `{ jobId }`.
- **المخرجات**: `{ success, status, progress, currentStep, result, error, fileName, createdAt, updatedAt }`.
- **الأمان**: JWT + شرط `user_id = المستخدم الحالي` (لا يمكن قراءة مهام الآخرين).
- **الاستدعاء**: `BagrutExamUploader.tsx` كل بضع ثوانٍ حتى `completed`/`failed`.

> **ملاحظة عن النشر**: إتاحة امتحان البجروت للطلاب لا تتم عبر Edge Function بل عبر جدول `bagrut_exam_publications` وسياسات RLS — السوبر أدمن يتيح للمعلمين، والمعلم ينشر لصفوفه بإعدادات مستقلة.

---

## 3) بنك الأسئلة والتوليد الذكي

### `generate-smart-questions`
- **الغرض**: توليد أسئلة من محتوى الدروس عبر AI وإضافتها إلى `question_bank`.
- **المدخلات**: محتوى/معرّف الدرس، `lesson_name` (إلزامي)، عدد الأسئلة، الأنواع، مستوى الصعوبة.
- **قواعد أساسية**: معالجة النص كاملًا (لا اقتطاع)، مطابقة دقيقة لأسئلة صح/خطأ، ومنع التكرار (فحص من مرحلتين: تعليمات صارمة للنموذج + Jaccard في الواجهة).
- **الأسرار**: `LOVABLE_API_KEY`.
- **الاستدعاء**: `src/components/exam/SmartQuestionGenerator.tsx`.

### `fix-true-false-questions`
- **الغرض**: تدقيق وإصلاح أسئلة صح/خطأ المخزّنة (إجابات مقلوبة أو صيغ غير موحّدة).
- **المدخلات**: `{ dryRun: boolean }` — معاينة قبل الكتابة.
- **المخرجات**: `{ summary: { total, confirmed, corrected, normalized, skipped, dryRun }, results: FixResult[] }`.
- **الجداول**: `question_bank` (تحديث)، `audit_log` (توثيق كل تغيير).
- **الاستدعاء**: `src/hooks/useTrueFalseAutoFix.ts` ← صفحة `TrueFalseFixPage.tsx`.

---

## 4) منظومة مقارنة ملفات PDF

> جميع الإعدادات (العتبات، الأوزان، أحجام المقاطع) تُقرأ من قاعدة البيانات عبر `_shared/pdf-settings.ts` — **ممنوع** أي قيم ثابتة في الكود.

### `pdf-extract-text`
- **الغرض**: استخراج النص الخام من ملف مخزّن.
- **المدخلات**: `{ filePath, bucket }`.
- **تقني**: يفلتر بيانات الـ metadata/إصدار PDF لتجنّب «النص الشبحي» الذي يرفع نسبة التشابه زورًا.

### `pdf-add-to-repository`
- **الغرض**: إضافة مستند إلى مستودع المقارنة (`pdf_comparison_repository`) بعد استخراج النص وتقطيعه وتوليد المتجهات.
- **الجداول**: `pdf_comparison_repository`, `pdf_comparison_audit_log`.

### `pdf-compare`
- **الغرض**: مقارنة مستند واحد مقابل المستودع.
- **الخوارزمية**: مزيج Fuzzy + Jaccard + تغطية متماثلة (symmetric coverage)، مع تعزيز عند تجاوز 25%، والوزن النهائي `finalSimilarity` محسوب من `algorithm_weights` في قاعدة البيانات.
- **الجداول**: `pdf_comparison_results`, `pdf_comparison_repository`, `pdf_comparison_audit_log`.
- **الاستدعاء**: `src/hooks/usePDFComparison.ts`.

### `pdf-compare-batch`
- **الغرض**: مقارنة دفعة ملفات (كل ملف مقابل الباقي والمستودع) مع قياس الأداء.
- **الجداول**: + `pdf_comparison_performance_log`.

### `pdf-enqueue-batch`
- **الغرض**: إنشاء مهام مقارنة غير متزامنة في `pdf_comparison_jobs` بدل التنفيذ المباشر (لتفادي مهلة التنفيذ).
- **الاستدعاء**: `usePDFComparison.ts`.

### `pdf-process-jobs`
- **الغرض**: عامل المعالجة (Worker) الذي يسحب المهام من الطابور ويوزّعها على شرائح (`pdf_comparison_shards`) ثم يستدعي `pdf-add-to-repository` و`pdf-enrich-segments`.
- **التشغيل**: عبر Cron.

### `pdf-enrich-segments`
- **الغرض**: إثراء نتيجة مقارنة بمقاطع النص المتطابقة للعرض التفصيلي.
- **المدخلات**: `{ result_id, against_id }`.

### `pdf-get-all-segments`
- **الغرض**: إرجاع كل المقاطع المتطابقة لنتيجة مقارنة لعرضها في الواجهة.
- **المدخلات**: `{ comparisonId }`.
- **الاستدعاء**: `src/components/pdf-comparison/BatchComparisonResult.tsx`.

### `setup-pdf-cron`
- **الغرض**: تسجيل/تحديث مهمة `pg_cron` التي تستدعي `pdf-process-jobs` دوريًا.

---

## 5) المحتوى التعليمي والألعاب

### `grade10-rebuild-ka-cards`
- **الغرض**: إعادة بناء بطاقات «مغامرة المعرفة» للصف العاشر من مواضيع المحتوى باستخدام AI.
- **المدخلات**: `{ section_id, dry_run }`.
- **الجداول**: `grade10_ka_topics`, `grade10_ka_lessons`, `grade10_ka_questions`, قراءة من `grade11_lessons`, تحقق الدور من `profiles`.
- **الأسرار**: `LOVABLE_API_KEY`.
- **الاستدعاء**: `src/components/admin/Grade10KaRebuildPanel.tsx`.

### `grade11-migrate-lesson-images`
- **الغرض**: تحويل صور Base64 المضمّنة في دروس الصف الحادي عشر إلى ملفات في Storage واستبدالها بروابط عامة.
- **الأوضاع (`action`)**:
  - `scan` (يتطلب `topic_id`) — إحصاء الصور المعلّقة وحجم المحتوى دون تعديل.
  - `migrate` (يتطلب `lesson_id`) — معالجة **درس واحد** بحد أقصى `max_images` (افتراضي 5، سقف 12) — تصميم *قابل للاستئناف* لتفادي انهيار الذاكرة/المهلة.
  - `restore` (`topic_id` أو `lesson_ids`) — إرجاع المحتوى الأصلي من النسخة الاحتياطية.
- **الجداول**: `grade11_lessons`, `grade11_lesson_content_backup` (نسخة أصلية واحدة لكل درس قبل أول تحويل).
- **التخزين**: `grade11-documents/grade11-lesson-images/{lesson_id}/{uuid}.{ext}` مع `cacheControl: 31536000`.
- **الأمان**: `superadmin` فقط.
- **النتيجة الفعلية**: قسم «جرافيكا» انخفض من ~19.6MB إلى ~218KB (تقليص 99%).
- **ملاحظة**: تبويب «أدوات الصيانة» أُزيل من واجهة الصف الحادي عشر؛ الدالة ما زالت منشورة وقابلة للاستدعاء.

### `reset-game-data`
- **الغرض**: تصفير تقدّم الألعاب لطالب/درس/لعبة أو للنظام كاملًا.
- **المدخلات**: `{ action, userId, lessonId, gameId, adminId }`.
- **الجداول**: `grade11_game_progress`, `grade11_game_achievements`, `grade11_generated_questions`, `grade11_lesson_completion_caps`, `grade11_lesson_rewards`, `grade11_player_profiles`, `player_game_progress`, `pair_matching_sessions`, `pair_matching_results`, `profiles`, `audit_log`.
- **الاستدعاء**: `src/hooks/useGameDataManagement.ts`.

---

## 6) تكامل Google Workspace

جميعها تعتمد على `GOOGLE_SERVICE_ACCOUNT` (JSON لحساب خدمة) وتوقيع JWT يدويًا للحصول على access token من Google OAuth.

| الدالة | الغرض | المدخلات | مستدعاة من |
|---|---|---|---|
| `test-google-connection` | فحص صحة بيانات حساب الخدمة والصلاحيات | — | `useGoogleDocs.ts` |
| `create-drive-folder` | إنشاء مجلد في Drive | `{ folderName, parentFolderId }` | `useGoogleDocs.ts` |
| `create-google-doc` | إنشاء مستند Google للطالب وتسجيله | `{ studentName, documentContent, folderId }` | `useGoogleDocs.ts`, `useGrade10MiniProjects.ts` |
| `list-drive-files` | سرد ملفات مجلد Drive | `{ folderId, includeAllFiles }` | `useGoogleDocs.ts` |

- `GOOGLE_FOLDER` = معرّف المجلد الجذر الافتراضي.
- `create-google-doc` يكتب في جدول `google_documents` ويتحقق من `profiles`.
- `verify_jwt = true` للأربع دوال.

---

## 7) التصدير والبريد والإحصاءات

### `enhanced-pdf-export`
- **الغرض**: تصدير محتوى المحرر إلى PDF بتنسيق متقدّم (رؤوس/تذييل/RTL).
- **الاستدعاء**: `src/components/editor/ExportEngine.tsx`.

### `export-to-pdf`
- **الحالة**: نسخة مبسّطة/تجريبية (تعيد نصًا مُرمَّزًا Base64 لا PDF حقيقيًا) — **غير مستخدمة من الواجهة**. مرشّحة للحذف أو الاستبدال بمولّد فعلي.

### `send-email`
- **الغرض**: إرسال بيانات الدخول للطالب/المعلم عبر Resend.
- **المدخلات**: `{ studentEmail, studentName, schoolName, username, password, userType }`.
- **الأسرار**: `RESEND_API_KEY`.
- **الاستدعاء**: `ClassStudentsManager.tsx`.

### `calculate-daily-stats`
- **الغرض**: احتساب إحصاءات النشاط اليومي وتخزينها.
- **المدخلات**: `{ date, school_id }`.
- **الجداول**: `daily_activity_stats`, `schools`.
- **الاستدعاء**: `src/hooks/useAdvancedStudentStats.ts`.

---

## 8) جدول ملخّص سريع

| # | الدالة | التصنيف | JWT/دور | مستدعاة من الواجهة |
|---|---|---|---|---|
| 1 | admin-set-user-password | مستخدمون | superadmin | ✅ |
| 2 | create-admin | مستخدمون | service | ❌ (تشغيلية) |
| 3 | update-admin | مستخدمون | service | ❌ |
| 4 | create-school-admin | مستخدمون | superadmin | ✅ |
| 5 | create-user-without-login | مستخدمون | superadmin | ✅ |
| 6 | create-teacher | مستخدمون | admin | ✅ |
| 7 | create-student | مستخدمون | admin/معلم | ✅ |
| 8 | create-demo-users | مستخدمون | service | ❌ |
| 9 | delete-user-completely | مستخدمون | admin | ✅ |
| 10 | cleanup-orphaned-users | صيانة | superadmin | ✅ |
| 11 | impersonate-user | دعم | superadmin | ✅ |
| 12 | generate-access-pin | دخول | superadmin | ✅ |
| 13 | login-with-pin | دخول | عام + PIN | ✅ |
| 14 | track-login | تتبّع | JWT | غير مباشر |
| 15 | update-user-login | تتبّع | service | غير مباشر |
| 16 | parse-bagrut-exam | بجروت | JWT | ✅ |
| 17 | check-bagrut-job | بجروت | JWT (مالك المهمة) | ✅ |
| 18 | generate-smart-questions | أسئلة | JWT | ✅ |
| 19 | fix-true-false-questions | أسئلة | JWT | ✅ |
| 20 | pdf-extract-text | PDF | JWT | ✅ |
| 21 | pdf-add-to-repository | PDF | JWT | ✅ |
| 22 | pdf-compare | PDF | JWT | ✅ |
| 23 | pdf-compare-batch | PDF | JWT | داخلي |
| 24 | pdf-enqueue-batch | PDF | JWT | ✅ |
| 25 | pdf-process-jobs | PDF | Cron/service | ❌ |
| 26 | pdf-enrich-segments | PDF | service | داخلي |
| 27 | pdf-get-all-segments | PDF | JWT | ✅ |
| 28 | setup-pdf-cron | PDF | service | ❌ |
| 29 | grade10-rebuild-ka-cards | محتوى | superadmin | ✅ |
| 30 | grade11-migrate-lesson-images | محتوى | superadmin | ✅ (بعد إزالة التبويب: برمجيًا) |
| 31 | reset-game-data | ألعاب | admin | ✅ |
| 32 | test-google-connection | Google | JWT | ✅ |
| 33 | create-drive-folder | Google | JWT | ✅ |
| 34 | create-google-doc | Google | JWT | ✅ |
| 35 | list-drive-files | Google | JWT | ✅ |
| 36 | enhanced-pdf-export | تصدير | — | ✅ |
| 37 | export-to-pdf | تصدير | — | ❌ (تجريبية) |
| 38 | send-email | بريد | — | ✅ |
| 39 | calculate-daily-stats | إحصاءات | service | ✅ |

---

## 9) توصيات تقنية

1. **`export-to-pdf`**: غير مستخدمة ولا تنتج PDF حقيقيًا — يُنصح بحذفها أو دمجها مع `enhanced-pdf-export`.
2. **`enhanced-pdf-export` و`export-to-pdf` و`send-email`**: لا تتحقق من JWT داخليًا — يُستحسن إضافتها إلى `config.toml` بـ `verify_jwt = true`.
3. **`create-admin` / `create-demo-users` / `update-admin`**: أدوات تشغيلية بامتيازات عالية وغير مستدعاة من الواجهة — يُفضّل تقييدها أو أرشفتها.
4. **توحيد CORS**: عدة دوال تعرّف `corsHeaders` محليًا بدل `_shared/cors.ts` — توحيدها يقلل التباين.
5. **`grade11-migrate-lesson-images`**: تعتمد على `npm:@supabase/supabase-js@2/cors` وهو مسار غير قياسي — يُفضّل الانتقال إلى `_shared/cors.ts`.
6. **المراقبة**: استخدم سجلات كل دالة من لوحة Supabase عند تشخيص أي فشل، خصوصًا `parse-bagrut-exam` و`pdf-process-jobs` لطول زمن تنفيذهما.
