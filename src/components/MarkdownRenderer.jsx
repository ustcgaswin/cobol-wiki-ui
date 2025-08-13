import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import Mermaid from "./Mermaid";

// Detect dark mode (Tailwind's 'dark' class or OS preference)
function useIsDarkMode() {
  const isDocument = typeof document !== "undefined";
  const initial =
    isDocument && document.documentElement.classList
      ? document.documentElement.classList.contains("dark")
      : false;

  const [isDark, setIsDark] = React.useState(initial);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const hasClass =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");
      setIsDark(hasClass || mql.matches);
    };
    update();
    mql.addEventListener("change", update);
    const observer = new MutationObserver(update);
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    return () => {
      mql.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return isDark;
}

// Small, inline copy button used inside toolbars (no absolute positioning)
function InlineCopyButton({ text }) {
  const [state, setState] = React.useState("idle"); // idle | copying | copied

  const copy = async () => {
    try {
      setState("copying");
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={state === "copying"}
      className="rounded border bg-background/70 px-2 py-0.5 text-[11px] text-foreground shadow-sm hover:bg-background hover:cursor-pointer disabled:opacity-60"
      title={state === "copied" ? "Copied!" : "Copy to clipboard"}
    >
      {state === "copied" ? "Copied" : "Copy"}
    </button>
  );
}

// Large code block with a fixed header toolbar
function LargeCodeBlock({ lang, text }) {
  const numLines = text ? text.split(/\r?\n/).length : 0;
  const isDark = useIsDarkMode();
  const prismStyle = isDark ? oneDark : oneLight;

  return (
    <div className="my-4 overflow-hidden rounded-md border bg-muted/10 text-foreground shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-2 py-1">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {lang}
        </span>
        <div className="flex items-center gap-2">
          <InlineCopyButton  text={text} />
        </div>
      </div>

      <SyntaxHighlighter
        style={prismStyle}
        language={lang}
        PreTag="div"
        className="!m-0"
        showLineNumbers={numLines >= 12}
        wrapLines
        wrapLongLines
        lineNumberStyle={{
          color: "#94a3b8",
          backgroundColor: "transparent",
          paddingRight: "0.75em",
          textAlign: "right",
          userSelect: "none",
          minWidth: "2.5em",
          borderRight: "1px solid rgba(0,0,0,0.06)",
        }}
        customStyle={{
          background: "transparent",
          padding: "12px",
          fontSize: "14px",
          lineHeight: "1.55",
          fontFamily: 'Consolas, "Courier New", monospace',
          maxHeight: "55vh", // scroll if long, no expand/collapse
          overflow: "auto",
        }}
        codeTagProps={{
          style: {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: "14px",
          },
        }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}
// Slugify for heading IDs
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, "-"
    )
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const MarkdownRenderer = ({ content, onExpandMermaid, onLinkClick }) => {
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
        const numLines = text ? text.split(/\r?\n/).length : 0;
        const isSingleLineFence = numLines <= 1 && text.length <= 120;

        // Fenced code with language
        if (!inline && match) {
          const lang = match[1];

          if (lang === "mermaid") {
            return (
              <div className="p-3">
                <Mermaid chart={text} onExpand={onExpandMermaid} />
              </div>
            );
          }

          // Single-line fenced snippet -> compact pill
          if (isSingleLineFence) {
            return (
              <code className="not-prose inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[0.9em] text-foreground shadow-sm hover:bg-muted transition-colors">
                {text}
              </code>
            );
          }

          // Large/multiline block -> header toolbar (no absolute overlay)
          return <LargeCodeBlock lang={lang} text={text} />;
        }

        // Inline code -> compact pill
        if (inline) {
          return (
            <code
              className="not-prose inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground shadow-sm"
              {...props}
            >
              {children}
            </code>
          );
        }

        // Fenced code without language
        const plain = String(children).replace(/\n$/, "");
        const plainLines = plain ? plain.split(/\r?\n/).length : 0;
        const plainIsSingle = plainLines <= 1 && plain.length <= 120;

        if (plainIsSingle) {
          return (
            <code className="not-prose inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[0.9em] text-foreground shadow-sm hover:bg-muted transition-colors">
              {plain}
            </code>
          );
        }

        // Large/multiline fenced block without language -> header toolbar with copy
        return (
          <div className="my-4 overflow-hidden rounded-md border bg-muted/10 text-foreground shadow-sm">
            <div className="flex items-center justify-end gap-2 border-b bg-muted/30 px-2 py-1">
              <InlineCopyButton text={plain} />
            </div>
            <pre className="max-h-[55vh] overflow-auto px-3 py-3 text-sm font-mono leading-relaxed">
              <code className="text-foreground">{children}</code>
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
        return <thead className="bg-muted">{children}</thead>;
      },
      th({ children }) {
        return (
          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
          </th>
        );
      },
      td({ children }) {
        return <td className="px-4 py-3 text-sm text-foreground/90">{children}</td>;
      },
      tr({ children }) {
        return (
          <tr className="border-b last:border-0 transition-colors hover:bg-muted/40">
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
        return <p className="mb-5 leading-7 text-foreground/90">{children}</p>;
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
        return <li className="[&>p]:m-0">{children}</li>;
      },

      strong({ children }) {
        return <strong className="font-semibold">{children}</strong>;
      },
      em({ children }) {
        return <em className="italic text-foreground/90">{children}</em>;
      },

      cite({ children, ...props }) {
        return (
          <cite
            {...props}
            className="not-prose inline-block whitespace-nowrap align-middle rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.75rem] italic text-muted-foreground"
          >
            {children}
          </cite>
        );
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
            className="font-medium text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
  }, [onExpandMermaid, onLinkClick]);

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