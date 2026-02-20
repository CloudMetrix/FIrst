import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

const UploadAction = () => {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    navigate('/upload-contract');
  };

  return (
    <>
      <div className="hidden md:block">
        <Button
          variant="default"
          iconName="Upload"
          iconPosition="left"
          onClick={handleUploadClick}
        >
          Upload Contract
        </Button>
      </div>

      <button
        onClick={handleUploadClick}
        className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-elevation-3 hover:shadow-elevation-4 transition-base flex items-center justify-center z-dropdown"
        aria-label="Upload contract"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </button>
    </>
  );
};

export default UploadAction;