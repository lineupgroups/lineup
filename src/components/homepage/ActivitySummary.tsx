import React from 'react';
import { Heart, Eye, TrendingUp, MapPin } from 'lucide-react';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';
import { useInteractionHistory } from '../../hooks/useBehaviorTracking';

export default function ActivitySummary() {
  const { preferences, loading } = useBehaviorTracking();
  const { interactions } = useInteractionHistory(50);

  if (loading || !preferences) {
    return null;
  }

  const likeCount = interactions.filter(i => i.type === 'like').length;
  const followCount = interactions.filter(i => i.type === 'follow').length;
  const viewsThisWeek = preferences.totalProjectsViewed || 0; // Simplified

  const stats = [
    {
      icon: Eye,
      value: viewsThisWeek,
      label: 'Projects Viewed',
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      icon: TrendingUp,
      value: preferences.totalProjectsSupported || 0,
      label: 'Projects Supported',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      icon: Heart,
      value: likeCount,
      label: 'Projects Liked',
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      icon: MapPin,
      value: preferences.preferredLocation.city ? '📍' : '-',
      label: preferences.preferredLocation.city || 'Set Location',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      isLocation: true
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Your Activity</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`inline-flex p-3 rounded-xl ${stat.bg} mb-2`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.isLocation ? stat.value : stat.value}
              </div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Personality Badge */}
      {preferences.personalityType && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
            preferences.personalityType === 'supporter' ? 'bg-green-100 text-green-700' :
            preferences.personalityType === 'explorer' ? 'bg-blue-100 text-blue-700' :
            preferences.personalityType === 'browser' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {preferences.personalityType === 'supporter' ? '🌟 Active Supporter' :
             preferences.personalityType === 'explorer' ? '🔍 Explorer' :
             preferences.personalityType === 'browser' ? '👀 Browser' :
             '✨ Getting Started'}
          </span>
        </div>
      )}
    </div>
  );
}



