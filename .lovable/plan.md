
# اصلاح فشل رفع الصور عبر BagrutImageUpload

## المشكلة
مكون `BagrutImageUpload` يستخدم رقم السؤال (`questionNumber`) مباشرة في اسم الملف عند الرفع:
```
const fileName = `q${questionNumber}_${Date.now()}.${fileExt}`;
```
عندما يحتوي رقم السؤال على احرف عربية (مثل "ز" او "23-ط")، يرفض Supabase Storage الملف بسبب خطأ `InvalidKey` لان الاحرف العربية غير مسموحة في مسارات التخزين.

بينما `uploadImageToStorage` في `BagrutQuestionEditDialog` (المستخدمة من داخل المحرر) تعمل بشكل صحيح لانها تستخدم اسماء ملفات آمنة بدون احرف عربية:
```
const fileName = `editor_${Date.now()}_${Math.random()...}.${fileExt}`;
```

## الحل
تعديل `BagrutImageUpload.tsx` لتنظيف رقم السؤال من الاحرف العربية قبل استخدامه في اسم الملف.

### التعديل في ملف واحد: `src/components/bagrut/BagrutImageUpload.tsx`

اضافة دالة تحويل الاحرف العربية الى حروف لاتينية في اسم الملف:

```text
أ → a, ب → b, ت → t, ث → th, ج → j, ح → h, خ → kh,
د → d, ذ → dh, ر → r, ز → z, س → s, ش → sh, ص → s2,
ض → d2, ط → t2, ظ → z2, ع → e, غ → gh, ف → f, ق → q,
ك → k, ل → l, م → m, ن → n, هـ → h2, و → w, ي → y
```

تغيير سطر 41 من:
```
const fileName = `q${questionNumber}_${Date.now()}.${fileExt}`;
```
الى:
```
const sanitized = sanitizeForFilename(questionNumber);
const fileName = `q${sanitized}_${Date.now()}.${fileExt}`;
```

هذا يضمن ان اسم الملف يحتوي فقط على احرف لاتينية وارقام، مما يمنع خطأ `InvalidKey` من Supabase Storage.
