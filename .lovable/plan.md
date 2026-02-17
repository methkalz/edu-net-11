

## اصلاح مشكلة اتجاه النصوص المختلطة (RTL/LTR) في نظام البجروت

### المشكلة
النصوص التي تحتوي على أوامر تقنية (مثل CLI commands) او نصوص انجليزية تظهر بترتيب خاطئ لأن المكون يفرض `dir="rtl"` على كل المحتوى. كذلك عند تعيين محاذاة يسارية من محرر النصوص (text-align: left)، لا يتم احترامها.

### الحل

#### 1. استخدام `dir="auto"` بدلا من `dir="rtl"` في SafeHtml
**ملف**: `src/components/bagrut/SafeHtml.tsx`

`dir="auto"` يجعل المتصفح يحدد الاتجاه تلقائيا بناء على اول حرف قوي (strong character) في النص. هذا يعني:
- نص يبدا بالعربية → يعرض RTL
- نص يبدا بالانجليزية (مثل `R1(config)#`) → يعرض LTR

بالاضافة لذلك، نضيف CSS قاعدة `unicode-bidi: plaintext` التي تجعل كل فقرة تحدد اتجاهها بشكل مستقل حسب محتواها، وهي الطريقة الموصى بها من W3C للمحتوى المختلط.

#### 2. تحسين CSS للتعامل مع المحتوى المختلط
اضافة قواعد CSS تضمن:
- الفقرات التي تبدا بنص انجليزي/تقني تعرض LTR تلقائيا
- احترام `text-align` و `direction` المحددين من محرر النصوص
- عزل عناصر الكود (`code`, `pre`) في سياق LTR دائما

#### 3. اصلاح عرض fill_blank للنصوص التقنية
**ملف**: `src/components/bagrut/BagrutExamPreview.tsx`

تغيير الحاوية من `dir="rtl"` ثابت الى `dir="auto"` مع `whitespace-pre-wrap` للحفاظ على التنسيق.

#### 4. اصلاح نفس المشكلة في مكون الطالب
**ملف**: `src/components/bagrut/BagrutQuestionRenderer.tsx`

نفس التعديلات على حاوية النص.

### التفاصيل التقنية

**تعديل `SafeHtml.tsx`** - التعديل الرئيسي:
```typescript
// CSS محسّن للتعامل مع المحتوى المختلط
const bidiCss = `
  .safe-html-content {
    unicode-bidi: plaintext;
  }
  .safe-html-content p,
  .safe-html-content div,
  .safe-html-content li {
    unicode-bidi: plaintext;
  }
  .safe-html-content code,
  .safe-html-content pre,
  .safe-html-content kbd,
  .safe-html-content samp {
    direction: ltr;
    unicode-bidi: isolate;
    text-align: left;
  }
`;

// استبدال dir="rtl" بـ dir="auto" في جميع الاماكن
<div
  dir="auto"
  className={`safe-html-content prose prose-sm max-w-none dark:prose-invert ${className}`}
  style={wrapStyle}
  dangerouslySetInnerHTML={{ __html: `<style>${bidiCss}</style>${content}` }}
/>
```

**تعديل `BagrutExamPreview.tsx`** - حاوية fill_blank:
```typescript
// تغيير من dir ثابت الى auto
<p className="text-foreground whitespace-pre-wrap leading-8" dir="auto">
  {renderFillBlankText(...)}
</p>
```

**تعديل `BagrutQuestionRenderer.tsx`** - حاوية النص:
```typescript
<div className="text-foreground leading-relaxed" dir="auto">
```

### لماذا `dir="auto"` + `unicode-bidi: plaintext`؟
- **`dir="auto"`**: يحدد الاتجاه الاساسي تلقائيا بناء على اول حرف قوي
- **`unicode-bidi: plaintext`**: يجعل كل فقرة/عنصر داخلي يحدد اتجاهه بشكل مستقل حسب محتواه - هذا هو المعيار الذهبي الموصى به من W3C للمحتوى المعروض من مصادر خارجية
- النتيجة: سطر يبدا بـ `R1(config)#` يعرض LTR تلقائيا، وسطر يبدا بـ "اكتب الأمر" يعرض RTL تلقائيا

### الملفات المتأثرة
- `src/components/bagrut/SafeHtml.tsx` - التعديل الرئيسي
- `src/components/bagrut/BagrutExamPreview.tsx` - fill_blank container
- `src/components/bagrut/BagrutQuestionRenderer.tsx` - question text container

