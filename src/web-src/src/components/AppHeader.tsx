
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import sealightsLogo from '@/assets/sealight_logo.png';

const AppHeader: React.FC = () => {
  return (
    <header className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={sealightsLogo}
            alt="Sealights Logo"
            className="h-12"
            onError={(e) => {
              console.log('Logo failed to load');
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = "h-8 bg-gray-200 px-3 flex items-center rounded";
              fallback.innerHTML = '<span class="text-sm font-semibold">Sealights</span>';
              e.currentTarget.parentNode?.appendChild(fallback);
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
