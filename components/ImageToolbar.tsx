import React, { useEffect, useRef, useState } from 'react';
import type { ImageObject } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface ImageToolbarProps {
  object: ImageObject;
  viewerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  onUpdate: (id: string, updates: Partial<ImageObject>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({ object, viewerRef, zoom, onUpdate, onDelete, onBringToFront, onSendToBack }) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    if (!viewerRef.current || !toolbarRef.current) return;
    const viewerRect = viewerRef.current.getBoundingClientRect();
    const objectElement = viewerRef.current.querySelector(`[data-id='${object.id}']`) as HTMLElement;
    
    if (objectElement) {
      const objectRect = objectElement.getBoundingClientRect();
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      
      let top = objectRect.top - viewerRect.top - toolbarRect.height - 10;
      let left = objectRect.left - viewerRect.left + (objectRect.width / 2) - (toolbarRect.width / 2);
      
      // Boundary checks
      if (top < 0) top = objectRect.bottom - viewerRect.top + 10;
      if (left < 0) left = 0;
      if (left + toolbarRect.width > viewerRect.width) left = viewerRect.width - toolbarRect.width;

      setPosition({ top, left });
    }
  }, [object.id, object.x, object.y, object.width, viewerRef, zoom]);

  const handleUpdate = (updates: Partial<ImageObject>) => {
    onUpdate(object.id, updates);
  };
  
  return (
    <div
      ref={toolbarRef}
      className="absolute z-30 flex items-center gap-1 p-1 bg-gray-900 rounded-md shadow-lg"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onSendToBack(object.id)}
        className="p-2 rounded hover:bg-gray-700 flex items-center gap-1 text-xs"
        title="Send behind text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
          <rect x="8" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        <span>Behind</span>
      </button>
      <button
        onClick={() => onBringToFront(object.id)}
        className="p-2 rounded hover:bg-gray-700 flex items-center gap-1 text-xs"
        title="Bring in front of text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
          <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        <span>Front</span>
      </button>
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      <button onClick={() => onDelete(object.id)} className="p-2 rounded hover:bg-red-600"><TrashIcon /></button>
    </div>
  );
};

export default ImageToolbar;