import React, { useEffect } from 'react';

// Global script for image resizing functionality
const ImageResizer = () => {
  useEffect(() => {
    // Add global styles for image containers
    const style = document.createElement('style');
    style.textContent = `
      .image-container {
        position: relative;
        display: inline-block;
        margin: 20px auto;
        text-align: center;
        max-width: 100%;
      }
      
      .image-container img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: default;
        display: block;
        transition: all 0.3s ease;
      }
      
      .image-container:hover .image-resize-handles {
        opacity: 1;
      }
      
      .image-resize-handles {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        user-select: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 10;
      }
      
      .image-resize-handles:hover {
        background: rgba(0,0,0,0.9);
      }
      
      /* Custom scrollbar for editor */
      .document-editor::-webkit-scrollbar {
        width: 8px;
      }
      
      .document-editor::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      
      .document-editor::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      
      .document-editor::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      /* Page break styles for A4 mode */
      @media print {
        .page-break {
          page-break-before: always;
        }
      }
      
      /* Enhanced contenteditable styling */
      .document-editor:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      .document-editor p {
        margin: 1em 0;
      }

      .document-editor p:first-child {
        margin-top: 0;
      }

      .document-editor p:last-child {
        margin-bottom: 0;
      }
      
      /* Table enhancements */
      .document-editor table {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .document-editor table td,
      .document-editor table th {
        padding: 12px;
        border: 1px solid #ddd;
        text-align: inherit;
      }
      
      .document-editor table th {
        background-color: #f8f9fa;
        font-weight: bold;
        text-align: center;
      }
    `;
    
    document.head.appendChild(style);

    // Global function for image resizing
    (window as any).toggleImageSize = function(imgId: string) {
      const img = document.getElementById(imgId) as HTMLImageElement;
      if (!img) return;
      
      const currentWidth = parseInt(img.style.width) || img.offsetWidth;
      const naturalWidth = img.naturalWidth;
      const containerWidth = img.closest('.image-container')?.clientWidth || 600;
      
      // Cycle through different sizes: small (30%) -> medium (60%) -> large (100%) -> small
      if (currentWidth < naturalWidth * 0.4) {
        // Currently small, make medium
        img.style.width = Math.min(naturalWidth * 0.6, containerWidth * 0.8) + 'px';
      } else if (currentWidth < naturalWidth * 0.8) {
        // Currently medium, make large
        img.style.width = Math.min(naturalWidth, containerWidth) + 'px';
      } else {
        // Currently large, make small
        img.style.width = Math.min(naturalWidth * 0.3, 200) + 'px';
      }
    };

    return () => {
      document.head.removeChild(style);
      delete (window as any).toggleImageSize;
    };
  }, []);

  return null;
};

export default ImageResizer;