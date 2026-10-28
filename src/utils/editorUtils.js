/**
 * Safe, robust Markdown editor formatting utilities.
 * Handles:
 * - Wrapping and unwrapping bold, italic, code, links, quotes, headings, and lists
 * - Preserving selection and editor focus
 * - Preventing selection loss on mouse down
 */

export function applyFormatting(textarea, content, setContent, formatType) {
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.substring(start, end);

  let replacement;
  let selOffsetStart = 0;
  let selOffsetEnd = 0;

  switch (formatType) {
    case 'bold': {
      // Check if already bolded inside selection
      if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
        replacement = selectedText.slice(2, -2);
        selOffsetStart = start;
        selOffsetEnd = start + replacement.length;
      }
      // Check if surrounded by ** outside selection
      else if (start >= 2 && end <= content.length - 2 && content.substring(start - 2, start) === '**' && content.substring(end, end + 2) === '**') {
        const next = content.substring(0, start - 2) + selectedText + content.substring(end + 2);
        setContent(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start - 2, start - 2 + selectedText.length);
        });
        return;
      } else {
        const textToWrap = selectedText || 'bold text';
        replacement = `**${textToWrap}**`;
        selOffsetStart = start + 2;
        selOffsetEnd = start + 2 + textToWrap.length;
      }
      break;
    }

    case 'italic': {
      if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length >= 2 && !selectedText.startsWith('**')) {
        replacement = selectedText.slice(1, -1);
        selOffsetStart = start;
        selOffsetEnd = start + replacement.length;
      } else if (start >= 1 && end <= content.length - 1 && content.charAt(start - 1) === '*' && content.charAt(end) === '*' && content.charAt(start - 2) !== '*') {
        const next = content.substring(0, start - 1) + selectedText + content.substring(end + 1);
        setContent(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start - 1, start - 1 + selectedText.length);
        });
        return;
      } else {
        const textToWrap = selectedText || 'italic text';
        replacement = `*${textToWrap}*`;
        selOffsetStart = start + 1;
        selOffsetEnd = start + 1 + textToWrap.length;
      }
      break;
    }

    case 'code': {
      if (selectedText.includes('\n')) {
        // Multi-line code block
        const textToWrap = selectedText || 'code here';
        replacement = `\n\`\`\`\n${textToWrap}\n\`\`\`\n`;
        selOffsetStart = start + 5;
        selOffsetEnd = start + 5 + textToWrap.length;
      } else {
        // Inline code
        const textToWrap = selectedText || 'code';
        replacement = `\`${textToWrap}\``;
        selOffsetStart = start + 1;
        selOffsetEnd = start + 1 + textToWrap.length;
      }
      break;
    }

    case 'link': {
      const textToWrap = selectedText || 'link text';
      replacement = `[${textToWrap}](https://)`;
      selOffsetStart = start + textToWrap.length + 3; // position cursor inside URL
      selOffsetEnd = selOffsetStart + 8;
      break;
    }

    case 'h2': {
      const prefix = start === 0 || content.charAt(start - 1) === '\n' ? '' : '\n';
      const textToWrap = selectedText || 'Heading 2';
      replacement = `${prefix}## ${textToWrap}\n`;
      selOffsetStart = start + prefix.length + 3;
      selOffsetEnd = selOffsetStart + textToWrap.length;
      break;
    }

    case 'h3': {
      const prefix = start === 0 || content.charAt(start - 1) === '\n' ? '' : '\n';
      const textToWrap = selectedText || 'Heading 3';
      replacement = `${prefix}### ${textToWrap}\n`;
      selOffsetStart = start + prefix.length + 4;
      selOffsetEnd = selOffsetStart + textToWrap.length;
      break;
    }

    case 'quote': {
      const prefix = start === 0 || content.charAt(start - 1) === '\n' ? '' : '\n';
      const textToWrap = selectedText || 'Quote text';
      replacement = `${prefix}> ${textToWrap}\n`;
      selOffsetStart = start + prefix.length + 2;
      selOffsetEnd = selOffsetStart + textToWrap.length;
      break;
    }

    case 'bullet-list': {
      const prefix = start === 0 || content.charAt(start - 1) === '\n' ? '' : '\n';
      if (selectedText) {
        const lines = selectedText.split('\n').map((l) => `- ${l}`).join('\n');
        replacement = `${prefix}${lines}\n`;
      } else {
        replacement = `${prefix}- List item\n`;
      }
      selOffsetStart = start + prefix.length + 2;
      selOffsetEnd = selOffsetStart + (selectedText ? replacement.length - prefix.length - 1 : 9);
      break;
    }

    default:
      return;
  }

  const nextContent = content.substring(0, start) + replacement + content.substring(end);
  setContent(nextContent);

  // Restore focus and precise selection range immediately
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(selOffsetStart, selOffsetEnd);
  });
}

/**
 * Strips raw Markdown syntax characters from text for clean excerpt/title previews.
 * @param {string} text
 * @returns {string} Plain readable text
 */
export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s+/g, '') // remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // remove bold
    .replace(/\*(.+?)\*/g, '$1') // remove italic
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1') // remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove links
    .replace(/>\s+/g, '') // remove blockquotes
    .replace(/^[-*+]\s+/gm, '') // remove list bullets
    .replace(/\n+/g, ' ')
    .trim();
}
