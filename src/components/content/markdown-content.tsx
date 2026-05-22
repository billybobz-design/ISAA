import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

import { cn } from "@/lib/utils"

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "max-w-none text-base leading-7 text-slate-700",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="mt-8 mb-4 font-serif text-4xl font-bold leading-tight text-primary first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-8 mb-4 font-serif text-3xl font-bold leading-tight text-primary first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-6 mb-3 font-serif text-2xl font-bold leading-tight text-slate-900">{children}</h3>,
          h4: ({ children }) => <h4 className="mt-6 mb-3 text-xl font-semibold text-slate-900">{children}</h4>,
          p: ({ children }) => <p className="my-4 leading-7 text-slate-700 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 marker:text-primary">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-2xl border-l-4 border-primary/30 bg-slate-50 px-5 py-4 italic text-slate-700">
              {children}
            </blockquote>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary/80"
              {...props}
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-8 border-slate-200" />,
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }) => (
            <code
              className={cn("rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900", className)}
              {...props}
            >
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-slate-200 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => <th className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900">{children}</th>,
          td: ({ children }) => <td className="border border-slate-200 px-4 py-3 align-top">{children}</td>,
          img: ({ src, ...props }) => {
            if (!src) return null
            return <img src={src} alt={props.alt ?? ""} className="my-6 rounded-2xl border border-slate-200" {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
