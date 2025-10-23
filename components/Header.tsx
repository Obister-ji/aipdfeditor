import React from 'react';
import type { Tool } from '../types';
import Toolbar from './Toolbar';
import { SummarizeIcon } from './icons/SummarizeIcon';
import { MenuIcon } from './icons/MenuIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';

interface HeaderProps {
    fileName: string;
    onClose: () => void;
    selectedTool: Tool;
    onToolSelect: (tool: Tool) => void;
    onSummarize: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    zoom: number;
    onZoomChange: (zoom: number | 'in' | 'out') => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
    return (
        <header className="flex items-center justify-between p-2 bg-gray-900 shadow-md z-20 flex-shrink-0 gap-2">
            {/* Left Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
               <button onClick={props.onToggleSidebar} className="p-2 rounded-md text-gray-300 hover:bg-gray-700">
                    <MenuIcon />
               </button>
               <button onClick={props.onClose} className="hidden md:flex px-3 py-1.5 text-sm font-semibold bg-red-600 hover:bg-red-700 rounded-md transition-colors items-center gap-1">Close PDF</button>
               <h1 className="hidden md:block text-lg font-bold truncate max-w-[200px]">{props.fileName}</h1>
            </div>
            
            {/* Center Section */}
            <div className="flex-1 flex justify-center min-w-0">
                 <Toolbar
                    selectedTool={props.selectedTool}
                    onToolSelect={props.onToolSelect}
                    onUndo={props.onUndo}
                    onRedo={props.onRedo}
                    canUndo={props.canUndo}
                    canRedo={props.canRedo}
                />
            </div>

             {/* Right Section */}
             <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden md:flex items-center gap-1 bg-gray-800 border border-gray-700 p-1 rounded-lg">
                    <button onClick={() => props.onZoomChange('out')} title="Zoom Out" className="p-1 rounded-md text-gray-300 hover:bg-gray-700"><ZoomOutIcon /></button>
                    <input
                        type="range"
                        id="zoom"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={props.zoom}
                        onChange={(e) => props.onZoomChange(parseFloat(e.target.value))}
                        className="w-24"
                    />
                    <button onClick={() => props.onZoomChange('in')} title="Zoom In" className="p-1 rounded-md text-gray-300 hover:bg-gray-700"><ZoomInIcon /></button>
                </div>
                 <button
                    onClick={props.onSummarize}
                    title="Summarize with AI"
                    className="p-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <SummarizeIcon />
                    <span className="hidden md:inline">Summarize</span>
                </button>
                 <button onClick={props.onClose} title="Close PDF" className="p-2 rounded-md text-gray-300 hover:bg-gray-700 md:hidden">
                    <CloseIcon />
                 </button>
            </div>
          </header>
    )
}

export default Header;