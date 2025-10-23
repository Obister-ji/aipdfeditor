import React, { useEffect, useRef } from 'react';

interface SidebarProps {
  pages: any[];
  currentPage: number;
  onPageSelect: (page: number) => void;
  isOpen: boolean;
}

const PageThumbnail: React.FC<{ page: any; isSelected: boolean; onClick: () => void; pageNumber: number }> = ({ page, isSelected, onClick, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (page && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const desiredWidth = 100;
      const viewport = page.getViewport({ scale: 1 });
      const scale = desiredWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };
      page.render(renderContext);
    }
  }, [page]);

  return (
    <div onClick={onClick} className={`cursor-pointer p-2 rounded-lg transition-all ${isSelected ? 'bg-cyan-600' : 'hover:bg-gray-600'}`}>
        <canvas ref={canvasRef} className="rounded-md shadow-lg" />
        <p className={`text-center text-xs mt-1 ${isSelected ? 'font-bold text-white' : 'text-gray-300'}`}>{pageNumber}</p>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ pages, currentPage, onPageSelect, isOpen }) => {
  // Added error handling for empty pages array
  if (!pages || pages.length === 0) {
    return (
      <div className="w-40 bg-gray-900 p-2 flex items-center justify-center text-gray-300">
        No pages available.
      </div>
    );
  }

  return (
    <div className={ `
        w-40 bg-gray-900 p-2 overflow-y-auto flex-shrink-0 
        transition-transform duration-300 ease-in-out
        fixed md:static h-full md:h-auto z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!isOpen && 'hidden md:flex'}
    `}>
        {isOpen && <div className="space-y-2">
            {pages.map((page, index) => (
                <PageThumbnail
                key={`page-${index}`}
                page={page}
                pageNumber={index + 1}
                isSelected={currentPage === index + 1}
                onClick={() => onPageSelect(index + 1)}
                />
            ))}
      </div>}
    </div>
  );
};

export default Sidebar;
