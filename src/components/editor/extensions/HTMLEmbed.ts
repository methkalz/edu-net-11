import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import HTMLEmbedComponent from './HTMLEmbedComponent';

export interface HTMLEmbedOptions {
  inline: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    htmlEmbed: {
      setHTMLEmbed: (options: { htmlContent: string; title?: string; height?: string }) => ReturnType;
    };
  }
}

export const HTMLEmbed = Node.create<HTMLEmbedOptions>({
  name: 'htmlEmbed',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      htmlContent: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-html-content'),
        renderHTML: (attributes) => {
          return {
            'data-html-content': attributes.htmlContent,
          };
        },
      },
      title: {
        default: 'محتوى HTML تفاعلي',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => {
          return {
            'data-title': attributes.title,
          };
        },
      },
      height: {
        default: '400px',
        parseHTML: (element) => element.getAttribute('data-height'),
        renderHTML: (attributes) => {
          return {
            'data-height': attributes.height,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="html-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'html-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HTMLEmbedComponent);
  },

  addCommands() {
    return {
      setHTMLEmbed:
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

export default HTMLEmbed;
