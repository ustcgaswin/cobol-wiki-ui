import { Clock, Trash2, CheckCircle, GitBranch, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/api/axios"

function formatCreatedAt(dateStr) {
  if (!dateStr) return "Unknown date";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC', // ensure date-only display aligned with backend UTC
  });
}

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const base = "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium";
  switch (s) {
    case "pending":
      return (
        <span className={`${base} bg-amber-50 text-amber-800 border-amber-200`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Pending
        </span>
      );
    case "analyzing":
      return (
        <span className={`${base} bg-blue-50 text-blue-800 border-blue-200`}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Analyzing
        </span>
      );
    case "generated":
      return (
        <span className={`${base} bg-emerald-50 text-emerald-800 border-emerald-200`}>
          <CheckCircle className="w-3.5 h-3.5" />
          Generated
        </span>
      );
    case "failed":
      return (
        <span className={`${base} bg-rose-50 text-rose-800 border-rose-200`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    default:
      return (
        <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>
          <Clock className="w-3.5 h-3.5" />
          Unknown
        </span>
      );
  }
};

const ProjectCard = ({
  id,
  name = "Untitled Project",
  description = "No description provided.",
  created_at,
  github_url,
  onDelete,
  wiki_status,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = async (e) => {
    // Prevent navigation when delete icon is clicked
    if (e.target.closest(".delete-icon") || e.target.closest(".github-link")) return;
    if (wiki_status === "generated") {
      try {
        const response = await api.get(`/projects/${id}/wiki/content`);
        console.log("Wiki content:", response.data);
      } catch (err) {
        console.error("Failed to fetch wiki content:", err);
      }
    }
    navigate(`/wiki/${id}`);
  };


  const handleDelete = (e) => {
    e.stopPropagation();
    setOpen(false);
    if (onDelete) {
      // Show loading toast with a unique ID
      toast.loading("Deleting project...", { id: `delete-${id}` });
      onDelete(id);
    }
  };

  const handleGitHubClick = (e) => {
    e.stopPropagation();
    if (github_url) {
      window.open(github_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className="group max-w-sm hover:shadow-lg hover:cursor-pointer transition-all duration-300 hover:scale-[1.02] relative flex flex-col bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-slate-300"
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`Open wiki for ${name}`}
    >
      {/* Delete icon and modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all duration-200 delete-icon shadow-sm border border-slate-200 z-10"
            title="Delete project"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            tabIndex={0}
            aria-label="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to delete <span className="font-semibold">{name}</span>?<br />
            <span className="text-red-600 font-medium">This action cannot be undone.</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header with improved spacing */}
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 leading-tight">
          {name}
        </CardTitle>
        <CardDescription className="text-slate-600 line-clamp-3 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      {/* Content with better organization */}
      <CardContent className="flex-grow flex flex-col justify-end pt-0">
        {/* GitHub section */}
        {github_url && (
          <div className="mb-4">
            <button
              onClick={handleGitHubClick}
              className="github-link flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 text-sm font-medium group/github"
              title="View on GitHub"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 transition-colors duration-200">
                <GitBranch className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover/github:opacity-100" />
              </div>
            </button>
          </div>
        )}

        {/* Footer with timestamp + wiki status */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Created {formatCreatedAt(created_at)}</span>
          </div>
          <StatusBadge status={wiki_status} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;