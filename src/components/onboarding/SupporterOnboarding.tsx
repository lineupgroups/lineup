import React, { useState } from 'react';
import { X, Heart, Users, Star, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface SupporterOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function SupporterOnboarding({ isOpen, onClose, onComplete }: SupporterOnboardingProps) {
  const { user, switchMode } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const interests = [
    { id: 'tech', label: 'Technology', icon: '💻', description: 'Apps, gadgets, and innovation' },
    { id: 'education', label: 'Education', icon: '📚', description: 'Learning and skill development' },
    { id: 'art', label: 'Art & Design', icon: '🎨', description: 'Creative projects and artwork' },
    { id: 'social', label: 'Social Impact', icon: '🌍', description: 'Making the world better' },
    { id: 'health', label: 'Health & Wellness', icon: '💪', description: 'Fitness and healthcare' },
    { id: 'environment', label: 'Environment', icon: '🌱', description: 'Sustainability and green tech' },
    { id: 'food', label: 'Food & Beverage', icon: '🍽️', description: 'Culinary innovations' },
    { id: 'games', label: 'Games & Entertainment', icon: '🎮', description: 'Gaming and fun projects' },
  ];

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsCompleting(true);
    try {
      // Save user interests and mark supporter onboarding as complete
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        interests: selectedInterests,
        supporterOnboardingComplete: true,
        profileCompletionScore: 75, // Increase completion score
        onboardingStep: 2,
        updatedAt: serverTimestamp()
      });

      toast.success('Welcome to Lineup! 🎉');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBecomeCreator = async () => {
    await switchMode('creator');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome to Lineup!</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Let's personalize your experience</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6">
          {currentStep === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Discover Amazing Projects</h3>
              <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                You're joining a community of supporters who help innovative creators bring their ideas to life. 
                Explore projects, back the ones you love, and be part of something amazing!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Discover</h4>
                  <p className="text-sm text-gray-600">Find projects that inspire you</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Support</h4>
                  <p className="text-sm text-gray-600">Back projects you believe in</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Connect</h4>
                  <p className="text-sm text-gray-600">Join a community of supporters</p>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
                <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">What interests you?</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Select categories you're interested in to see personalized project recommendations
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedInterests.includes(interest.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{interest.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{interest.label}</h4>
                        <p className="text-sm text-gray-600">{interest.description}</p>
                      </div>
                      {selectedInterests.includes(interest.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={selectedInterests.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">You're all set!</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Welcome to the Lineup community! You can now discover and support amazing projects. 
                Ready to start exploring?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-900">Have an idea of your own?</h4>
                </div>
                <p className="text-blue-700 mb-4">
                  You can switch to Creator mode anytime to start your own project and get funding from supporters like you!
                </p>
                <button
                  onClick={handleBecomeCreator}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Switch to Creator Mode
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isCompleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Start Exploring
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
