import React from "react";
import {
  PanelLeft,
  PanelLeftOpen,
  Download,
  ExternalLink,
  ArrowLeft,
  Github,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function WikiHeader({
  isSidebarCollapsed,
  handleToggleSidebar,
  handleDownloadAll,
  repoOwner = "legacy-bank",
  repoName = "core-banking-system",
  githubUrl = "https://github.com/",
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        {/* Left: Navigation + breadcrumb */}
        <div className="min-w-0 flex items-center gap-1.5 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            title={isSidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
            aria-label={isSidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
            className="shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            title="Back"
            aria-label="Go back"
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="min-w-0 flex items-center text-sm text-muted-foreground"
          >
            <ol className="min-w-0 flex items-center">
              <li className="min-w-0">
                <div className="flex min-w-0 items-center">
                  <span className="truncate font-medium text-foreground">
                    {repoOwner}
                  </span>
                  <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/70" />
                  <span className="truncate font-semibold text-foreground">
                    {repoName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
              aria-label="View on GitHub"
              title="View on GitHub"
            >
              <Github className="mr-1.5 h-4 w-4" />
              View on GitHub
              <ExternalLink className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </Button>

          {/* Icon-only on small screens */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="md:hidden"
            title="View on GitHub"
            aria-label="View on GitHub"
          >
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="hidden items-center gap-2 md:inline-flex"
          >
            <Download className="h-4 w-4" />
            Export Docs
          </Button>

          {/* Icon-only on small screens */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownloadAll}
            className="md:hidden"
            title="Export Docs"
            aria-label="Export Docs"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default React.memo(WikiHeader);