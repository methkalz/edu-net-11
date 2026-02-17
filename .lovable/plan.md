

## اصلاح شريط التمرير (Scrollbar) في نافذة تعديل السؤال

### المشكلة
نافذة تعديل السؤال تحتوي على `max-h-[90vh]` و `ScrollArea`، لكن المحتوى يُقطع بدون ظهور شريط تمرير. السبب هو أن مكون `ScrollArea` من Radix لا يضيف `overflow-y: auto` على الـ Viewport تلقائيًا في بعض الحالات.

### الحل
تعديلان بسيطان:

1. **`src/components/ui/scroll-area.tsx`**: اضافة `overflow-y-auto` الى عنصر `Viewport` لضمان ظهور شريط التمرير دائمًا عند تجاوز المحتوى.

2. **`src/components/bagrut/BagrutQuestionEditDialog.tsx`**: التأكد من أن `DialogContent` يستخدم `overflow-hidden` لمنع المحتوى من الخروج عن حدود النافذة، وأن `ScrollArea` لديها حد أقصى للارتفاع واضح.

### التفاصيل التقنية

**ملف `scroll-area.tsx` (سطر 15)**:
```
قبل: <Viewport className="h-full w-full rounded-[inherit]">
بعد: <Viewport className="h-full w-full rounded-[inherit] overflow-y-auto">
```

**ملف `BagrutQuestionEditDialog.tsx` (سطر 813)**:
```
قبل: <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col" dir="rtl">
بعد: <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" dir="rtl">
```

هذا يضمن ان المحتوى الطويل داخل نافذة التعديل يمكن تمريره بالكامل مع ظهور شريط التمرير.
