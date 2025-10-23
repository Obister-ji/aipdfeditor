import React from 'react';

interface TooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ title, description, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none left-1/2 -translate-x-1/2 z-50">
        <p className="font-bold">{title}</p>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
};
