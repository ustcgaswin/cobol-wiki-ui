import { useState,useCallback } from "react";

const TABS = {
  GITHUB: 'github',
  UPLOAD: 'upload'
};

const useFormState = () => {
  const [formData, setFormData] = useState({
    activeTab: TABS.GITHUB,
    githubUrl: '',
    accessToken: '',
    projectDescription: '',
    manualProjectName: '',
    isAnalyzing: false
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = useCallback(() => {
    setFormData({
      activeTab: TABS.GITHUB,
      githubUrl: '',
      accessToken: '',
      projectDescription: '',
      manualProjectName: '',
      isAnalyzing: false
    });
  }, []);

  return { formData, updateField, resetForm };
};

export default useFormState