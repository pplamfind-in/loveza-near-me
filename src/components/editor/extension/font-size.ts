import { Mark } from '@tiptap/core';

export const editorFontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

export const EditorFontSize = Mark.create({
  name: 'editorFontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: ({ size }) =>
          editorFontSizes.includes(size) ? { style: `font-size: ${size}` } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: (element) => editorFontSizes.includes(element.style.fontSize) && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});
