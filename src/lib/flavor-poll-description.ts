import sanitizeHtml from 'sanitize-html';

export function sanitizeFlavorPollDescription(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'hr',
      'br',
      'a',
      'img',
      'span',
    ],
    allowedAttributes: {
      '*': ['style'],
      a: ['href', 'title'],
      img: ['src', 'alt', 'title'],
      ol: ['start'],
    },
    allowedStyles: {
      '*': { 'text-align': [/^(left|center|right|justify)$/] },
      span: { 'font-size': [/^(12|14|16|18|20|24|28|32)px$/] },
    },
    allowedSchemes: ['https'],
    allowProtocolRelative: false,
  })
    .replace(/^(?:\s*<p>(?:\s|<br\s*\/?>)*<\/p>\s*)+$/i, '')
    .trim();
}
