import React from 'react';

interface ImageLayerDialogProps {
  isOpen: boolean;
  onSelect: (inFront: boolean) => void;
  onCancel: () => void;
}

const ImageLayerDialog: React.FC<ImageLayerDialogProps> = ({ isOpen, onSelect, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-cyan-400">Image Layer Position</h2>
        <p className="mb-6 text-gray-300">Choose where to place the image relative to text:</p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSelect(true)}
            className="p-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors flex items-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <div className="text-left">
              <div className="font-semibold">In Front of Text</div>
              <div className="text-sm opacity-90">Image will appear over text content</div>
            </div>
          </button>
          
          <button
            onClick={() => onSelect(false)}
            className="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="8" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <div className="text-left">
              <div className="font-semibold">Behind Text</div>
              <div className="text-sm opacity-90">Text will appear over the image</div>
            </div>
          </button>
          
          <button
            onClick={onCancel}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageLayerDialog;