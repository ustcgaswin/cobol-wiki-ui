import React from "react";
import clsx from "clsx";

const ScrollableDiv = ({ children, className = "", style, ...props }) => {
  return (
    <div
      className={clsx(
        "overflow-auto",
        // iOS momentum, smooth scroll, touch-friendly
        "overscroll-contain scroll-smooth [@media(prefers-reduced-motion:reduce)]:scroll-auto",
        "[-webkit-overflow-scrolling:touch]",
        // Hide scrollbar without layout shift
        "scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent",
        className
      )}
      style={style}
      {...props}
    >
      <style>{`
        /* Hide scrollbars (WebKit) but keep scrollability */
        .overflow-auto::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
      `}</style>
      {children}
    </div>
  );
};

export default ScrollableDiv;