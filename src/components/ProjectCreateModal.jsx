import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Github, Upload, FileCode, Key, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useFileUpload from '@/hooks/useFileUpload';
import useFormState from '@/hooks/useFormState';
import FileUploader from './FileUploader';
import { extractProjectNameFromUrl } from '@/utils';
import api from '@/api/axios';
import { toast } from 'sonner';

// Constants
const TABS = {
  GITHUB: 'github',
  UPLOAD: 'upload',
};

const MAX_DESC = 500;

const ProjectCreateModal = ({ isOpen, onClose, onProjectCreated = () => {} }) => {
  const { formData, updateField, resetForm } = useFormState();
  const {
    selectedFiles,
    fileInputRef,
    handleFileSelect,
    clearFiles,
    triggerFileInput,
    setSelectedFiles,
  } = useFileUpload();
  const [error, setError] = useState(null);
  const previousProjectNameRef = useRef('');

  const extractedProjectName = useMemo(() => {
    if (formData.activeTab === TABS.GITHUB) {
      return extractProjectNameFromUrl(formData.githubUrl);
    }
    return '';
  }, [formData.githubUrl, formData.activeTab]);

  const handleOpenChange = (open) => {
    if (!open) {
      resetForm();
      clearFiles();
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (formData.isAnalyzing) return;

    updateField('isAnalyzing', true);
    setError(null);
    const data = new FormData();

    try {
      let response;
      if (formData.activeTab === TABS.UPLOAD) {
        data.append('name', (formData.manualProjectName || '').trim());
        if (formData.projectDescription) {
          data.append('description', formData.projectDescription.slice(0, MAX_DESC));
        }
        selectedFiles.forEach((file) => {
          data.append('files', file);
        });
        response = await api.post('/projects/upload_files', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        data.append('name', (formData.githubProjectName || '').trim());
        data.append('github_url', (formData.githubUrl || '').trim());
        if (formData.githubProjectDescription) {
          data.append('description', formData.githubProjectDescription.slice(0, MAX_DESC));
        }
        if (formData.accessToken) {
          data.append('github_token', formData.accessToken);
        }
        response = await api.post('/projects/upload_github', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const isAccepted = response?.status === 202;
      const isSuccess = response?.data?.success === true;

      if (isAccepted || isSuccess) {
        toast.success(
          isAccepted
            ? 'Project created. Analysis has started in the backend.'
            : 'Project created successfully!'
        );

        resetForm();
        clearFiles();
        setError(null);

        onClose();

        setTimeout(() => {
          if (typeof onProjectCreated === 'function') {
            onProjectCreated();
          }
        }, 100);
      } else {
        const msg = response?.data?.message || 'Failed to create project';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError && apiError.success === false) {
        const details = apiError.error?.details ? ` Details: ${apiError.error.details}` : '';
        const errorMessage = `${apiError.message || 'Failed to create project.'}${details}`;
        setError(errorMessage);
        toast.error(apiError.message || 'Failed to create project');
      } else {
        const errorMessage = 'Failed to create project. Please check the server connection.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      console.error('Create project failed:', err);
    } finally {
      updateField('isAnalyzing', false);
    }
  };

  const isGithubValid =
    (formData.githubUrl || '').trim() &&
    (formData.githubProjectName || '').trim() &&
    !formData.isAnalyzing;

  const isUploadValid =
    (formData.manualProjectName || '').trim() && selectedFiles.length > 0 && !formData.isAnalyzing;

  // Keyboard micro-UX: Ctrl/Cmd + Enter submits the active form
  const handleKeyDownSubmit = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Auto-suggest project name from URL once per change
  useEffect(() => {
    if (
      formData.activeTab === TABS.GITHUB &&
      extractedProjectName &&
      extractedProjectName !== previousProjectNameRef.current &&
      (!formData.githubProjectName || formData.githubProjectName === '')
    ) {
      updateField('githubProjectName', extractedProjectName);
      previousProjectNameRef.current = extractedProjectName;
    }
  }, [
    extractedProjectName,
    formData.activeTab,
    formData.githubUrl,
    formData.githubProjectName,
    updateField,
  ]);

  // Reset the ref when the modal opens/closes or tab changes
  useEffect(() => {
    if (!isOpen || formData.activeTab !== TABS.GITHUB) {
      previousProjectNameRef.current = '';
    }
  }, [isOpen, formData.activeTab]);

  const handleUseSuggestedName = () => {
    if (extractedProjectName) {
      updateField('githubProjectName', extractedProjectName);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const descLenGithub = (formData.githubProjectDescription || '').length;
  const descLenUpload = (formData.projectDescription || '').length;
  const descOverGithub = descLenGithub > MAX_DESC;
  const descOverUpload = descLenUpload > MAX_DESC;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="!max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-busy={formData.isAnalyzing}
      >
        <div className="relative">

          <DialogHeader className="pb-2 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-gray-700" />
              Add Project
              {formData.isAnalyzing && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Working…
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div
              className="flex items-start gap-3 bg-red-50 text-red-800 border border-red-200 rounded-md p-3 text-sm my-4"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="break-words">{error}</p>
            </div>
          )}

          <Tabs
            value={formData.activeTab}
            onValueChange={(value) => {
              updateField('activeTab', value);
              setError(null);
            }}
            className="w-full"
          >
            {/* Tabs bar with small gap and sticky-on-scroll micro-UX */}
            <TabsList className="grid w-full grid-cols-2 mt-3 sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/60 rounded-md">
              <TabsTrigger
                value={TABS.GITHUB}
                className="flex items-center gap-2 transition-colors data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Github className="w-4 h-4" />
                GitHub Repository
              </TabsTrigger>
              <TabsTrigger
                value={TABS.UPLOAD}
                className="flex items-center gap-2 transition-colors data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </TabsTrigger>
            </TabsList>

            {/* GitHub form */}
            <TabsContent value={TABS.GITHUB} className="space-y-6 mt-6">
              <form className="space-y-6" onSubmit={handleSubmit} onKeyDown={handleKeyDownSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="github-url">
                    GitHub Repository URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="github-url"
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={formData.githubUrl}
                    onChange={(e) => updateField('githubUrl', e.target.value)}
                    autoFocus
                    disabled={formData.isAnalyzing}
                    className="transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    We’ll fetch your repo and start analysis. Private repos supported with a token.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Personal Access Token (Optional)
                  </Label>
                  <Input
                    id="access-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={formData.accessToken}
                    onChange={(e) => updateField('accessToken', e.target.value)}
                    disabled={formData.isAnalyzing}
                    className="transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only used server-side for cloning; never stored.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-project-name">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="github-project-name"
                      type="text"
                      value={formData.githubProjectName || ''}
                      onChange={(e) => updateField('githubProjectName', e.target.value)}
                      placeholder="Extracted from GitHub URL"
                      className="bg-white transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      autoComplete="off"
                      disabled={formData.isAnalyzing}
                    />
                    {extractedProjectName &&
                      formData.githubProjectName !== extractedProjectName && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 whitespace-nowrap transition-all active:scale-[0.98]"
                          onClick={handleUseSuggestedName}
                          disabled={formData.isAnalyzing}
                        >
                          Use “{extractedProjectName}”
                        </Button>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github-project-description">Project Description</Label>
                  <Textarea
                    id="github-project-description"
                    placeholder="Describe your project (optional)"
                    value={formData.githubProjectDescription || ''}
                    onChange={(e) => updateField('githubProjectDescription', e.target.value)}
                    className="min-h-[100px] transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={formData.isAnalyzing}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${descOverGithub ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {descLenGithub}/{MAX_DESC}
                    </span>
                    {descOverGithub && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Description will be trimmed.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={formData.isAnalyzing}
                    className="transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                    disabled={!isGithubValid}
                  >
                    {formData.isAnalyzing ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Create
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Upload form */}
            <TabsContent value={TABS.UPLOAD} className="space-y-6 mt-6">
              <form className="space-y-6" onSubmit={handleSubmit} onKeyDown={handleKeyDownSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="manual-project-name">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="manual-project-name"
                    type="text"
                    placeholder="core-banking-system"
                    value={formData.manualProjectName}
                    onChange={(e) => updateField('manualProjectName', e.target.value)}
                    disabled={formData.isAnalyzing}
                    className="transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description">Project Description</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Mainframe COBOL banking system with customer accounts, transactions, and loan processing"
                    value={formData.projectDescription}
                    onChange={(e) => updateField('projectDescription', e.target.value)}
                    className="min-h-[100px] transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={formData.isAnalyzing}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${descOverUpload ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {descLenUpload}/{MAX_DESC}
                    </span>
                    {descOverUpload && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Description will be trimmed.
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>
                    COBOL Source Files <span className="text-red-500">*</span>
                  </Label>
                  <FileUploader
                    selectedFiles={selectedFiles}
                    onFileSelect={handleFileSelect}
                    onClearFiles={clearFiles}
                    onTriggerInput={triggerFileInput}
                    fileInputRef={fileInputRef}
                    onRemoveFile={handleRemoveFile}
                    disabled={formData.isAnalyzing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Drag & drop files or browse. We’ll start analysis right after upload.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={formData.isAnalyzing}
                    className="transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                    disabled={!isUploadValid}
                  >
                    {formData.isAnalyzing ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Create
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreateModal;