import { Button } from "./ui/button";
import { Upload, FileCode } from 'lucide-react';
import FileList from "./FileList";

const FILE_EXTENSIONS = '.cbl,.cob,.cobol,.cpy,.jcl,.rexx,.zip';

const FileUploader = ({
  selectedFiles,
  onFileSelect,
  onClearFiles,
  onTriggerInput,
  fileInputRef,
  onRemoveFile // <-- Make sure to pass this prop from parent
}) => {
  return (
    <div className="w-full">
      {selectedFiles.length === 0 ? (
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-900">Upload COBOL Files</span>
          <Button
            type="button"
            onClick={onTriggerInput}
            size="sm"
            className="ml-2 bg-gray-800 hover:bg-gray-700"
          >
            <Upload className="w-3 h-3 mr-1" />
            Choose Files
          </Button>
          <span className="text-xs text-gray-400 ml-2">
            (.cbl, .cob, .cobol, .cpy, .jcl, .rexx)
          </span>
        </div>
      ) : (
        <FileList
          files={selectedFiles}
          onAddMore={onTriggerInput}
          onClearAll={onClearFiles}
          onRemoveFile={onRemoveFile}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_EXTENSIONS}
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default FileUploader