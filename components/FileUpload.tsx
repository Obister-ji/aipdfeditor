
import React, { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };


  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div 
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="relative block w-full rounded-lg border-2 border-dashed border-gray-500 p-6 md:p-12 text-center hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="mt-2 block text-sm font-medium text-gray-300">
          Drop a PDF file here or
        </span>
         <label htmlFor="file-upload" className="relative cursor-pointer font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none">
            <span> click to upload</span>
            <input id="file-upload" name="file-upload" type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} />
        </label>
      </div>
      <div className="text-center mt-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">AI PDF Editor Pro</h1>
        <p className="mt-2 text-base md:text-lg text-gray-400">View, edit, and summarize your PDFs with ease.</p>
      </div>
    </div>
  );
};

export default FileUpload;
