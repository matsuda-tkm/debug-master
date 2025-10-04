import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  content: string | undefined | null;
  className?: string;
};

export default function Markdown({ content, className }: MarkdownProps) {
  const text = content ?? '';

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // コードブロックのカスタムレンダリング
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match;
            
            if (!isInline && language) {
              return (
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={language}
                  PreTag="div"
                  className="my-3 rounded overflow-auto text-sm"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            // インラインコード
            return (
              <code className="px-1 py-0.5 bg-slate-100 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          
          // 見出しのスタイリング
          h1: ({ children }) => (
            <h1 className="mt-3 mb-1 font-bold text-lg">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-1 font-bold text-lg">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1 font-bold text-base">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 font-bold text-sm">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="mt-3 mb-1 font-bold text-sm">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="mt-3 mb-1 font-bold text-sm">{children}</h6>
          ),
          
          // 段落のスタイリング
          p: ({ children }) => (
            <p className="my-2">{children}</p>
          ),
          
          // リストのスタイリング
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="my-1">{children}</li>
          ),
          
          // テーブルのスタイリング
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-200">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-2">{children}</td>
          ),
          
          // ブロッククォートのスタイリング
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">
              {children}
            </blockquote>
          ),
          
          // リンクのスタイリング
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

