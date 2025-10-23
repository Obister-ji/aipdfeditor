import React, { useEffect, useRef, useState } from 'react';
import type { TextObject, OriginalTextObject } from '../types';
import { BoldIcon } from './icons/BoldIcon';
import { ItalicIcon } from './icons/ItalicIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ColorIcon } from './icons/ColorIcon';
import { FontSizeIcon } from './icons/FontSizeIcon';

type EditableObject = TextObject | OriginalTextObject;

interface TextToolbarProps {
  object: EditableObject;
  viewerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  onUpdate: (id: string, updates: Partial<EditableObject>) => void;
  onDelete: (id: string) => void;
}

const TextToolbar: React.FC<TextToolbarProps> = ({ object, viewerRef, zoom, onUpdate, onDelete }) => {
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
    // FIX: Use `as any` to access properties 'x' and 'y' which only exist on TextObject.
    // This correctly tracks position changes for editable text objects without causing a type error.
  }, [object.id, (object as any).x, (object as any).y, object.width, viewerRef, zoom]);

  const handleUpdate = (updates: Partial<EditableObject>) => {
    onUpdate(object.id, updates);
  };

  // Added validation for maximum font size
  const handleFontSizeChange = (increment: number) => {
    const newFontSize = Math.max(8, Math.min(72, object.fontSize + increment)); // Limit font size between 8 and 72
    handleUpdate({ fontSize: newFontSize });
  };
  
  return (
    <div
      ref={toolbarRef}
      className="absolute z-30 flex items-center gap-1 p-1 bg-gray-900 rounded-md shadow-lg"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
        <button onClick={() => handleUpdate({ fontWeight: object.fontWeight === 700 ? 400 : 700 })} className={`p-2 rounded ${object.fontWeight === 700 ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}><BoldIcon /></button>
        <button onClick={() => handleUpdate({ fontStyle: object.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-2 rounded ${object.fontStyle === 'italic' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}><ItalicIcon /></button>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button onClick={() => handleFontSizeChange(-1)} className="p-2 rounded hover:bg-gray-700"><FontSizeIcon direction="down" /></button>
        <span className="px-1 text-sm">{object.fontSize.toFixed(0)}</span>
        <button onClick={() => handleFontSizeChange(1)} className="p-2 rounded hover:bg-gray-700"><FontSizeIcon direction="up" /></button>
         <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <div className="relative p-2 rounded hover:bg-gray-700 cursor-pointer">
            <ColorIcon />
            <input type="color" value={object.color} onChange={(e) => handleUpdate({ color: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button onClick={() => onDelete(object.id)} className="p-2 rounded hover:bg-red-600"><TrashIcon /></button>
    </div>
  );
};

export default TextToolbar;