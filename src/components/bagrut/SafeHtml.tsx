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

  if (!isHtml) {
    return <div className={`whitespace-pre-wrap ${className}`}>{html}</div>;
  }

  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col'],
    ADD_ATTR: ['style', 'colspan', 'rowspan', 'dir'],
  });

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default SafeHtml;
