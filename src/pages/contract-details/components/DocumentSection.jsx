import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DocumentSection = ({ documents }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes?.[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.')?.pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'FileText';
      case 'doc': case'docx':
        return 'FileText';
      case 'xls': case'xlsx':
        return 'FileSpreadsheet';
      default:
        return 'File';
    }
  };

  const handleDownload = (document) => {
    console.log('Downloading document:', document?.name);
  };

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 lg:p-8">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground mb-4 md:mb-6">
        Contract Documents
      </h2>
      <div className="space-y-3 md:space-y-4">
        {documents?.map((doc) => (
          <div
            key={doc?.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-base"
          >
            <div className="flex items-start space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Icon name={getFileIcon(doc?.name)} size={20} color="var(--color-primary)" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-medium text-foreground truncate">
                  {doc?.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs md:text-sm text-text-secondary">
                  <span>{formatFileSize(doc?.size)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Uploaded {formatDate(doc?.uploadDate)}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={() => handleDownload(doc)}
              className="w-full sm:w-auto"
            >
              Download
            </Button>
          </div>
        ))}
      </div>
      {documents?.length === 0 && (
        <div className="text-center py-8 md:py-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="FileX" size={32} color="var(--color-text-secondary)" />
          </div>
          <p className="text-text-secondary text-sm md:text-base">No documents attached to this contract</p>
        </div>
      )}
    </div>
  );
};

export default DocumentSection;