import React from 'react';

interface FontSizeIconProps {
    direction: 'up' | 'down';
}
export const FontSizeIcon: React.FC<FontSizeIconProps> = ({ direction }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        {direction === 'up' && <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />}
        {direction === 'down' && <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />}
        <path d="M5,17L9.5,12L14,17H5M5,7H14L9.5,12L5,7Z" opacity="0.3" />
    </svg>
);
