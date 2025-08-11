import React, { useState, useMemo, useRef, useCallback, memo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import ProjectCreateModal from "@/components/ProjectCreateModal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowUpDown, Loader2 } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";

// Memoize SearchBar
const MemoizedSearchBar = memo(SearchBar);

// Memoize Pagination
const MemoizedPagination = memo(Pagination);

// Create a separate memoized SortRow component
const SortRow = memo(({ resultsCount, sortOrder, onSortChange }) => (
  <div className="flex w-full items-center justify-end">
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        Results:{" "}
        <span className="font-medium text-foreground">
          {resultsCount}
        </span>
      </span>
      <div className="h-4 w-px bg-border" />
      <label
        htmlFor="sortOrder"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Sort
      </label>
      <Select value={sortOrder} onValueChange={onSortChange}>
        <SelectTrigger
          id="sortOrder"
          className="h-9 w-[160px] justify-between"
        >
          <SelectValue placeholder="Sort order" />
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[180px]">
          <SelectItem value="newest">
            <span className="inline-flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              Newest first
            </span>
          </SelectItem>
          <SelectItem value="oldest">
            <span className="inline-flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground rotate-180" />
              Oldest first
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
));
SortRow.displayName = "SortRow";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchInputRef = useRef(null);
  const appContainerRef = useRef(null);

  const fetchProjects = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/projects/");
      console.log(response);
      if (Array.isArray(response.data)) {
        // backend returns raw list
        setProjects(response.data || []);
      } else if (response.data?.success) {
        setProjects(response.data.data || []);
      } else if (response.data && Array.isArray(response.data.data)) {
        setProjects(response.data.data || []);
      } else {
        setError(response.data?.message || "Failed to fetch projects.");
      }
    } catch (err) {
      setError("An error occurred while fetching projects. Please try again later.");
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Make sure onProjectCreated is properly handled
  const handleProjectCreated = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
    appContainerRef.current?.focus();
  }, [fetchProjects]);

  // Poll every 3 minutes to refresh project statuses without flashing the loader
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProjects({ silent: true });
    }, 60000); // 1 minutes
    return () => clearInterval(interval);
  }, [fetchProjects]);

  const itemsPerPage = 3;

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let filtered = projects;
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    filtered = [...filtered].sort((a, b) => {
      const A = new Date(a.created_at).getTime();
      const B = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? B - A : A - B;
    });
    return filtered;
  }, [projects, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const currentProjects = filteredProjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSearchChange = useCallback((newQuery) => {
    setSearchQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handleDeleteProject = useCallback(async (projectId) => {
    const toastId = `delete-${projectId}`;
    try {
      const response = await api.delete(`/projects/${projectId}`);
      if (response.data?.success) {
        toast.success("Project deleted successfully", { id: toastId });
        fetchProjects(); // Refresh list on successful delete
      } else {
        toast.error(response.data?.message || "Failed to delete project", { id: toastId });
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast.error("An error occurred while deleting the project", { id: toastId });
    }
  }, [fetchProjects]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSortOrder) => {
    setSortOrder(newSortOrder);
  }, []);

  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName;
    const isTyping =
      tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;

    if (!isTyping) {
      if (e.key === "/") {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        if (searchInputRef.current?.value) {
          clearSearch();
        }
        searchInputRef.current?.blur();
        return;
      }
      searchInputRef.current?.focus();
    }
  }, [clearSearch]);

  const MemoizedNavbar = useMemo(() => <Navbar onAddProject={() => setIsModalOpen(true)} />, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-6 py-16 text-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading projects...</p>
        </div>
      );
    }

    if (error) {
      return (
        <section className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 px-6 py-16 text-center shadow-sm">
          <div className="text-base text-destructive">{error}</div>
          <p className="mt-2 text-sm text-destructive/80">
            Please check your connection or try again.
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-destructive text-destructive px-3 text-sm font-medium hover:bg-destructive/20"
              onClick={() => fetchProjects()}
            >
              Retry
            </button>
          </div>
        </section>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <section
          className="flex flex-col items-center justify-center rounded-lg border bg-card px-6 py-16 text-center shadow-sm"
          aria-live="polite"
        >
          <div className="text-base text-muted-foreground">
            {searchQuery ? (
              <>
                No projects found for
                <span className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground/90">
                  {searchQuery}
                </span>
              </>
            ) : (
              "No projects yet."
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "Try different keywords or clear the search." : "Add a new project to get started."}
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={searchQuery ? clearSearch : () => setIsModalOpen(true)}
            >
              {searchQuery ? "Clear search" : "Add Project"}
            </button>
          </div>
        </section>
      );
    }

    return (
      <>
        <div
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          role="list"
          aria-label="Projects"
        >
          {currentProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              onDelete={handleDeleteProject}
              role="listitem"
            />
          ))}
        </div>

        <div className="mb-10 flex items-center justify-center">
          {totalPages > 1 && (
            <MemoizedPagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div
      ref={appContainerRef}
      className="min-h-screen bg-background"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      aria-label="Application"
    >
      {MemoizedNavbar}

      <ProjectCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-3 sm:mb-4">
          <MemoizedSearchBar
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            resultsCount={filteredProjects.length}
            inputRef={searchInputRef}
            placeholder="Search projects... (press any key to focus)"
          />
        </div>

        <div className="mb-6 sm:mb-8">
          <SortRow
            resultsCount={filteredProjects.length}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {renderContent()}
      </main>
    </div>
  );
}