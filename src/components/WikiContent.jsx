import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";

const WikiContent = ({ content, onExpandMermaid, onLinkClick }) => {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded bg-black/80 px-3 py-1.5 text-white"
      >
        Skip to content
      </a>

      <main id="main-content" className="px-6 py-6 md:px-8 md:py-8 bg-background">
        <div className="mx-auto w-full max-w-4xl">
          <MarkdownRenderer
            content={content}
            onExpandMermaid={onExpandMermaid}
            onLinkClick={onLinkClick}
          />
        </div>
      </main>
    </>
  );
};

export default React.memo(WikiContent);