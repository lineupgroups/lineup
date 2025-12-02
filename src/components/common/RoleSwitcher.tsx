import React, { useState } from 'react';
import { ChevronDown, Users, Rocket, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserMode } from '../../types/auth';

interface RoleSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export default function RoleSwitcher({ className = '', showLabel = true }: RoleSwitcherProps) {
  const { currentMode, switchMode, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ CRITICAL: Only show role switcher if user is KYC verified
  // This prevents non-verified users from accessing creator mode
  if (!user?.isCreatorVerified) {
    return null;
  }

  const handleModeSwitch = async (mode: UserMode) => {
    if (mode === currentMode) return;

    setIsLoading(true);
    try {
      await switchMode(mode);
      setIsOpen(false);

      // Navigate to appropriate page based on mode
      if (mode === 'creator') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to switch mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modes = [
    {
      id: 'supporter' as UserMode,
      label: 'Supporter',
      description: 'Discover and support amazing projects',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      id: 'creator' as UserMode,
      label: 'Creator',
      description: 'Create and manage your projects',
      icon: Rocket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    }
  ];

  const currentModeConfig = modes.find(mode => mode.id === currentMode);
  const CurrentIcon = currentModeConfig?.icon || Users;

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg border transition-all duration-200 ${currentMode === 'supporter'
          ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <CurrentIcon className="w-4 h-4" />
        {showLabel && (
          <>
            <span className="text-xs sm:text-sm font-medium">{currentModeConfig?.label}</span>
            <ChevronDown className={`w-3 sm:w-4 h-3 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-gray-600">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Switch Mode</span>
              </div>
            </div>

            <div className="p-2">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.id === currentMode;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSwitch(mode.id)}
                    disabled={isLoading || isActive}
                    className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${isActive
                      ? `${mode.bgColor} ${mode.color} cursor-default`
                      : `hover:bg-gray-50 text-gray-700 ${mode.hoverColor}`
                      } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? mode.bgColor : 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? mode.color : 'text-gray-600'}`} />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{mode.label}</span>
                        {isActive && (
                          <span className="px-2 py-1 text-xs font-medium bg-white/80 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{mode.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Switch between modes anytime to access different features and tools.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
