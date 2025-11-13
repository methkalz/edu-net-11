import { useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface HTMLEmbedWrapperProps {
  content: string;
}

const HTMLEmbedWrapper = ({ content }: HTMLEmbedWrapperProps) => {
  useEffect(() => {
    // Find all HTML embed divs
    const htmlEmbeds = document.querySelectorAll('div[data-type="html-embed"]');

    htmlEmbeds.forEach((embed) => {
      const htmlContent = embed.getAttribute('data-html-content');
      const title = embed.getAttribute('data-title') || 'محتوى HTML تفاعلي';
      const height = embed.getAttribute('data-height') || '400px';

      if (!htmlContent) return;

      // Skip if already processed
      if (embed.querySelector('iframe')) return;

      // Create wrapper structure
      const wrapper = document.createElement('div');
      wrapper.className = 'html-embed-wrapper my-4 relative group';

      const card = document.createElement('div');
      card.className = 'bg-card border border-border rounded-lg overflow-hidden shadow-sm';

      const header = document.createElement('div');
      header.className = 'bg-muted px-4 py-2 flex items-center justify-between border-b border-border';

      const titleElement = document.createElement('h3');
      titleElement.className = 'text-sm font-medium text-foreground';
      titleElement.textContent = title;

      const controls = document.createElement('div');
      controls.className = 'flex gap-2';

      // Fullscreen button
      const fullscreenBtn = document.createElement('button');
      fullscreenBtn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8';
      fullscreenBtn.title = 'ملء الشاشة';
      fullscreenBtn.innerHTML = `
        <svg class="maximize-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
          <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
          <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
          <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
        </svg>
        <svg class="minimize-icon h-4 w-4 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
          <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
          <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
          <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
        </svg>
      `;

      const iframeContainer = document.createElement('div');
      iframeContainer.style.height = height;

      const iframe = document.createElement('iframe');
      iframe.setAttribute('srcdoc', htmlContent);
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups');
      iframe.className = 'w-full h-full border-0';
      iframe.title = title;

      // Fullscreen functionality
      fullscreenBtn.addEventListener('click', async () => {
        const maximizeIcon = fullscreenBtn.querySelector('.maximize-icon');
        const minimizeIcon = fullscreenBtn.querySelector('.minimize-icon');

        try {
          if (!document.fullscreenElement) {
            await wrapper.requestFullscreen();
            maximizeIcon?.classList.add('hidden');
            minimizeIcon?.classList.remove('hidden');
            fullscreenBtn.title = 'الخروج من ملء الشاشة';
            wrapper.classList.add('bg-black', 'flex', 'items-center', 'justify-center');
            iframe.style.cssText = 'width: 100vw !important; height: 100vh !important; max-width: 100vw; max-height: 100vh; border-radius: 0;';
          } else {
            await document.exitFullscreen();
            maximizeIcon?.classList.remove('hidden');
            minimizeIcon?.classList.add('hidden');
            fullscreenBtn.title = 'ملء الشاشة';
            wrapper.classList.remove('bg-black', 'flex', 'items-center', 'justify-center');
            iframe.style.cssText = '';
          }
        } catch (error) {
          console.error('خطأ في تبديل وضع ملء الشاشة:', error);
        }
      });

      // Handle ESC key
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          const maximizeIcon = fullscreenBtn.querySelector('.maximize-icon');
          const minimizeIcon = fullscreenBtn.querySelector('.minimize-icon');
          maximizeIcon?.classList.remove('hidden');
          minimizeIcon?.classList.add('hidden');
          fullscreenBtn.title = 'ملء الشاشة';
          wrapper.classList.remove('bg-black', 'flex', 'items-center', 'justify-center');
          iframe.style.cssText = '';
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);

      // Assemble the structure
      controls.appendChild(fullscreenBtn);
      header.appendChild(titleElement);
      header.appendChild(controls);
      iframeContainer.appendChild(iframe);
      card.appendChild(header);
      card.appendChild(iframeContainer);
      wrapper.appendChild(card);

      // Replace the original embed with the new structure
      embed.replaceWith(wrapper);
    });
  }, [content]);

  return (
    <div
      className="lesson-content text-xl text-foreground/90 leading-9 break-words max-w-full p-8 bg-gradient-to-r from-muted/30 to-muted/20 rounded-3xl border-2 border-border/30 shadow-sm prose prose-lg max-w-none [&_p]:min-h-[1.5em] [&_p]:mb-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default HTMLEmbedWrapper;
