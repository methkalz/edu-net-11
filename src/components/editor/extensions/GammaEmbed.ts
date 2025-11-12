import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import GammaEmbedComponent from './GammaEmbedComponent';

export interface GammaEmbedOptions {
  inline: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gammaEmbed: {
      setGammaEmbed: (options: { src: string; title?: string; width?: string; height?: string }) => ReturnType;
    };
  }
}

export const GammaEmbed = Node.create<GammaEmbedOptions>({
  name: 'gammaEmbed',

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) {
            return {};
          }
          return { src: attributes.src };
        },
      },
      title: {
        default: 'عرض تقديمي من Gamma',
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          return { title: attributes.title };
        },
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          return { width: attributes.width };
        },
      },
      height: {
        default: '450px',
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          return { height: attributes.height };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="gamma.app/embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 
        class: 'gamma-embed-wrapper',
        style: 'margin: 1rem 0; max-width: 100%;'
      },
      [
        'iframe',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          frameborder: '0',
          sandbox: 'allow-scripts allow-same-origin allow-fullscreen',
          allow: 'fullscreen',
          loading: 'lazy',
          style: `width: ${HTMLAttributes.width}; max-width: 100%; height: ${HTMLAttributes.height}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);`
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GammaEmbedComponent);
  },

  addCommands() {
    return {
      setGammaEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
