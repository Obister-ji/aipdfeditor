import React from 'react';
import type { Tool } from '../types';
import { TextIcon } from './icons/TextIcon';
import { ImageIcon } from './icons/ImageIcon';
import { DrawIcon } from './icons/DrawIcon';
import { ShapeIcon } from './icons/ShapeIcon';
import { SelectIcon } from './icons/SelectIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { Tooltip } from './Tooltip';


interface ToolbarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { name: Tool; icon: React.ReactNode; label: string; description: string }[] = [
  { name: 'select', icon: <SelectIcon />, label: 'Select & Move', description: 'Select, move, and edit objects.' },
  { name: 'text', icon: <TextIcon />, label: 'Add Text', description: 'Add new text boxes to the page.' },
  { name: 'image', icon: <ImageIcon />, label: 'Add Image', description: 'Upload and place images.' },
  { name: 'draw', icon: <DrawIcon />, label: 'Draw', description: 'Draw freehand on the page.' },
  { name: 'shape', icon: <ShapeIcon />, label: 'Add Shape', description: 'Add rectangles and other shapes.' },
];

const Toolbar: React.FC<ToolbarProps> = ({ selectedTool, onToolSelect, onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
      <Tooltip title="Undo" description="Undo the last action.">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <UndoIcon />
        </button>
      </Tooltip>
      <Tooltip title="Redo" description="Redo the last undone action.">
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RedoIcon />
        </button>
      </Tooltip>
      
      <div className="w-px h-8 bg-gray-600 mx-2"></div>

      {tools.map((tool) => (
        <Tooltip key={tool.name} title={tool.label} description={tool.description}>
          <button
            onClick={() => onToolSelect(tool.name)}
            className={`p-2 rounded-md transition-colors ${
              selectedTool === tool.name
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tool.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

export default Toolbar;
