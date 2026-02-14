
# تحسين مساحة العمل وإصلاح اختفاء زر الحفظ في حوار تعديل أسئلة البجروت

## المشكلة
1. مساحة العمل في حوار التعديل صغيرة (max-w-3xl + ScrollArea بارتفاع 60vh فقط)
2. زر "حفظ التعديلات" يختفي عند إضافة محتوى طويل لأن المحتوى يدفع الزر خارج الشاشة

## الحل

### تعديل ملف واحد: `src/components/bagrut/BagrutQuestionEditDialog.tsx`

**1. توسيع الحوار وتطبيق تخطيط Flex صارم:**

- توسيع `DialogContent` من `max-w-3xl` الى `max-w-5xl` لمساحة عمل أكبر
- تطبيق `flex flex-col` على `DialogContent` مع `max-h-[90vh]` لضمان أن الحوار لا يتجاوز الشاشة أبداً

**2. جعل منطقة المحتوى مرنة والفوتر ثابت:**

- إزالة `max-h-[60vh]` من `ScrollArea` واستبدالها بـ `flex-1 min-h-0` (تأخذ كل المساحة المتبقية بين الهيدر والفوتر)
- جعل `DialogHeader` بـ `shrink-0` (لا يتقلص أبداً)
- جعل `DialogFooter` بـ `shrink-0` مع `border-t pt-4` لفصل بصري واضح

**3. إضافة اختصار لوحة مفاتيح Ctrl+S:**

- إضافة `useEffect` يستمع لـ `Ctrl+S` / `Cmd+S` لحفظ التعديلات سريعاً بدون الحاجة للوصول للزر

```text
التخطيط الحالي:
  DialogContent [max-h-90vh, no flex]
    DialogHeader
    ScrollArea [max-h-60vh] ← محدود بشكل مصطنع
      ...content...
    DialogFooter ← يُدفع خارج الشاشة

التخطيط الجديد:
  DialogContent [max-h-90vh, flex flex-col]
    DialogHeader [shrink-0]
    ScrollArea [flex-1 min-h-0] ← يأخذ كل المساحة المتبقية
      ...content...
    DialogFooter [shrink-0, border-t] ← ثابت دائماً في الأسفل
```

هذا الحل يضمن بنسبة 100% بقاء زر الحفظ مرئياً مهما كان طول المحتوى، ويوفر مساحة عمل أكبر بنسبة ~40%.
