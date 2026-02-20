import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DocumentManager = ({ initialDocuments = [], onDocumentsChange }) => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

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

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e?.dataTransfer?.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e?.target?.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files?.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes?.includes(file?.type) && file?.size <= 10 * 1024 * 1024;
    });

    if (validFiles?.length > 0) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            const newDocuments = validFiles?.map((file, index) => ({
              id: Date.now() + index,
              name: file?.name,
              size: file?.size,
              type: file?.type,
              uploadedAt: new Date()?.toISOString()
            }));
            const updatedDocuments = [...documents, ...newDocuments];
            setDocuments(updatedDocuments);
            onDocumentsChange(updatedDocuments);
            setTimeout(() => setUploadProgress(null), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleRemoveDocument = (docId) => {
    const updatedDocuments = documents?.filter(doc => doc?.id !== docId);
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes?.[i];
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return 'FileText';
    if (type?.includes('word')) return 'FileText';
    return 'File';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
          Contract Documents
        </h3>
        <p className="text-sm text-text-secondary">
          Upload or replace contract documents (PDF, DOC, DOCX - Max 10MB)
        </p>
      </div>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-base ${
          isDragging
            ? 'border-primary bg-primary/5' :'border-border bg-muted/30 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Upload" size={24} color="var(--color-primary)" className="md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-sm md:text-base font-medium text-foreground mb-1">
              Drag and drop files here
            </p>
            <p className="text-xs md:text-sm text-text-secondary">
              or click to browse from your computer
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              iconName="FolderOpen"
              iconPosition="left"
              className="cursor-pointer"
              onClick={(e) => {
                e?.preventDefault();
                document.getElementById('file-upload')?.click();
              }}
            >
              Browse Files
            </Button>
          </label>
        </div>
      </div>
      {uploadProgress !== null && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Uploading...</span>
            <span className="text-sm text-text-secondary">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-base"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      {documents?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Attached Documents ({documents?.length})
          </h4>
          <div className="space-y-2">
            {documents?.map((doc) => (
              <div
                key={doc?.id}
                className="bg-card rounded-lg border border-border p-3 md:p-4 flex items-center justify-between hover:shadow-elevation-1 transition-base"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    <Icon name={getFileIcon(doc?.type)} size={20} color="var(--color-primary)" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc?.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatFileSize(doc?.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(doc?.id)}
                  className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-md transition-base flex-shrink-0 ml-2"
                  aria-label="Remove document"
                >
                  <Icon name="Trash2" size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;