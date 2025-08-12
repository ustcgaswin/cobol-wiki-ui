import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Mermaid from "./Mermaid";
import CopyButton from "./CopyButton";

// Slugify for heading IDs
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const MarkdownRenderer = ({ content, onExpandMermaid,onLinkClick }) => {
  const components = useMemo(() => {
    // Helper: recursively extract text for slug
    const extractText = (children) => {
      if (typeof children === "string") return children;
      if (Array.isArray(children)) return children.map(extractText).join("");
      if (children && typeof children === "object" && children.props)
        return extractText(children.props.children);
      return "";
    };

    const Heading =
      (Tag, baseClasses) =>
      ({ children, ...props }) => {
        const text = extractText(children);
        const id = slugify(text);
        return (
          <Tag id={id} className={baseClasses} {...props}>
            <a
              href={`#${id}`}
              className="not-prose group relative inline-flex items-center"
            >
              <span>{children}</span>
              <span className="ml-2 hidden text-muted-foreground no-underline group-hover:inline">
                #
              </span>
            </a>
          </Tag>
        );
      };

    return {
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const text = String(children).replace(/\n$/, "");

        if (!inline && match) {
          const lang = match[1];

          if (lang === "mermaid") {
            return (
                <div className="p-3">
                  <Mermaid chart={text} onExpand={onExpandMermaid} />
                </div>
            );
          }

          return (
            <div className="group relative my-6 overflow-hidden rounded-lg border border-gray-700 bg-[#1e1e1e] text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-700 bg-[#2d2d30] px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]"></div>
                    <div className="h-3 w-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="h-3 w-3 rounded-full bg-[#28ca42]"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {lang}
                  </span>
                </div>
                <CopyButton text={text} />
              </div>
              <SyntaxHighlighter
                style={oneDark}
                language={lang}
                PreTag="div"
                className="!m-0"
                showLineNumbers={true}
                wrapLines
                wrapLongLines
                lineNumberStyle={{
                  color: '#6e7681',
                  backgroundColor: '#0d1117',
                  paddingRight: '1em',
                  textAlign: 'right',
                  userSelect: 'none',
                  minWidth: '3em',
                  borderRight: '1px solid #30363d'
                }}
                customStyle={{
                  background: '#0d1117',
                  padding: '12px 0',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontFamily: 'Consolas, "Courier New", monospace',
                }}
                codeTagProps={{
                  style: { 
                    fontFamily: 'Consolas, "Courier New", monospace',
                    fontSize: '14px'
                  },
                }}
              >
                {text}
              </SyntaxHighlighter>
            </div>
          );
        }

        if (inline) {
          return (
            <code
              className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-200"
              {...props}
            >
              {children}
            </code>
          );
        }

        // Fenced code without language
        return (
          <div className="group relative my-5 overflow-hidden rounded-lg border border-gray-700 bg-[#1e1e1e] text-white shadow-sm">
            <div className="absolute right-2 top-2">
              <CopyButton text={text} />
            </div>
            <pre className="overflow-x-auto p-4 bg-[#0d1117]">
              <code className="text-sm font-mono text-gray-200">{children}</code>
            </pre>
          </div>
        );
      },

      blockquote({ children }) {
        return (
          <blockquote className="my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50/70 px-5 py-4 text-blue-900 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-100">
            {children}
          </blockquote>
        );
      },

      table({ children }) {
        return (
          <div className="my-8 overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">{children}</table>
          </div>
        );
      },
      thead({ children }) {
        return (
          <thead className="bg-muted">
            {children}
          </thead>
        );
      },
      th({ children }) {
        return (
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
          </th>
        );
      },
      td({ children }) {
        return (
          <td className="px-4 py-3 text-sm text-foreground/90">
            {children}
          </td>
        );
      },
      tr({ children }) {
        return (
          <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
            {children}
          </tr>
        );
      },

      // Headings with anchors and consistent rhythm
      h1: Heading(
        "h1",
        "mb-6 mt-2 border-b pb-3 text-4xl font-bold tracking-tight text-foreground"
      ),
      h2: Heading(
        "h2",
        "mt-12 mb-4 border-b pb-2 text-3xl font-semibold tracking-tight text-foreground"
      ),
      h3: Heading(
        "h3",
        "mt-8 mb-3 text-2xl font-semibold tracking-tight text-foreground"
      ),
      h4: Heading("h4", "mt-6 mb-2 text-xl font-semibold text-foreground"),

      p({ children }) {
        return (
          <p className="mb-5 leading-7 text-foreground/90">{children}</p>
        );
      },

      ul({ children }) {
        return (
          <ul className="mb-5 ml-4 list-disc space-y-2 text-foreground/90">
            {children}
          </ul>
        );
      },
      ol({ children }) {
        return (
          <ol className="mb-5 ml-5 list-decimal space-y-2 text-foreground/90">
            {children}
          </ol>
        );
      },
      li({ children }) {
        return (
          <li className="[&>p]:m-0">{children}</li>
        );
      },

      strong({ children }) {
        return <strong className="font-semibold">{children}</strong>;
      },
      em({ children }) {
        return <em className="italic text-foreground/90">{children}</em>;
      },

      a({ href, children }) {
        const external = /^https?:\/\//i.test(href || "");
        const isHash = (href || "").startsWith("#");

        const handleClick = (e) => {
          if (!href) return;
          if (external || isHash) return; // let browser handle external links and page anchors
          if (onLinkClick) {
            const handled = onLinkClick(href);
            if (handled) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        };

        return (
          <a
            href={href}
            onClick={handleClick}
            className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            target={external ? "_blank" : "_self"}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        );
      },

      hr() {
        return (
          <hr className="my-10 h-px border-0 bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
        );
      },

      del({ children }) {
        return <del className="text-foreground/70 line-through">{children}</del>;
      },

      img({ src, alt }) {
        return (
          <figure className="my-6 overflow-hidden rounded-lg border bg-card text-center">
            <img
              src={src}
              alt={alt}
              className="mx-auto max-h-[60vh] w-auto"
              loading="lazy"
              decoding="async"
            />
            {alt ? (
              <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">
                {alt}
              </figcaption>
            ) : null}
          </figure>
        );
      },
    };
  }, [onExpandMermaid,onLinkClick]);

  return (
    <div className="prose prose-slate prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-24">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);