import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, RefreshCw, Zap } from 'lucide-react';
import { usePlatformSettings } from '../../../hooks/useLandingPage';
import { updatePlatformSettings } from '../../../lib/landingPage';
import { initializeLandingPageDocuments } from '../../../lib/initializeLandingPage';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PlatformSettingsManager() {
  const { user } = useAuth();
  const { settings: fetchedSettings, loading, refresh } = usePlatformSettings();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    showSuccessStories: false,
    showStatistics: false,
    showTestimonials: false,
    showLiveTicker: false,
    statisticsMode: 'manual' as 'auto' | 'manual',
    liveTickerSpeed: 5,
    liveTickerLimit: 20,
    showTrustBadges: true
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings({
        showSuccessStories: fetchedSettings.showSuccessStories,
        showStatistics: fetchedSettings.showStatistics,
        showTestimonials: fetchedSettings.showTestimonials,
        showLiveTicker: fetchedSettings.showLiveTicker,
        statisticsMode: fetchedSettings.statisticsMode,
        liveTickerSpeed: fetchedSettings.liveTickerSpeed,
        liveTickerLimit: fetchedSettings.liveTickerLimit,
        showTrustBadges: fetchedSettings.showTrustBadges
      });
    }
  }, [fetchedSettings]);

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save settings');
      return;
    }

    try {
      setIsSaving(true);
      await updatePlatformSettings(settings, user.uid);
      await refresh();
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitialize = async () => {
    if (!confirm('This will create default documents for landing page. Continue?')) {
      return;
    }

    try {
      setIsSaving(true);
      await initializeLandingPageDocuments();
      await refresh();
      toast.success('Landing page initialized successfully!');
      window.location.reload(); // Reload to fetch new data
    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Failed to initialize. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description 
  }: { 
    enabled: boolean; 
    onChange: (value: boolean) => void; 
    label: string; 
    description: string;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 last:border-0">
      <div className="flex-1 pr-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          enabled ? 'bg-orange-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Landing Page Settings</h2>
            <p className="text-gray-600 mt-1">Control which features appear on the landing page</p>
          </div>
          <div className="flex gap-3">
            {!fetchedSettings && (
              <button
                onClick={handleInitialize}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                <Zap className="w-5 h-5" />
                Initialize
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Initialization Alert */}
        {!fetchedSettings && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">First Time Setup Required</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Click the <strong>"Initialize"</strong> button to create the required Firestore documents. 
                  This only needs to be done once.
                </p>
                <p className="text-xs text-yellow-600">
                  This will create: platform settings document and statistics document with default values.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Main Sections */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Sections</h3>
          
          <ToggleSwitch
            enabled={settings.showSuccessStories}
            onChange={(value) => setSettings({ ...settings, showSuccessStories: value })}
            label="Success Stories"
            description="Display the success stories carousel on the landing page"
          />

          <ToggleSwitch
            enabled={settings.showStatistics}
            onChange={(value) => setSettings({ ...settings, showStatistics: value })}
            label="Platform Statistics"
            description="Show total projects, amount raised, and success rate"
          />

          <ToggleSwitch
            enabled={settings.showTestimonials}
            onChange={(value) => setSettings({ ...settings, showTestimonials: value })}
            label="Testimonials"
            description="Display testimonials from creators and supporters"
          />

          <ToggleSwitch
            enabled={settings.showLiveTicker}
            onChange={(value) => setSettings({ ...settings, showLiveTicker: value })}
            label="Live Activity Ticker"
            description="Show recent donations and milestones in real-time"
          />

          <ToggleSwitch
            enabled={settings.showTrustBadges}
            onChange={(value) => setSettings({ ...settings, showTrustBadges: value })}
            label="Trust Badges"
            description="Display security and verification badges"
          />
        </div>

        {/* Statistics Settings */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statistics Mode
              </label>
              <select
                value={settings.statisticsMode}
                onChange={(e) => setSettings({ ...settings, statisticsMode: e.target.value as 'auto' | 'manual' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="manual">Manual (Use custom values)</option>
                <option value="auto">Auto (Calculate from database)</option>
              </select>
              <p className="mt-1 text-sm text-gray-600">
                {settings.statisticsMode === 'manual' 
                  ? 'Use custom values set in the Statistics tab (recommended for launch)'
                  : 'Automatically calculate statistics from actual data'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Live Ticker Settings */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Ticker Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticker Speed (seconds per item)
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.liveTickerSpeed}
                onChange={(e) => setSettings({ ...settings, liveTickerSpeed: parseInt(e.target.value) || 5 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Recent Activities
              </label>
              <input
                type="number"
                min="10"
                max="50"
                value={settings.liveTickerLimit}
                onChange={(e) => setSettings({ ...settings, liveTickerLimit: parseInt(e.target.value) || 20 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Preview Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Preview Changes</h4>
              <p className="text-sm text-blue-700 mb-3">
                Visit the landing page to see your changes in action
              </p>
              <a
                href="/welcome"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Landing Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

