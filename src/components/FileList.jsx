import { Button } from "./ui/button";
import { Upload, FileCode, X } from 'lucide-react';
import { useState } from "react";

const MAX_VISIBLE = 5;

const FileList = ({ files, onAddMore, onClearAll, onRemoveFile }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const visibleFiles = files.slice(0, MAX_VISIBLE);
  const hiddenFiles = files.slice(MAX_VISIBLE);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded-md">
            <FileCode className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-gray-500">Ready for conversion</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAddMore}>
            <Upload className="w-3 h-3 mr-1" />
            Add More
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>
      </div>
      {/* Tag-style file list */}
      <div className="flex flex-wrap gap-2 items-center">
        {visibleFiles.map((file, index) => (
          <div
            key={index}
            className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm text-sm text-gray-700"
          >
            <FileCode className="w-3 h-3 text-gray-500 mr-1" />
            <span className="truncate max-w-[100px]">{file.name}</span>
            <span className="ml-2 text-xs text-gray-400">
              {(file.size / 1024).toFixed(1)} KB
            </span>
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
              aria-label="Remove file"
              onClick={() => onRemoveFile(index)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {hiddenFiles.length > 0 && (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700 cursor-pointer">
              +{hiddenFiles.length}
            </div>
            {showTooltip && (
              <div className="absolute z-10 left-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg p-2">
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {hiddenFiles.map((file, idx) => (
                    <div
                      key={MAX_VISIBLE + idx}
                      className="flex items-center bg-gray-50 border border-gray-100 rounded-full px-2 py-1 text-xs text-gray-700"
                    >
                      <FileCode className="w-3 h-3 text-gray-500 mr-1" />
                      <span className="truncate max-w-[90px]">{file.name}</span>
                      <span className="ml-2 text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                        aria-label="Remove file"
                        onClick={() => onRemoveFile(MAX_VISIBLE + idx)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList