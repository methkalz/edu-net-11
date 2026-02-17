import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

/**
 * مكون لعرض HTML منسق بشكل آمن باستخدام DOMPurify
 * يدعم الجداول والألوان والتنسيقات المنسوخة من Word
 */
const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className = '' }) => {
  if (!html) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(html);

  const wrapStyle: React.CSSProperties = {
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    maxWidth: '100%',
  };

  // Shared bidi CSS injected into all HTML content
  const bidiCss = `
    [dir="rtl"] code, [dir="rtl"] pre, [dir="rtl"] kbd, [dir="rtl"] samp {
      direction: ltr;
      unicode-bidi: isolate;
    }
  `;

  if (!isHtml) {
    const withBreaks = DOMPurify.sanitize(html.replace(/\n/g, '<br>'));
    return (
      <div
        dir="rtl"
        className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
        style={wrapStyle}
        dangerouslySetInnerHTML={{ __html: `<style>${bidiCss}</style>${withBreaks}` }}
      />
    );
  }

  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col', 'style'],
    ADD_ATTR: ['style', 'class', 'colspan', 'rowspan', 'dir'],
  });

  // Inject table + image + bidi constraint styles before the content
  const styledHtml = `<style>table{table-layout:fixed;width:100%;border-collapse:collapse}td,th{overflow-wrap:break-word;word-break:break-word}img{max-width:100%;height:auto;display:block}${bidiCss}</style>${sanitized}`;

  return (
    <div
      dir="rtl"
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      style={wrapStyle}
      dangerouslySetInnerHTML={{ __html: styledHtml }}
    />
  );
};

export default SafeHtml;
