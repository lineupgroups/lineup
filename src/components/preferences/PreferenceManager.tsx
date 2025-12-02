import React, { useState, useEffect } from 'react';
import { X, MapPin, Heart, Trash2, Download, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';
import { 
  updateUserLocation, 
  setUserFavoriteCategories,
  clearUserBehaviorData 
} from '../../lib/behaviorTracking';
import { categories } from '../../config/categories';

interface PreferenceManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferenceManager({ isOpen, onClose }: PreferenceManagerProps) {
  const { user } = useAuth();
  const { preferences, refreshPreferences } = useBehaviorTracking();
  
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (preferences) {
      setCity(preferences.preferredLocation.city || '');
      setState(preferences.preferredLocation.state || '');
      setSelectedCategories(preferences.favoriteCategories || []);
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Save location
      if (city && state) {
        await updateUserLocation(user.uid, { city, state });
      }

      // Save favorite categories
      if (selectedCategories.length > 0) {
        await setUserFavoriteCategories(user.uid, selectedCategories);
      }

      await refreshPreferences();
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;

    try {
      await clearUserBehaviorData(user.uid);
      await refreshPreferences();
      setShowClearConfirm(false);
      alert('Your behavior data has been cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  const handleExportData = () => {
    if (!preferences) return;

    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-preferences.json';
    link.click();
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Location Preferences */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              We'll show you projects near you based on this location.
            </p>
          </div>

          {/* Favorite Categories */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Favorite Categories</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => toggleCategory(category.name)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedCategories.includes(category.name)
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Select categories you're interested in for personalized recommendations.
            </p>
          </div>

          {/* Privacy Controls */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy & Data</h3>
            
            <div className="space-y-3">
              {/* Export Data */}
              <button
                onClick={handleExportData}
                disabled={!preferences}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Export My Data
              </button>

              {/* Clear Data */}
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear My Behavior Data
                </button>
              ) : (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">
                    Are you sure? This will clear all your viewing history, interactions, and reset your personalized recommendations. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearData}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                    >
                      Yes, Clear Data
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 mt-3">
              We respect your privacy. You can export or delete your data at any time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}



