import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GammaEmbedWrapperProps {
  content: string;
}

/**
 * Wrapper component that adds fullscreen functionality to Gamma presentation iframes
 * in HTML content rendered via dangerouslySetInnerHTML
 */
const GammaEmbedWrapper: React.FC<GammaEmbedWrapperProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreenElements, setFullscreenElements] = useState<Map<HTMLElement, boolean>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // Find all Gamma iframes
    const iframes = containerRef.current.querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="gamma.app/embed"]'
    );

    if (iframes.length === 0) return;

    iframes.forEach((iframe) => {
      // Skip if already wrapped
      if (iframe.parentElement?.classList.contains('gamma-embed-wrapper-enhanced')) return;

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'gamma-embed-wrapper-enhanced relative group rounded-lg overflow-hidden';
      wrapper.style.margin = '1rem 0';

      // Create controls overlay
      const controls = document.createElement('div');
      controls.className = 'absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity';

      // Create fullscreen button
      const fullscreenBtn = document.createElement('button');
      fullscreenBtn.className = 'h-8 w-8 p-0 bg-background/90 backdrop-blur-sm rounded-md inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors';
      fullscreenBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="maximize-icon">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
          <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
          <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
          <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="minimize-icon hidden">
          <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
          <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
          <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
          <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
        </svg>
      `;
      fullscreenBtn.title = 'ملء الشاشة';

      // Fullscreen toggle function
      const toggleFullscreen = async () => {
        try {
          const maximizeIcon = fullscreenBtn.querySelector('.maximize-icon');
          const minimizeIcon = fullscreenBtn.querySelector('.minimize-icon');

          if (!document.fullscreenElement) {
            await wrapper.requestFullscreen();
            maximizeIcon?.classList.add('hidden');
            minimizeIcon?.classList.remove('hidden');
            fullscreenBtn.title = 'الخروج من ملء الشاشة';
            wrapper.classList.add('bg-black', 'flex', 'items-center', 'justify-center');
          } else {
            await document.exitFullscreen();
            maximizeIcon?.classList.remove('hidden');
            minimizeIcon?.classList.add('hidden');
            fullscreenBtn.title = 'ملء الشاشة';
            wrapper.classList.remove('bg-black', 'flex', 'items-center', 'justify-center');
          }
        } catch (error) {
          console.error('خطأ في تبديل وضع ملء الشاشة:', error);
        }
      };

      fullscreenBtn.addEventListener('click', toggleFullscreen);

      // Handle ESC key
      const handleFullscreenChange = () => {
        const maximizeIcon = fullscreenBtn.querySelector('.maximize-icon');
        const minimizeIcon = fullscreenBtn.querySelector('.minimize-icon');
        
        if (!document.fullscreenElement) {
          maximizeIcon?.classList.remove('hidden');
          minimizeIcon?.classList.add('hidden');
          fullscreenBtn.title = 'ملء الشاشة';
          wrapper.classList.remove('bg-black', 'flex', 'items-center', 'justify-center');
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);

      controls.appendChild(fullscreenBtn);

      // Wrap iframe
      iframe.parentNode?.insertBefore(wrapper, iframe);
      wrapper.appendChild(controls);
      wrapper.appendChild(iframe);

      // Store for cleanup
      setFullscreenElements((prev) => new Map(prev).set(wrapper, true));
    });

    return () => {
      document.removeEventListener('fullscreenchange', () => {});
    };
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="lesson-content text-xl text-foreground/90 leading-9 break-words max-w-full p-8 bg-gradient-to-r from-muted/30 to-muted/20 rounded-3xl border-2 border-border/30 shadow-sm prose prose-lg max-w-none [&_p]:min-h-[1.5em] [&_p]:mb-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default GammaEmbedWrapper;
