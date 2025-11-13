/**
 * Wraps user-provided HTML content in a full HTML document with responsive viewport and CSS
 * to ensure proper display within iframes, especially in fullscreen mode.
 * 
 * @param htmlContent - The raw HTML content to wrap
 * @returns A complete HTML document string with responsive meta tags and CSS
 */
export function wrapHTMLContentForIframe(htmlContent: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      box-sizing: border-box;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    
    body > * {
      max-width: 100% !important;
    }
    
    img, video, canvas, svg {
      max-width: 100% !important;
      height: auto !important;
    }
    
    iframe {
      max-width: 100% !important;
    }
    
    table {
      width: 100% !important;
      table-layout: auto !important;
      overflow-x: auto;
      display: block;
    }
    
    /* Prevent horizontal scrolling */
    body {
      overflow-x: hidden;
    }
    
    /* Ensure flex and grid containers don't overflow */
    .container, [class*="container"] {
      max-width: 100% !important;
    }
  </style>
</head>
<body>
  <div id="embed-content">
    ${htmlContent}
  </div>
</body>
</html>`;
}
