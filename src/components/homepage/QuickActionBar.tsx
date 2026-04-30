import React, { useState } from 'react';
import { TrendingUp, MapPin, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActionBar() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('');

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'nearme', label: 'Near Me', icon: MapPin },
    { id: 'almost', label: 'Almost Funded', icon: Target },
    { id: 'fresh', label: 'Fresh Launches', icon: Sparkles }
  ];

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);
    navigate(`/?filter=${filterId}`);
  };

  return (
    <div className="bg-[#111]/80 backdrop-blur-md border-b border-neutral-800 sticky top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all duration-300 border ${isActive
                    ? 'bg-brand-acid text-brand-black border-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.3)] transform scale-105'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800 hover:text-brand-white hover:border-neutral-700'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-black' : 'text-neutral-500'}`} />
                <span className="text-sm tracking-wide">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
