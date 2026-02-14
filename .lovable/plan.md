

# اصلاح مشكلة الصور المضمنة كـ base64 في نص السؤال

## المشكلة
عند اضافة صورة من خلال محرر النصوص الغني (RichTextEditor) في حوار تعديل سؤال البجروت، يتم تخزين الصورة كنص base64 داخل حقل `question_text`. سلسلة base64 لصورة واحدة يمكن ان تكون مئات الالاف من الاحرف، مما يسبب:
- تمدد الصفحة افقيا بشكل هائل
- بطء شديد في الاداء
- اختفاء زر القلم وعناصر اخرى

## الحل: رفع الصورة الى Supabase Storage بدلا من تضمينها كـ base64

### التعديل 1: تعديل RichTextEditor لدعم رفع الصور للتخزين
**الملف:** `src/components/content/RichTextEditor.tsx`

- اضافة prop اختياري `onImageUpload?: (file: File) => Promise<string | null>` للمكون
- عند توفر هذا الـ prop، يتم رفع الصورة عبره والحصول على URL حقيقي بدلا من base64
- عند عدم توفره، يبقى السلوك الحالي (base64) للتوافق مع الاستخدامات الاخرى

### التعديل 2: توفير دالة رفع الصور في حوار تعديل البجروت
**الملف:** `src/components/bagrut/BagrutQuestionEditDialog.tsx`

- اضافة دالة `uploadImageToStorage` ترفع الصورة الى bucket `bagrut-exam-images` وتعيد الرابط العام
- تمرير هذه الدالة كـ `onImageUpload` prop لكل مكون `RichTextEditor` في الحوار

### التعديل 3: حماية SafeHtml من base64 المتبقي
**الملف:** `src/components/bagrut/SafeHtml.tsx`

- اضافة معالجة للصور المضمنة كـ base64: تحويل `<img src="data:image/...">` الى صورة محدودة الحجم مع `max-width: 100%` و `display: block`
- اضافة CSS لمنع اي عنصر من تجاوز عرض الحاوية: `img { max-width: 100%; height: auto; }`

### التعديل 4: تنظيف الـ paste من base64
**الملف:** `src/components/content/RichTextEditor.tsx`

- عند لصق محتوى يحتوي على صور base64 (مثل النسخ من Word)، يتم اعتراضها ورفعها ايضا عبر `onImageUpload` اذا توفر

---

## التفاصيل التقنية

```text
التدفق الحالي (المشكلة):
  ملف صورة → FileReader → base64 string → question_text (مئات الالاف من الاحرف)

التدفق الجديد:
  ملف صورة → Supabase Storage → URL قصير → question_text (رابط عادي)
```

الملفات المتأثرة:
- `src/components/content/RichTextEditor.tsx` - اضافة prop لرفع الصور + اعتراض اللصق
- `src/components/bagrut/BagrutQuestionEditDialog.tsx` - توفير دالة الرفع
- `src/components/bagrut/SafeHtml.tsx` - حماية CSS اضافية للصور

هذا الحل يعالج السبب الجذري (منع تخزين base64) ويحمي من البيانات الموجودة مسبقا عبر CSS.
