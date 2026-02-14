

# اصلاح مشكلة النص الطويل الذي يمنع ظهور زر القلم

## السبب الجذري
النصوص الطويلة بدون مسافات (مثل جمل HTML طويلة او نصوص منسوخة من Word على سطر واحد) تتسبب في تمدد الحاوية افقيا الى ما لا نهاية. هذا يدفع زر القلم خارج المنطقة المرئية حتى مع `sticky`.

## الحل: 3 تعديلات في ملفين

### التعديل 1: حاوية QuestionCard - منع التمدد
**الملف:** `src/components/bagrut/BagrutExamPreview.tsx` (سطر 650)

تغيير حاوية QuestionCard من `overflow-visible` الى:
```
overflow-hidden max-w-full
```
مع اضافة CSS utilities للتحكم بكسر النص:
```
[style: overflow-wrap: break-word; word-break: break-word]
```

وتغيير زر القلم من `sticky float-left` الى `absolute top-2 left-2` مع `z-50` لانه مع `overflow-hidden` لن يختفي لان الحاوية نفسها لن تتمدد.

### التعديل 2: SafeHtml - منع النص من التمدد
**الملف:** `src/components/bagrut/SafeHtml.tsx`

اضافة `overflow-wrap: break-word; word-break: break-word; max-width: 100%;` على div الحاوية في كلا الحالتين (HTML وغير HTML). وكذلك اضافة CSS مخصص للجداول داخل SafeHtml:
```css
table { table-layout: fixed; width: 100%; }
td, th { overflow-wrap: break-word; word-break: break-word; }
```

### التعديل 3: عناصر اضافية في QuestionCard
**الملف:** `src/components/bagrut/BagrutExamPreview.tsx`

- خيارات الاختيار (سطر 830): اضافة `break-words` على نص الخيار
- الاجابة الصحيحة والشرح (سطر 855-868): اضافة `overflow-hidden` على الحاوية
- حاوية الاسئلة الفرعية (سطر 873): اضافة `overflow-hidden max-w-full`

## التفاصيل التقنية

الملفات المتأثرة:
- `src/components/bagrut/BagrutExamPreview.tsx` - QuestionCard container + edit button + sub-elements
- `src/components/bagrut/SafeHtml.tsx` - اضافة word-break وtable-layout

المبدأ: بدلا من محاولة ابقاء الزر مرئيا رغم التمدد، نمنع التمدد اصلا عبر اجبار النص على الالتفاف وتقييد عرض الجداول.

