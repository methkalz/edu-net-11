## إزالة overrides و resolutions لـ @tiptap/core من package.json

### الهدف
إزالة قسمي `overrides` و `resolutions` الخاصين بـ `@tiptap/core` (السطور 127–132) من ملف `package.json`، مع إزالة الفاصلة الزائدة من نهاية سطر `devDependencies` (السطر 126) لتجنب خطأ JSON.

### التعديل المطلوب في ملف واحد فقط
- **الملف:** `package.json`
- **الإجراء:** استبدال السطور 126–132 بالمحتوى المعدّل بدون الفاصلة الزائدة وبدون قسمي overrides/resolutions.

### النتيجة المتوقعة
تجنب تثبيت `@tiptap/core` بالقوة على إصدار `3.22.4`، مما يسمح لـ npm بحل التبعيات بشكل طبيعي وقد يساعد في حل مشكلة Rollup الاختيارية على Windows.
