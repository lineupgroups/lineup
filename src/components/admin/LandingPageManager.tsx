import React, { useState } from 'react';
import { Settings, FileText, MessageSquare, BarChart3, Activity, Save, Eye, EyeOff } from 'lucide-react';
import SuccessStoriesManager from './landingPage/SuccessStoriesManager';
import TestimonialsManager from './landingPage/TestimonialsManager';
import PlatformSettingsManager from './landingPage/PlatformSettingsManager';
import PlatformStatsManager from './landingPage/PlatformStatsManager';
import FAQManager from './landingPage/FAQManager';

type TabType = 'settings' | 'success-stories' | 'testimonials' | 'stats' | 'faq';

export default function LandingPageManager() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  const tabs = [
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, description: 'Toggle features on/off' },
    { id: 'success-stories' as TabType, label: 'Success Stories', icon: FileText, description: 'Manage success stories' },
    { id: 'testimonials' as TabType, label: 'Testimonials', icon: MessageSquare, description: 'Manage testimonials' },
    { id: 'stats' as TabType, label: 'Statistics', icon: BarChart3, description: 'Platform stats control' },
    { id: 'faq' as TabType, label: 'FAQ', icon: Activity, description: 'Manage FAQ items' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Landing Page Manager
          </h1>
          <p className="text-gray-600">
            Manage all landing page content and settings from one place
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-max px-6 py-4 flex flex-col items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{tab.label}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'settings' && <PlatformSettingsManager />}
          {activeTab === 'success-stories' && <SuccessStoriesManager />}
          {activeTab === 'testimonials' && <TestimonialsManager />}
          {activeTab === 'stats' && <PlatformStatsManager />}
          {activeTab === 'faq' && <FAQManager />}
        </div>
      </div>
    </div>
  );
}

