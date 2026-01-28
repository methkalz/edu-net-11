

# خطة توحيد عرض الوسائط للصف العاشر مع الصف الحادي عشر

## المشكلة المكتشفة

بعد نسخ محتوى "أساسيات الاتصال" من الصف الحادي عشر إلى العاشر، هناك فروقات جوهرية في طريقة عرض الوسائط:

### الفروقات الرئيسية:

| الميزة | الصف الحادي عشر | الصف العاشر |
|--------|-----------------|-------------|
| **عرض الكود** | TypewriterCodeBlock مع أنيميشن كتابة تلقائية | عرض بسيط في `<pre>` بدون تنسيق |
| **عرض المحتوى** | Conditional rendering لتجنب التكرار | عرض HTML + Gamma معاً (قد يسبب تكرار) |
| **فيديو Google Drive** | مكون Grade11VideoFix لاستخراج drive_id | استخراج بسيط قد لا يعمل مع كل الروابط |
| **فيديو YouTube** | استخراج من metadata.video_url | استخراج من file_path فقط |
| **Lottie** | دعم animation_data + lottie_data + سرعة متحكم بها | دعم lottie_data فقط بدون سرعة |
| **تنظيم الوسائط** | فصل الفيديو عن البقية مع عنوان | كل الوسائط مع بطاقات موحدة |

## الحل المقترح

استبدال كامل منطق عرض الوسائط في `Grade10LessonContentDisplay.tsx` ليطابق تماماً `Grade11LessonContentDisplay.tsx`.

## التغييرات التقنية

### 1. تحديث Imports
إضافة المكونات المفقودة:
- `CodeBlock`
- `TypewriterCodeBlock`
- `Grade11VideoFix`
- `logger`
- `useRef`, `useEffect`

### 2. تحديث renderEmbeddedMedia للفيديو
```typescript
case 'video':
  // دعم metadata.source_type (youtube, google_drive, upload, url)
  if (metadata.source_type === 'youtube') {
    // استخراج YouTube ID من metadata أو file_path
  } else if (metadata.source_type === 'google_drive') {
    return <Grade11VideoFix media={media} metadata={metadata} />;
  } else {
    // فيديو عادي
  }
```

### 3. تحديث renderEmbeddedMedia للكود
```typescript
case 'code':
  // دعم nested metadata
  // استخدام TypewriterCodeBlock مع أنيميشن
  // أو CodeBlock العادي
```

### 4. تحديث renderEmbeddedMedia للوتي
```typescript
case 'lottie':
  // دعم metadata.animation_data + metadata.lottie_data
  // دعم إعدادات السرعة
  // استخدام LottieDisplay component
```

### 5. تحديث عرض المحتوى (Conditional Rendering)
```typescript
{lesson.content && (
  <>
    {lesson.content.includes('data-type="html-embed"') && (
      <HTMLEmbedWrapper content={lesson.content} />
    )}
    
    {lesson.content.includes('gamma.app/embed') && (
      <GammaEmbedWrapper content={lesson.content} />
    )}
    
    {/* فقط إذا لم يحتوي على HTML/Gamma */}
    {!lesson.content.includes('data-type="html-embed"') && 
     !lesson.content.includes('gamma.app/embed') && (
      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
    )}
  </>
)}
```

### 6. تحديث هيكل العرض
- فصل `videoMedia` عن `otherMedia`
- عرض الفيديوهات بشكل منفصل مع عنوان "مقاطع الفيديو"
- إضافة LottieDisplay component للتحكم بالسرعة

## ملخص الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/components/content/Grade10LessonContentDisplay.tsx` | إعادة كتابة شاملة لمطابقة Grade11 |

## النتيجة المتوقعة

بعد التنفيذ:
- أكواد HTML التفاعلية ستعمل بشكل صحيح
- عروض Gamma التقديمية ستظهر بدون تكرار
- فيديوهات YouTube و Google Drive ستعمل
- ملفات Lottie ستعرض مع إعدادات السرعة
- أكواد البرمجة ستظهر مع أنيميشن الطباعة

