

## اصلاح عرض تنسيق نص السؤال في نظام البجروت

### المشكلة
نص السؤال يظهر بدون تنسيق (بدون فقرات، سطور جديدة، خط عريض، الخ) بينما شرح الاجابة يظهر بشكل صحيح. كلاهما يستخدم مكون `SafeHtml` لكن المشكلة في مكانين:

1. **نصوص الاسئلة المخزنة كنص عادي** (بدون HTML): تحتوي على `\n` للأسطر الجديدة لكن `SafeHtml` لا يحولها الى `<br>` عند العرض.
2. **خيارات الاجابة في المعاينة**: تُعرض كنص عادي `{choice.text}` بدون استخدام `SafeHtml`، فلا يظهر اي تنسيق.
3. **عرض السؤال للطالب** (`BagrutQuestionRenderer.tsx`): ملفوف في `div` مع `whitespace-pre-wrap` ما قد يتعارض مع تنسيقات `prose` في `SafeHtml`.

### الحل

#### 1. تحسين مكون `SafeHtml` لدعم النصوص العادية بشكل افضل
**ملف**: `src/components/bagrut/SafeHtml.tsx`
- عندما يكون النص عادي (غير HTML)، تحويل `\n` الى `<br>` قبل العرض بدلاً من الاعتماد على `whitespace-pre-wrap` فقط.
- هذا يضمن ظهور الاسطر الجديدة بشكل صحيح في جميع السياقات.

#### 2. اصلاح عرض الخيارات في معاينة السوبر ادمن
**ملف**: `src/components/bagrut/BagrutExamPreview.tsx` (سطر 888)
- استبدال `{choice.text}` بـ `<SafeHtml html={choice.text} />` لدعم التنسيق في نصوص الخيارات.

#### 3. ازالة التعارض في عرض الطالب
**ملف**: `src/components/bagrut/BagrutQuestionRenderer.tsx` (سطر 73)
- ازالة `whitespace-pre-wrap` من الـ `div` الذي يلف `SafeHtml`، لأن `SafeHtml` يتولى التنسيق داخلياً.

#### 4. اصلاح عرض الخيارات في مكون الطالب
**ملف**: `src/components/bagrut/BagrutQuestionRenderer.tsx`
- البحث عن اي مكان يعرض `choice.text` كنص عادي واستبداله بـ `SafeHtml`.

### التفاصيل التقنية

**تعديل `SafeHtml.tsx`**:
```typescript
// قبل
if (!isHtml) {
  return <div className={`whitespace-pre-wrap ${className}`} style={wrapStyle}>{html}</div>;
}

// بعد
if (!isHtml) {
  // تحويل الاسطر الجديدة الى <br> للعرض كـ HTML
  const withBreaks = html.replace(/\n/g, '<br>');
  const sanitized = DOMPurify.sanitize(withBreaks);
  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      style={wrapStyle}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

**تعديل `BagrutExamPreview.tsx` سطر 888**:
```typescript
// قبل
<span className="text-sm text-foreground whitespace-pre-wrap break-words">{choice.text}</span>

// بعد
<SafeHtml html={choice.text} className="text-sm text-foreground" />
```

**تعديل `BagrutQuestionRenderer.tsx` سطر 73**:
```typescript
// قبل
<div className="text-foreground whitespace-pre-wrap leading-relaxed">

// بعد
<div className="text-foreground leading-relaxed">
```

### الملفات المتأثرة
- `src/components/bagrut/SafeHtml.tsx` - تحسين معالجة النصوص العادية
- `src/components/bagrut/BagrutExamPreview.tsx` - تنسيق الخيارات
- `src/components/bagrut/BagrutQuestionRenderer.tsx` - ازالة تعارض CSS وتنسيق الخيارات

### النتيجة
جميع النصوص (اسئلة، خيارات، اجابات، شروحات) ستظهر بالتنسيق الصحيح سواء كانت مخزنة كـ HTML او كنص عادي، في جميع واجهات النظام (سوبر ادمن، معلم، طالب).
