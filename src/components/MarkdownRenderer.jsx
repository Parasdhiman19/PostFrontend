import React from 'react';

/**
 * Sanitize a URL to prevent XSS (blocks javascript:, data:, etc.)
 */
function sanitizeUrl(url) {
  if (!url) return '#';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }
  return '#';
}

/**
 * Parse inline markdown tokens: **bold**, *italic*, `code`, ~~strikethrough~~, [link](url).
 * Safe against raw HTML injection.
 */
function parseInlineMarkdown(text) {
  if (!text) return null;

  // Regex matches:
  // 1. `code`
  // 2. **bold**
  // 3. *italic* or _italic_
  // 4. ~~strikethrough~~
  // 5. [link text](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;

  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline Code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded font-mono text-[13px] bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 border border-neutral-200/80 dark:border-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-neutral-950 dark:text-slate-100">
          {parseInlineMarkdown(part.slice(2, -2))}
        </strong>
      );
    }

    // Strikethrough
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} className="line-through text-neutral-400 dark:text-slate-500">
          {parseInlineMarkdown(part.slice(2, -2))}
        </del>
      );
    }

    // Italic (* or _)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-neutral-900 dark:text-slate-200">
          {parseInlineMarkdown(part.slice(1, -1))}
        </em>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkHref = sanitizeUrl(linkMatch[2]);
      return (
        <a
          key={index}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-900 dark:text-slate-200 font-medium underline underline-offset-3 decoration-neutral-400 hover:decoration-neutral-900 dark:decoration-slate-500 dark:hover:decoration-slate-200 transition-colors"
        >
          {linkText}
        </a>
      );
    }

    // Raw text fallback
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Full MarkdownRenderer component supporting:
 * - H1, H2, H3 headings
 * - Blockquotes
 * - Fenced code blocks with language headers
 * - Unordered bullet lists and numbered lists
 * - Paragraphs with bold, italic, code, and links
 * - 100% XSS-safe (escapes raw HTML)
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];

  let inCodeBlock = false;
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block delimiter
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div
            key={`codeblock-${i}`}
            className="my-4 rounded-lg bg-neutral-900 dark:bg-[#12161c] text-neutral-100 p-4 font-mono text-xs overflow-x-auto border border-neutral-800 dark:border-slate-800 shadow-2xs leading-relaxed"
          >
            <pre>
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Heading 1 (# )
    if (line.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white mt-8 mb-4 pb-2.5 border-b border-neutral-200/80 dark:border-slate-800"
        >
          {parseInlineMarkdown(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Heading 2 (## )
    if (line.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-slate-100 mt-7 mb-3 flex items-center gap-2.5 before:content-[''] before:inline-block before:w-1.5 before:h-4.5 before:rounded-full before:bg-neutral-800 dark:before:bg-slate-300"
        >
          {parseInlineMarkdown(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Heading 3 (### )
    if (line.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className="text-base sm:text-lg font-semibold tracking-normal text-neutral-800 dark:text-slate-200 mt-6 mb-2"
        >
          {parseInlineMarkdown(line.slice(4))}
        </h4>
      );
      continue;
    }

    // Heading 4 (#### )
    if (line.startsWith('#### ')) {
      elements.push(
        <h5
          key={`h4-${i}`}
          className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-slate-400 mt-5 mb-2"
        >
          {parseInlineMarkdown(line.slice(5))}
        </h5>
      );
      continue;
    }

    // Blockquote (> )
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-3 border-neutral-400 dark:border-slate-500 bg-neutral-50/60 dark:bg-slate-900/30 pl-4 py-2 italic text-neutral-600 dark:text-slate-300 my-4 rounded-r"
        >
          {parseInlineMarkdown(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List item (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li
          key={`li-${i}`}
          className="ml-5 list-disc text-neutral-700 dark:text-slate-300 my-1 leading-relaxed"
        >
          {parseInlineMarkdown(line.slice(2))}
        </li>
      );
      continue;
    }

    // Ordered List item (e.g. "1. ")
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      elements.push(
        <li
          key={`oli-${i}`}
          className="ml-5 list-decimal text-neutral-700 dark:text-slate-300 my-1 leading-relaxed"
        >
          {parseInlineMarkdown(orderedMatch[2])}
        </li>
      );
      continue;
    }

    // Empty blank line
    if (!line.trim()) {
      elements.push(<div key={`space-${i}`} className="h-3" />);
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed sm:leading-loose text-neutral-700 dark:text-slate-300 font-normal">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  // Handle unclosed code block gracefully
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div
        key="codeblock-unclosed"
        className="my-4 rounded-lg bg-neutral-900 dark:bg-[#12161c] text-neutral-100 p-4 font-mono text-xs overflow-x-auto border border-neutral-800 dark:border-slate-800 shadow-2xs leading-relaxed"
      >
        <pre>
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      </div>
    );
  }

  return <div className={`space-y-2 text-sm sm:text-base ${className}`}>{elements}</div>;
}
