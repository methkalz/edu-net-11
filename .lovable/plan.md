

# اصلاح عرض اكواد HTML الخام في اسئلة fill_blank (ملء الفراغ)

## المشكلة
سؤال "ز" من نوع `fill_blank`. في الكود الحالي (سطر 675-678)، اسئلة `fill_blank` تُعرض باستخدام دالة `renderFillBlankText` التي تتعامل مع النص كنص عادي وليس HTML. بما ان نص السؤال يحتوي على تنسيقات HTML من المحرر الغني (مثل `<p class="min-h-[1.5em]">`), هذه العلامات تظهر كنص خام بدلا من ان يتم تفسيرها كـ HTML.

## الحل
تعديل دالة `renderFillBlankText` لتقوم بتجريد علامات HTML من النص قبل معالجته، مع الحفاظ على وظيفة حقول الفراغ.

### التعديل في ملف واحد: `src/components/bagrut/BagrutExamPreview.tsx`

**تعديل دالة `renderFillBlankText` (سطر 546-610):**

1. اضافة خطوة اولى لتجريد علامات HTML من النص باستخدام DOMParser:
   - انشاء عنصر DOM مؤقت وتحويل HTML الى نص عادي
   - استخراج المحتوى النصي فقط (`textContent`) مع الحفاظ على علامات الفراغ `[فراغ:X]`
   - هذا يزيل كل علامات HTML مثل `<p>` و `<span>` ويبقي النص المقروء فقط

2. تطبيق المعالجة الحالية (البحث عن الفراغات واستبدالها بحقول ادخال) على النص المنظف

```text
التدفق الحالي:
  HTML text → renderFillBlankText → يعرض HTML كنص خام

التدفق الجديد:
  HTML text → strip HTML tags → renderFillBlankText → يعرض نص نظيف مع حقول الفراغ
```

### التفاصيل التقنية

في بداية الدالة `renderFillBlankText`، يتم اضافة:
```
const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || html;
};
```

ثم استخدام `stripHtml(text)` بدلا من `text` مباشرة قبل تطبيق regex الفراغات. هذا يضمن ان النص الذي يتم معالجته خال من علامات HTML.

