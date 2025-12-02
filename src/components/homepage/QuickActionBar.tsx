import React, { useState } from 'react';
import { TrendingUp, MapPin, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActionBar() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('');

  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
    { id: 'nearme', label: 'Near Me', icon: MapPin, color: 'from-blue-500 to-cyan-500' },
    { id: 'almost', label: 'Almost Funded', icon: Target, color: 'from-green-500 to-emerald-500' },
    { id: 'fresh', label: 'Fresh Launches', icon: Sparkles, color: 'from-yellow-500 to-orange-500' }
  ];

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);
    navigate(`/?filter=${filterId}`);
  };

  return (
    <div className="bg-white border-y border-gray-200 sticky top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${filter.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


