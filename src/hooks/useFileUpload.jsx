import { useState,useRef,useCallback } from "react";

const useFileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prevFiles) => {
      const existing = new Set(prevFiles.map(f => f.name + f.size));
      const filtered = newFiles.filter(f => !existing.has(f.name + f.size));
      return [...prevFiles, ...filtered];
    });
  };

  const clearFiles = useCallback(() => setSelectedFiles([]), []);

  const triggerFileInput = useCallback(() => fileInputRef.current?.click(), []);

  return {
    selectedFiles,
    fileInputRef,
    handleFileSelect,
    clearFiles,
    triggerFileInput
  };
};

export default useFileUpload