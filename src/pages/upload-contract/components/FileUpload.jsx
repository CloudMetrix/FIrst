import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const FileUpload = ({ file, onFileSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const allowedFormats = ['.pdf', '.doc', '.docx', '.txt'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDragEnter = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
  };

  const validateFile = (selectedFile) => {
    const fileExtension = '.' + selectedFile?.name?.split('.')?.pop()?.toLowerCase();
    
    if (!allowedFormats?.includes(fileExtension)) {
      return `Invalid file format. Allowed formats: ${allowedFormats?.join(', ')}`;
    }
    
    if (selectedFile?.size > maxFileSize) {
      return 'File size exceeds 10MB limit';
    }
    
    return null;
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(false);

    const droppedFile = e?.dataTransfer?.files?.[0];
    if (droppedFile) {
      const validationError = validateFile(droppedFile);
      if (validationError) {
        onFileSelect(null, validationError);
      } else {
        onFileSelect(droppedFile, null);
        simulateUpload();
      }
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e?.target?.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        onFileSelect(null, validationError);
      } else {
        onFileSelect(selectedFile, null);
        simulateUpload();
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef?.current?.click();
  };

  const handleRemoveFile = () => {
    onFileSelect(null, null);
    setUploadProgress(0);
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes?.[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Contract Document <span className="text-error">*</span>
        </label>
        
        {!file ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-base ${
              isDragging
                ? 'border-primary bg-primary/5'
                : error
                ? 'border-error bg-error/5' :'border-border hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedFormats?.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Upload" size={32} color="var(--color-primary)" />
              </div>
              
              <div className="space-y-2">
                <p className="text-base md:text-lg font-medium text-foreground">
                  Drag and drop your file here
                </p>
                <p className="text-sm text-text-secondary">
                  or
                </p>
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="text-primary hover:text-primary/80 font-medium transition-base"
                >
                  Browse files
                </button>
              </div>
              
              <p className="text-xs md:text-sm text-text-secondary">
                Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between space-x-4">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={20} color="var(--color-primary)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium text-foreground truncate">
                    {file?.name}
                  </p>
                  <p className="text-xs md:text-sm text-text-secondary mt-1">
                    {formatFileSize(file?.size)}
                  </p>
                  
                  {uploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">Uploading...</span>
                        <span className="text-xs font-medium text-primary">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-base"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {uploadProgress === 100 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Icon name="CheckCircle" size={16} color="var(--color-success)" />
                      <span className="text-xs md:text-sm text-success">Upload complete</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-md transition-base flex-shrink-0"
                aria-label="Remove file"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <p className="text-sm text-error mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;