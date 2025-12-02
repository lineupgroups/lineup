import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { INDIAN_STATES, getCitiesByState, LocationData } from '../../data/locations';

interface LocationSelectorProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  className?: string;
  required?: boolean;
  error?: string;
}

export default function LocationSelector({ 
  value, 
  onChange, 
  className = '', 
  required = false,
  error 
}: LocationSelectorProps) {
  const [selectedState, setSelectedState] = useState(value.state || '');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [citySearch, setCitySearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Available cities based on selected state
  const availableCities = selectedState ? getCitiesByState(selectedState) : [];
  const filteredCities = availableCities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  useEffect(() => {
    // Update parent when location changes
    onChange({
      country: 'India', // Fixed to India as per requirement
      state: selectedState,
      city: selectedCity
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedCity]);

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedCity(''); // Reset city when state changes
    setCitySearch('');
    setShowStateDropdown(false);
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setCitySearch(cityName);
    setShowCityDropdown(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country (Fixed to India) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country
        </label>
        <div className="relative">
          <input
            type="text"
            value="India"
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* State Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStateDropdown(!showStateDropdown)}
            className={`w-full px-4 py-3 border rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? 'border-red-300' : 'border-gray-300'
            } ${selectedState ? 'text-gray-900' : 'text-gray-500'}`}
          >
            {selectedState || 'Select your state'}
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          </button>
          
          {showStateDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {INDIAN_STATES.map((state) => (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => handleStateSelect(state.name)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {state.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* City Selector */}
      {selectedState && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityDropdown(true);
                if (!e.target.value) {
                  setSelectedCity('');
                }
              }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Search for your city"
              className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            
            {showCityDropdown && filteredCities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.slice(0, 10).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    {city}
                  </button>
                ))}
                {filteredCities.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 border-t">
                    ... and {filteredCities.length - 10} more cities
                  </div>
                )}
              </div>
            )}
            
            {showCityDropdown && citySearch && filteredCities.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="px-4 py-3 text-gray-500 text-center">
                  No cities found. You can still type your city name.
                </div>
              </div>
            )}
          </div>
          
          {citySearch && !availableCities.includes(citySearch) && (
            <p className="text-xs text-blue-600 mt-1">
              Custom city: "{citySearch}" will be saved
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Location Preview */}
      {(selectedState || selectedCity) && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {[selectedCity, selectedState, 'India'].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showStateDropdown || showCityDropdown) && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setShowStateDropdown(false);
            setShowCityDropdown(false);
          }}
        />
      )}
    </div>
  );
}

