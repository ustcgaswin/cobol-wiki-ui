import React, { useMemo, useCallback } from "react";
import { FileText, ChevronRight, Folder, FolderOpen } from "lucide-react";
import clsx from "clsx";

const INDENT_PX = 12;

const SidebarTree = ({
  tree,
  parentPath = "",
  isSidebarCollapsed,
  expandedFolders,
  setExpandedFolders,
  selectedPage,
  setSelectedPage,
  depth = 0,
}) => {
  const entries = useMemo(() => Object.entries(tree), [tree]);

  // Optimize toggle handler to avoid object recreation
  const onToggle = useCallback(
    (fullPath, isExpanded) => {
      setExpandedFolders((prev) => {
        // Early return if no change needed
        if (prev[fullPath] === !isExpanded) {
          return prev;
        }
        return {
          ...prev,
          [fullPath]: !isExpanded,
        };
      });
    },
    [setExpandedFolders]
  );

  // Memoize page selection handler
  const onSelectPage = useCallback(
    (pagePath) => {
      if (selectedPage !== pagePath) {
        setSelectedPage(pagePath);
      }
    },
    [selectedPage, setSelectedPage]
  );

  return (
    <>
      {entries.map(([name, node]) => {
        const fullPath = parentPath ? `${parentPath}/${name}` : name;
        const isFolder = node && typeof node === "object";
        const isExpanded = !!expandedFolders[fullPath];
        const isSelected = fullPath === selectedPage;
        const leftPad = depth * INDENT_PX;

        if (isFolder) {
          return (
            <div key={fullPath} className="select-none">
              <button
                type="button"
                onClick={() => onToggle(fullPath, isExpanded)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" && !isExpanded) {
                    e.preventDefault();
                    onToggle(fullPath, false);
                  } else if (e.key === "ArrowLeft" && isExpanded) {
                    e.preventDefault();
                    onToggle(fullPath, true);
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(fullPath, isExpanded);
                  }
                }}
                className={clsx(
                  "group flex w-full items-center rounded-md pr-3 py-1.5 text-sm",
                  "transition-colors duration-150 focus:outline-none focus:ring-2",
                  "focus:ring-blue-200 focus:ring-inset hover:bg-muted",
                  isSelected ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
                style={{ paddingLeft: leftPad + 8 }}
                role="treeitem"
                aria-expanded={isExpanded}
                aria-selected={isSelected}
              >
                <ChevronRight
                  className={clsx(
                    "mr-1.5 h-4 w-4 text-slate-500 transition-transform duration-150",
                    isExpanded && "rotate-90"
                  )}
                />
                {isExpanded ? (
                  <FolderOpen className="mr-2 h-4 w-4 text-amber-500" />
                ) : (
                  <Folder className="mr-2 h-4 w-4 text-amber-500" />
                )}
                <span className="truncate">{name}</span>
                <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
              </button>

              <div
                className={clsx(
                  "ml-3 pl-3 border-l border-slate-200",
                  isExpanded
                    ? "max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0 pointer-events-none"
                )}
                style={{
                  transition:
                    "max-height 240ms ease, opacity 180ms ease, padding 180ms ease",
                }}
                role="group"
              >
                {isExpanded && (
                  <SidebarTree
                    tree={node}
                    parentPath={fullPath}
                    isSidebarCollapsed={isSidebarCollapsed}
                    expandedFolders={expandedFolders}
                    setExpandedFolders={setExpandedFolders}
                    selectedPage={selectedPage}
                    setSelectedPage={setSelectedPage}
                    depth={depth + 1}
                  />
                )}
              </div>
            </div>
          );
        }

        return (
          <button
            key={fullPath}
            type="button"
            onClick={() => onSelectPage(fullPath)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectPage(fullPath);
              }
            }}
            className={clsx(
              "group flex w-full items-center rounded-md pr-3 py-1.5 text-sm",
              "transition-colors duration-150 focus:outline-none focus:ring-2",
              "focus:ring-blue-200 focus:ring-inset hover:bg-muted",
              isSelected ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
            style={{ paddingLeft: leftPad + 32 }}
            role="treeitem"
            aria-selected={isSelected}
          >
            <FileText className="mr-2 h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        );
      })}
    </>
  );
};

export default React.memo(SidebarTree);