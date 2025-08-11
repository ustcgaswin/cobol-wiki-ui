import { memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

const Navbar = memo(({ onAddProject }) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b",
        "bg-sky-950 border-sky-900"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex h-14 w-full max-w-7xl items-center justify-between",
          "px-4 sm:px-6 lg:px-8"
        )}
        aria-label="Primary"
      >
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-800 ring-1 ring-white/10">
            <Sparkles className="h-4 w-4 text-sky-200" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-white">
              Cobol Wiki Generator
            </div>
            <div className="hidden text-xs text-sky-200/80 sm:block">
              Generate, browse, and export project docs
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button
            className={cn(
              "inline-flex items-center gap-2",
              "bg-sky-600 text-white hover:bg-sky-500",
              "border border-white/10 hover:border-white/20",
              "shadow-sm hover:shadow transition-colors",
              "px-4 py-2"
            )}
            onClick={() => onAddProject?.()}
            aria-label="Add project"
            title="Add project"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </nav>
    </header>
  );
});

Navbar.displayName = "Navbar";

export default Navbar