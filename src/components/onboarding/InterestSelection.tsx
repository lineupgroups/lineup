import React, { useState, useEffect } from 'react';
import { X, ArrowRight, MapPin, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { initializeUserPreferences, updateUserLocation, setUserFavoriteCategories } from '../../lib/behaviorTracking';
import { categories } from '../../config/categories';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface InterestSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function InterestSelection({ isOpen, onClose, onComplete }: InterestSelectionProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  // Load user's existing location from their profile
  useEffect(() => {
    const loadUserLocation = async () => {
      if (!user || !isOpen) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          console.log('Loading user location from profile:', userData);
          
          // Check locationData object first (from account setup)
          if (userData.locationData?.city && userData.locationData?.state) {
            setCity(userData.locationData.city);
            setState(userData.locationData.state);
            setHasLocation(true);
            console.log('Loaded location from locationData:', userData.locationData);
          }
          // Fallback to flat fields
          else if (userData.city && userData.state) {
            setCity(userData.city);
            setState(userData.state);
            setHasLocation(true);
            console.log('Loaded location from flat fields:', { city: userData.city, state: userData.state });
          } else {
            console.log('No location found in user profile');
          }
        }
      } catch (error) {
        console.error('Error loading user location:', error);
      }
    };

    loadUserLocation();
  }, [user, isOpen]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedCategories.length >= 3) {
      // Skip location step if user already has location
      if (hasLocation) {
        handleComplete();
      } else {
        setStep(2);
      }
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      setSaving(true);

      console.log('💾 SAVING PREFERENCES...', {
        userId: user.uid,
        location: { city, state },
        categories: selectedCategories,
        hasLocation
      });

      // Initialize preferences with ALL data at once
      await initializeUserPreferences(user.uid, {
        location: city && state ? { city, state } : undefined,
        favoriteCategories: selectedCategories
      });
      console.log('✅ Initial preferences created');

      // Update location - ALWAYS update if we have city and state
      if (city && state) {
        await updateUserLocation(user.uid, { city, state });
        console.log('✅ Location updated:', { city, state });
      }

      // Update categories - ALWAYS update
      await setUserFavoriteCategories(user.uid, selectedCategories);
      console.log('✅ Categories updated:', selectedCategories);

      console.log('🔄 Calling onComplete to refresh preferences...');
      
      // Call onComplete callback to refresh data BEFORE closing
      if (onComplete) {
        await onComplete();
      }
      
      console.log('✅ ONBOARDING COMPLETE - closing modal');
      
      // Close modal last
      onClose();
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (user) {
      initializeUserPreferences(user.uid);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'What are you interested in?' : 'Where are you from?'}
            </h2>
            <p className="text-gray-600 mt-1">
              {step === 1 
                ? 'Select at least 3 categories you\'re passionate about' 
                : 'Help us show you projects near you (optional)'}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Step {step} of 2</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Category Selection
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => toggleCategory(category.name)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategories.includes(category.name)
                        ? 'border-orange-500 bg-orange-50 text-orange-700 transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                    }`}
                  >
                    <span className="text-3xl mb-2 block">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected: {selectedCategories.length}/5</strong>
                  <br />
                  {selectedCategories.length < 3 && 'Select at least 3 categories to continue'}
                </p>
              </div>
            </div>
          ) : (
            // Step 2: Location
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Your Location</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., Maharashtra"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Why we need this:</strong>
                  <br />
                  We'll show you projects from your area and help you support local creators!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleSkip}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 font-semibold rounded-lg transition-colors"
          >
            Skip for Now
          </button>

          {step === 1 ? (
            <button
              onClick={handleNext}
              disabled={selectedCategories.length < 3 || saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? (
                'Saving...'
              ) : hasLocation ? (
                <>
                  <Heart className="w-5 h-5" />
                  Get Started!
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              <Heart className="w-5 h-5" />
              {saving ? 'Saving...' : 'Get Started!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


