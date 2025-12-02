import React, { useState } from 'react';
import { X, User, ArrowRight, CheckCircle } from 'lucide-react';
import { OnboardingProgress, CompletionLevel, getOnboardingMessage } from '../../types/onboarding';

interface OnboardingBannerProps {
  progress: OnboardingProgress;
  onComplete: () => void;
  onDismiss: () => void;
  className?: string;
}

export default function OnboardingBanner({ 
  progress, 
  onComplete, 
  onDismiss, 
  className = '' 
}: OnboardingBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || progress.level === CompletionLevel.COMPLETE) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  const getBannerColor = () => {
    switch (progress.level) {
      case CompletionLevel.INCOMPLETE:
        return 'bg-red-50 border-red-200 text-red-800';
      case CompletionLevel.ESSENTIAL:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case CompletionLevel.ENHANCED:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getProgressColor = () => {
    switch (progress.level) {
      case CompletionLevel.INCOMPLETE:
        return 'bg-red-500';
      case CompletionLevel.ESSENTIAL:
        return 'bg-orange-500';
      case CompletionLevel.ENHANCED:
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  const getActionText = () => {
    switch (progress.level) {
      case CompletionLevel.INCOMPLETE:
        return 'Complete Now';
      case CompletionLevel.ESSENTIAL:
        return 'Enhance Profile';
      case CompletionLevel.ENHANCED:
        return 'Finish Profile';
      default:
        return 'View Profile';
    }
  };

  return (
    <div className={`${getBannerColor()} border-l-4 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0">
            {progress.level === CompletionLevel.COMPLETE ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <p className="text-sm font-medium">
                {getOnboardingMessage(progress)}
              </p>
              
              {/* Progress Bar */}
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
              
              <span className="text-sm font-semibold">
                {progress.percentage}%
              </span>
            </div>

            {/* Next Recommendations */}
            {progress.nextRecommendations.length > 0 && (
              <p className="text-xs mt-1 opacity-75">
                Next: {progress.nextRecommendations.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {progress.level !== CompletionLevel.COMPLETE && (
            <button
              onClick={onComplete}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              {getActionText()}
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          )}
          
          {progress.canSkipOnboarding && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
interface CompactOnboardingIndicatorProps {
  progress: OnboardingProgress;
  onClick: () => void;
  className?: string;
}

export function CompactOnboardingIndicator({ 
  progress, 
  onClick, 
  className = '' 
}: CompactOnboardingIndicatorProps) {
  if (progress.level === CompletionLevel.COMPLETE) {
    return null;
  }

  const getColor = () => {
    switch (progress.level) {
      case CompletionLevel.INCOMPLETE:
        return 'text-red-600 bg-red-100 hover:bg-red-200';
      case CompletionLevel.ESSENTIAL:
        return 'text-orange-600 bg-orange-100 hover:bg-orange-200';
      case CompletionLevel.ENHANCED:
        return 'text-blue-600 bg-blue-100 hover:bg-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 hover:bg-gray-200';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${getColor()} ${className}`}
    >
      <User className="w-4 h-4 mr-1.5" />
      Profile {progress.percentage}%
      <ArrowRight className="w-3 h-3 ml-1.5" />
    </button>
  );
}

