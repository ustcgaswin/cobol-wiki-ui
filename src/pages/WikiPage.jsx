import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import {
  downloadAllMarkdown,
  initializeMermaid,
  buildSidebarTree,
  extractHeadings,
  coerceMarkdown,
  flattenWikiData,
  normalizePath, // added
} from "../utils";
import WikiHeader from "../components/WikiHeader";
import WikiContent from "../components/WikiContent";
import SidebarTree from "../components/SidebarTree";
import TableOfContents from "../components/TableOfContents";
import MermaidModal from "../components/MermaidModal";
import { FolderTree } from "lucide-react";
import clsx from "clsx";
import ScrollableDiv from "../components/ScrollableDiv";

initializeMermaid();

const WikiPage = () => {
  const { projectId } = useParams();

  const [wikiFiles, setWikiFiles] = useState({});
  const [selectedPage, setSelectedPage] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [mermaidModalOpen, setMermaidModalOpen] = useState(false);
  const [mermaidChart, setMermaidChart] = useState("");
  const [mermaidTransform, setMermaidTransform] = useState({ scale: 1, x: 0, y: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Ref for the scrollable main content container
  const contentScrollRef = useRef(null);

  // Fetch wiki by project id
  useEffect(() => {
    let cancelled = false;

    const normalizeKey = (k) =>
      String(k).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");

    const parseRepoMeta = (payload) => {
      const url =
        payload?.github_url ||
        payload?.repo?.url ||
        payload?.data?.github_url ||
        payload?.data?.repo?.url ||
        "";
      let owner = "";
      let name = "";
      if (url) {
        try {
          const parts = new URL(url).pathname.split("/").filter(Boolean);
          owner = parts[0] || "";
          name = parts[1] || "";
        } catch {
          // ignore parse errors
        }
      }
      return { owner, name, url };
    };

    const pickFilesObject = (payload) => {
      // Accept { pages }, { data: { pages } }, { files }, { data }, or plain object/array
      return (
        payload?.pages ||
        payload?.data?.pages ||
        payload?.files ||
        payload?.data ||
        payload ||
        {}
      );
    };

    const load = async () => {
      if (!projectId) {
        setLoading(false);
        setError("No project ID provided.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/projects/${projectId}/wiki/content`);
        const payload = res?.data ?? {};

        const filesTree = pickFilesObject(payload);

        // Flatten the nested tree into "path -> markdown" map
        const flat = flattenWikiData(filesTree);

        if (!flat || !Object.keys(flat).length) {
          throw new Error("No wiki content returned for this project.");
        }

        if (cancelled) return;

        const { owner, name, url } = parseRepoMeta(payload);
        setRepoOwner(owner);
        setRepoName(name);
        setGithubUrl(url);

        // Normalize keys again (safety)
        const normalized = Object.fromEntries(
          Object.entries(flat).map(([k, v]) => [normalizeKey(k), coerceMarkdown(v)])
        );

        setWikiFiles(normalized);

        // Initial selected page
        setSelectedPage((prev) => {
          if (prev && normalized[prev]) return prev;
          const keys = Object.keys(normalized);
          // Prefer overview if present
          const overviewKey = keys.find((k) => k.toLowerCase().endsWith("overview"));
          return overviewKey || (keys.length ? keys[0] : null);
        });
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load wiki content.");
          setWikiFiles({});
          setSelectedPage(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Build sidebar tree from fetched files
  const tree = useMemo(() => buildSidebarTree(wikiFiles), [wikiFiles]);

  // Filtered tree by search
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tree;

    const lowerSearchTerm = searchTerm.toLowerCase();
    const recurse = (node) => {
      const result = {};
      for (const [k, v] of Object.entries(node)) {
        if (k.toLowerCase().includes(lowerSearchTerm)) {
          result[k] = v;
        } else if (v && typeof v === "object") {
          const sub = recurse(v);
          if (Object.keys(sub).length) {
            result[k] = sub;
          }
        }
      }
      return result;
    };
    return recurse(tree);
  }, [searchTerm, tree]);

  // Extract headings for TOC
  const headings = useMemo(
    () => extractHeadings(selectedPage ? wikiFiles[selectedPage] || "" : ""),
    [selectedPage, wikiFiles]
  );

  const handleTocClick = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // Next page navigation
  const pageNavigation = useMemo(() => {
    const pageKeys = Object.keys(wikiFiles);
    const currentIndex = pageKeys.indexOf(selectedPage ?? "");
    if (currentIndex === -1) {
      return { hasNextPage: false, nextPage: null };
    }
    return {
      hasNextPage: currentIndex < pageKeys.length - 1,
      nextPage: pageKeys[currentIndex + 1] || null,
    };
  }, [selectedPage, wikiFiles]);

  const handleNextPage = useCallback(() => {
    if (pageNavigation.hasNextPage && pageNavigation.nextPage) {
      setSelectedPage(pageNavigation.nextPage);
    }
  }, [pageNavigation]);

  const handleSetExpandedFolders = useCallback((updater) => {
    setExpandedFolders(updater);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleExpandMermaid = useCallback((chart) => {
    setMermaidChart(chart);
    setMermaidModalOpen(true);
    setMermaidTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsCollapsed((c) => !c);
  }, []);

  const handleDownloadAll = useCallback(() => {
    downloadAllMarkdown(wikiFiles, "project_wiki.zip");
  }, [wikiFiles]);

  // Resolve and handle internal markdown links (prevent full navigation)
  const handleMarkdownLinkClick = useCallback(
    (href) => {
      if (!href) return false;
      if (href.startsWith("#")) return false;
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href)) return false;
      if (href.startsWith("/")) return false;

      const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

      // Treat any trailing extension as non-semantic (md, jcl, cpy, cbl, rexx, etc.)
      const stripExt = (p) =>
        normalizePath(p).replace(/\.[a-z0-9]{1,6}$/i, "");

      // Normalize for comparison: lower, collapse slashes, and treat dot/space/underscore as hyphen
      const cmpKey = (s) =>
        stripExt(s)
          .toLowerCase()
          .replace(/\\/g, "/")
          .replace(/\/+$/g, "")
          .replace(/[.\s_]+/g, "-")
          .replace(/-+/g, "-");

      const [rawPathPart, rawHash] = href.split("#");
      const pathPart = decode(rawPathPart || "");
      const hash = (rawHash || "").trim();

      const baseDir = selectedPage
        ? normalizePath(selectedPage).split("/").slice(0, -1).join("/")
        : "";

      const resolveRelative = (rel, base) => {
        const relParts = normalizePath(rel).split("/").filter(Boolean);
        const stack = base ? base.split("/").filter(Boolean) : [];
        for (const seg of relParts) {
          if (seg === "." || seg === "") continue;
          if (seg === "..") stack.pop();
          else stack.push(seg);
        }
        return stack.join("/");
      };

      const resolved = resolveRelative(pathPart, baseDir);

      const keys = Object.keys(wikiFiles || {});
      if (!keys.length) return false;

      const targetCmp = cmpKey(resolved);
      const targetBaseCmp = cmpKey(resolved.split("/").pop() || "");

      const found =
        keys.find((k) => cmpKey(k) === targetCmp) ||
        keys.find((k) => cmpKey(k) === targetBaseCmp) ||
        keys.find((k) => cmpKey(k.split("/").pop() || "") === targetBaseCmp);

      if (found) {
        setSelectedPage(found);
        if (hash) {
          setTimeout(() => {
            document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }
        return true;
      }

      return false;
    },
    [selectedPage, wikiFiles]
  );

  const sidebarHeader = useMemo(
    () => (
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-3 py-2.5">
        <div className="flex items-center gap-2 text-foreground">
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Docs</span>
        </div>
      </div>
    ),
    []
  );

  const sidebarFooter = useMemo(
    () => (
      <div className="sticky bottom-0 mt-auto border-t bg-background px-3 py-2 text-[11px] text-muted-foreground">
        Markdown docs generated by AI
      </div>
    ),
    []
  );

  // Reset scroll to top on page change
  useEffect(() => {
    const el = contentScrollRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [selectedPage]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 ">
      {/* Top Header */}
      <WikiHeader
        isSidebarCollapsed={isCollapsed}
        handleToggleSidebar={handleToggleSidebar}
        handleDownloadAll={handleDownloadAll}
        repoOwner={repoOwner}
        repoName={repoName}
        githubUrl={githubUrl || "https://github.com/"}
      />

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={clsx(
            "flex flex-col border-r bg-background transition-[width] duration-300 ease-out",
            "border-slate-200",
            isCollapsed ? "w-0 min-w-0 overflow-hidden" : "w-68"
          )}
          style={{ zIndex: 1 }}
          aria-hidden={isCollapsed}
        >
          {!isCollapsed && (
            <>
              {sidebarHeader}
              <ScrollableDiv className="flex-grow overflow-y-auto p-2.5">
                <nav className="space-y-1.5" role="tree" aria-label="Sidebar tree">
                  {/* Search */}
                  <div className="p-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search pages..."
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  {/* Tree */}
                  <SidebarTree
                    tree={filteredTree}
                    parentPath=""
                    isSidebarCollapsed={isCollapsed}
                    expandedFolders={expandedFolders}
                    setExpandedFolders={handleSetExpandedFolders}
                    selectedPage={selectedPage || ""}
                    setSelectedPage={setSelectedPage}
                  />
                </nav>
              </ScrollableDiv>
              {sidebarFooter}
            </>
          )}
        </aside>

        {/* Main Content */}
        <div ref={contentScrollRef} className="flex-1 flex flex-col overflow-auto bg-white">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading wiki...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Error: {error}</div>
          ) : !selectedPage ? (
            <div className="p-6 text-sm text-muted-foreground">No content.</div>
          ) : (
            <>
              <WikiContent
                key={selectedPage}
                content={coerceMarkdown(wikiFiles[selectedPage] || "")}
                onExpandMermaid={handleExpandMermaid}
                onLinkClick={handleMarkdownLinkClick}
              />
              {/* Next Page Button */}
              {pageNavigation.hasNextPage && (
                <div className="p-4 flex justify-end">
                  <button
                    onClick={handleNextPage}
                    className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-700 transition"
                  >
                    Next Page
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* On This Page (Table of Contents) */}
        <TableOfContents headings={headings} onTocClick={handleTocClick} />
      </div>

      {/* Mermaid Modal */}
      <MermaidModal
        chart={mermaidChart}
        isOpen={mermaidModalOpen}
        onClose={() => setMermaidModalOpen(false)}
        transform={mermaidTransform}
        setTransform={setMermaidTransform}
      />
    </div>
  );
};

export default WikiPage;