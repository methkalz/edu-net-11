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

  if (!isHtml) {
    const withBreaks = DOMPurify.sanitize(html.replace(/\n/g, '<br>'));
    return (
      <div
        className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
        style={wrapStyle}
        dangerouslySetInnerHTML={{ __html: withBreaks }}
      />
    );
  }

  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col', 'style'],
    ADD_ATTR: ['style', 'colspan', 'rowspan', 'dir'],
  });

  // Inject table + image constraint styles before the content
  const styledHtml = `<style>table{table-layout:fixed;width:100%;border-collapse:collapse}td,th{overflow-wrap:break-word;word-break:break-word}img{max-width:100%;height:auto;display:block}</style>${sanitized}`;

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      style={wrapStyle}
      dangerouslySetInnerHTML={{ __html: styledHtml }}
    />
  );
};

export default SafeHtml;
