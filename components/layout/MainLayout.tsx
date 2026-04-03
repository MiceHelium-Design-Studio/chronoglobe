'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import dynamic from 'next/dynamic';
import NewsList from '../news/NewsList';
import FilterPanel from '../filters/FilterPanel';

const DynamicMap = dynamic(() => import('../map/Map'), { ssr: false });

interface MainLayoutProps {
  children?: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden fixed top-4 right-4 z-30">
        <button
          onClick={() => setFiltersOpen(true)}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg"
        >
          ⚙️
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-screen">
        <div className="md:w-1/2 h-1/2 md:h-full">
          <DynamicMap className="h-full w-full" />
        </div>

        <div className="md:w-1/2 h-1/2 md:h-full overflow-hidden">
          <NewsList className="h-full overflow-y-auto" />
        </div>
      </div>

      <FilterPanel isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

      {children}
    </div>
  );
}