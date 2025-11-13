/**
 * Wraps user-provided HTML content in a full HTML document with responsive viewport and CSS
 * to ensure proper display within iframes, especially in fullscreen mode.
 * Includes auto-scaling JavaScript to fit content to viewport without scrollbars.
 * 
 * @param htmlContent - The raw HTML content to wrap
 * @returns A complete HTML document string with responsive meta tags, CSS, and auto-scaling JS
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
      height: auto;
      overflow: visible;
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
    
    #embed-content {
      width: fit-content;
      height: fit-content;
    }
    
    /* Ensure flex and grid containers don't overflow */
    .container, [class*="container"] {
      max-width: 100% !important;
    }
  </style>
  <script>
    function fitToViewport() {
      const body = document.body;
      const html = document.documentElement;
      
      // Get actual content dimensions
      const contentWidth = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      );
      const contentHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate scale factors (with padding consideration)
      const padding = 20; // 20px padding for safety
      const scaleX = (viewportWidth - padding) / contentWidth;
      const scaleY = (viewportHeight - padding) / contentHeight;
      
      // Use the smaller scale to ensure content fits in both dimensions
      const scale = Math.min(scaleX, scaleY, 1); // never scale up, only down
      
      // Apply scale if content is larger than viewport
      if (scale < 1) {
        body.style.transform = 'scale(' + scale + ')';
        body.style.transformOrigin = 'top left';
        body.style.width = (100 / scale) + '%';
        body.style.height = (100 / scale) + '%';
        body.style.overflow = 'visible';
        
        // Adjust container height to prevent extra space
        html.style.height = (contentHeight * scale) + 'px';
      } else {
        // Reset if no scaling needed
        body.style.transform = '';
        body.style.width = '';
        body.style.height = '';
        html.style.height = '';
      }
    }
    
    // Run on load
    window.addEventListener('load', fitToViewport);
    
    // Re-calculate on resize (important for fullscreen toggle)
    window.addEventListener('resize', fitToViewport);
    
    // Also run immediately in case content is already loaded
    if (document.readyState === 'complete') {
      fitToViewport();
    }
  </script>
</head>
<body>
  <div id="embed-content">
    ${htmlContent}
  </div>
</body>
</html>`;
}
