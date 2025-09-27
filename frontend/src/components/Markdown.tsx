import React from 'react';

type MarkdownProps = {
  content: string | undefined | null;
  className?: string;
};

// Very small, safe Markdown renderer (subset):
// - Headings (# .. ######)
// - Bullet lists (- , *)
// - Code fence ``` ... ```
// - Inline code `code`
// - Bold **strong** and italic *em*
// - Paragraphs and line breaks
// Escapes HTML first, then injects our limited tags.
export default function Markdown({ content, className }: MarkdownProps) {
  const text = content ?? '';

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // Convert inline markdown within a single line of already-escaped HTML
  const renderInline = (line: string) => {
    // Inline code
    let html = line.replace(/`([^`]+)`/g, (_m, p1) => `<code class="px-1 py-0.5 bg-slate-100 rounded">${p1}</code>`);
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic (single *) - avoid interfering with bold
    html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`);
    return html;
  };

  const lines = text.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    out.push(
      <ul key={`ul-${out.length}`} className="list-disc pl-6 my-2">
        {listBuffer.map((item, idx) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: renderInline(escapeHtml(item)) }} />
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const flushPara = () => {
    if (!paraBuffer.length) return;
    const joined = paraBuffer.join(' ');
    out.push(
      <p key={`p-${out.length}`} className="my-2" dangerouslySetInnerHTML={{ __html: renderInline(escapeHtml(joined)) }} />
    );
    paraBuffer = [];
  };

  const flushCode = () => {
    if (!codeBuffer.length) return;
    out.push(
      <pre key={`pre-${out.length}`} className="my-3 p-3 bg-slate-900 text-slate-100 rounded overflow-auto text-sm"><code>{codeBuffer.join('\n')}</code></pre>
    );
    codeBuffer = [];
  };

  while (i < lines.length) {
    const raw = lines[i];
    if (raw.trim().startsWith('```')) {
      if (inCode) {
        // closing fence
        inCode = false;
        flushCode();
      } else {
        // opening fence
        flushPara();
        flushList();
        inCode = true;
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuffer.push(raw);
      i++;
      continue;
    }

    const mHeading = raw.match(/^(#{1,6})\s+(.*)$/);
    if (mHeading) {
      flushPara();
      flushList();
      const level = Math.min(6, mHeading[1].length);
      const inner = renderInline(escapeHtml(mHeading[2]));
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      out.push(
        <Tag key={`h-${out.length}`} className={`mt-3 mb-1 font-bold ${level <= 2 ? 'text-lg' : level === 3 ? 'text-base' : 'text-sm'}`}
            dangerouslySetInnerHTML={{ __html: inner }} />
      );
      i++;
      continue;
    }

    const mList = raw.match(/^\s*[-*]\s+(.*)$/);
    if (mList) {
      flushPara();
      listBuffer.push(mList[1]);
      i++;
      // If next line isn't a list, we'll flush later
      // handled by next iterations
      const next = lines[i] ?? '';
      if (!/^\s*[-*]\s+/.test(next)) {
        flushList();
      }
      continue;
    }

    if (raw.trim() === '') {
      flushPara();
      flushList();
      i++;
      continue;
    }

    // Paragraph text
    paraBuffer.push(raw.trim());
    i++;
  }

  // Flush any remaining buffers
  flushPara();
  flushList();
  if (inCode) flushCode();

  return <div className={className}>{out}</div>;
}

