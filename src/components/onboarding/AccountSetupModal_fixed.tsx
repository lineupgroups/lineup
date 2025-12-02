import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, User, Globe, Camera, CheckCircle, AlertCircle, Loader2, Edit3, ArrowRight, SkipForward } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsernameValidation } from '../../hooks/useUsernameValidation';
import { reserveUsername } from '../../lib/username';
import { updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EnhancedOnboardingData, OnboardingProgress, CompletionLevel, calculateOnboardingProgress, ONBOARDING_STEPS_CONFIG } from '../../types/onboarding';
import { LocationData } from '../../data/locations';
import LocationSelector from '../common/LocationSelector';
import ImageEditor from '../common/ImageEditor';
import toast from 'react-hot-toast';

interface AccountSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userData: EnhancedOnboardingData) => void;
  initialProgress?: OnboardingProgress;
}

// Use the new flexible step configuration
const ONBOARDING_STEPS = ONBOARDING_STEPS_CONFIG;

export default function AccountSetupModal({ isOpen, onClose, onComplete }: AccountSetupModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserEditedDisplayName, setHasUserEditedDisplayName] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  
  // Form data with enhanced structure
  const [formData, setFormData] = useState<EnhancedOnboardingData>({
    displayName: user?.displayName || '',
    username: '',
    bio: '',
    profileImage: user?.photoURL || '',
    location: {
      country: 'India',
      state: '',
      city: ''
    },
    website: '',
    socialLinks: {}
  });
  
  // Username validation
  const { validation, isChecking, validateUsernameInput } = useUsernameValidation();
  
  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && user) {
      // Get user data from Firestore
      const getUserData = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Use existing data from Firestore if available
            const initialData: EnhancedOnboardingData = {
              displayName: userData.displayName || user?.displayName || '',
              username: userData.username || '',
              bio: userData.bio || '',
              profileImage: userData.profileImage || user?.photoURL || '',
              location: userData.locationData || {
                country: 'India',
                state: '',
                city: ''
              },
              website: userData.website || '',
              socialLinks: userData.socialLinks || {},
              onboardingStep: userData.onboardingStep || 1
            };
            
            setFormData(initialData);
            setHasUserEditedDisplayName(false);
            
            // Set the current step based on saved onboarding step or progress
            const savedStep = userData.onboardingStep || 1;
            setCurrentStep(savedStep);
            
            // Calculate initial progress
            const initialProgress = calculateOnboardingProgress(initialData);
            setProgress(initialProgress);
          } else {
            // Fallback to basic data if no Firestore document
            const initialData: EnhancedOnboardingData = {
              displayName: user?.displayName || '',
              username: '',
              bio: '',
              profileImage: user?.photoURL || '',
              location: {
                country: 'India',
                state: '',
                city: ''
              },
              website: '',
              socialLinks: {},
              onboardingStep: 1
            };
            
            setFormData(initialData);
            setHasUserEditedDisplayName(false);
            setCurrentStep(1);
            
            // Calculate initial progress
            const initialProgress = calculateOnboardingProgress(initialData);
            setProgress(initialProgress);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to basic data
          const initialData: EnhancedOnboardingData = {
            displayName: user?.displayName || '',
            username: '',
            bio: '',
            profileImage: user?.photoURL || '',
            location: {
              country: 'India',
              state: '',
              city: ''
            },
            website: '',
            socialLinks: {},
            onboardingStep: 1
          };
          
          setFormData(initialData);
          setHasUserEditedDisplayName(false);
          setCurrentStep(1);
          
          // Calculate initial progress
          const initialProgress = calculateOnboardingProgress(initialData);
          setProgress(initialProgress);
        }
      };
      
      getUserData();
    }
  }, [isOpen, user]);

  // Update progress when form data changes
  useEffect(() => {
    const newProgress = calculateOnboardingProgress(formData);
    setProgress(newProgress);
  }, [formData]);

  // Handle escape key and backdrop click
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && progress?.canSkipOnboarding && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, progress?.canSkipOnboarding, isSubmitting, onClose]);

  // Initialize display name from Firebase user (only once, not on every change)
  useEffect(() => {
    if (user?.displayName && !formData.displayName && !hasUserEditedDisplayName) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName
      }));
    }
  }, [user?.displayName, formData.displayName, hasUserEditedDisplayName]);

  const handleInputChange = (field: keyof EnhancedOnboardingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark that user has edited the display name
    if (field === 'displayName') {
      setHasUserEditedDisplayName(true);
    }

    // Trigger username validation for username field
    if (field === 'username') {
      validateUsernameInput(value);
    }
  };

  const handleLocationChange = useCallback((location: LocationData) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  }, []);

  const handleSocialLinkChange = (platform: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: url || undefined // Remove empty strings
      }
    }));
  };

  const handleImageSelect = (file: File) => {
    // Validate file
    if (!file) {
      toast.error('No file selected');
      return;
    }

    // Check file size (5MB limit for original upload)
    if (file.size > 5000000) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please use JPG, PNG, or WebP');
      return;
    }

    // Open image editor
    setSelectedImageFile(file);
    setShowImageEditor(true);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageSelect(imageFile);
    } else if (files.length > 0) {
      toast.error('Please drop an image file (JPG, PNG, or WebP)');
    }
  };

  const handleImageEditorSave = async (croppedImageUrl: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Convert blob URL to File
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });

      // Create a profile picture upload with real progress tracking
      const uploadProfilePicture = async (file: File): Promise<{
        secure_url: string;
        public_id: string;
        width: number;
        height: number;
      }> => {
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'lineup_unsigned');
          formData.append('folder', 'lineup-users');
          formData.append('tags', 'profile,onboarding');
          
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              setUploadProgress(Math.round(percentComplete));
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id,
                  width: result.width,
                  height: result.height
                });
              } catch (_e) {
                reject(new Error('Invalid response format'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.error?.message || `Upload failed: ${xhr.statusText}`));
              } catch (_e) {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
              }
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed: Network error'));
          });
          
          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload failed: Request timeout'));
          });
          
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`);
          xhr.timeout = 30000; // 30 second timeout
          xhr.send(formData);
        });
      };
      
      const result = await uploadProfilePicture(file);
      
      if (result) {
        setFormData(prev => ({
          ...prev,
          profileImage: result.secure_url
        }));
        toast.success('Profile photo uploaded!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000); // Reset progress after a delay
      setShowImageEditor(false);
      setSelectedImageFile(null);
    }
  };

  const canProceedToStep = (step: number): boolean => {
    if (!progress) return false;

    switch (step) {
      case 1: // Essential Info
        return formData.displayName.trim().length >= 2 && 
               formData.username.trim().length >= 3 &&
               !!validation?.isValid && 
               !!validation?.isAvailable &&
               formData.location.state.trim().length > 0 &&
               formData.location.city.trim().length > 0;
      case 2: // Enhanced Info (optional)
        return true; // Can skip this step
      case 3: // Complete Info (optional)
        return true; // Can skip this step
      default:
        return false;
    }
  };

  const canSkipOnboarding = (): boolean => {
    return progress ? progress.canSkipOnboarding : false;
  };

  const getStepStatus = (stepId: number) => {
    const step = ONBOARDING_STEPS.find(s => s.id === stepId);
    if (!step) return 'incomplete';

    const hasRequiredFields = step.fields.every(field => {
      if (field === 'location') {
        return formData.location.state && formData.location.city;
      }
      if (field === 'socialLinks') {
        return formData.socialLinks && Object.keys(formData.socialLinks).length > 0;
      }
      return formData[field as keyof EnhancedOnboardingData];
    });

    if (hasRequiredFields) return 'complete';
    if (currentStep > stepId) return 'skipped';
    return 'incomplete';
  };

  const handleNext = () => {
    if (canProceedToStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSkipToApp = async () => {
    if (!canSkipOnboarding()) {
      toast.error('Please complete essential information first');
      return;
    }

    try {
      // Save current progress
      await handleSaveProgress();
      toast.success('Progress saved! You can complete your profile anytime.');
      onComplete(formData);
      onClose();
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    }
  };

  const handleSaveProgress = async () => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const currentProgress = calculateOnboardingProgress(formData);
    
    await updateDoc(userRef, {
      displayName: formData.displayName || user.displayName,
      username: formData.username ? formData.username.toLowerCase() : '',
      bio: formData.bio || '',
      profileImage: formData.profileImage || user.photoURL || '',
      location: `${formData.location.city}, ${formData.location.state}, ${formData.location.country}`,
      website: formData.website || '',
      // Enhanced fields
      locationData: formData.location,
      socialLinks: formData.socialLinks || {},
      isProfileComplete: currentProgress.level === CompletionLevel.COMPLETE,
      profileCompletionScore: currentProgress.percentage,
      completionLevel: currentProgress.level,
      // Save the highest step reached rather than current step
      onboardingStep: Math.max(currentStep, formData.onboardingStep || 1),
      lastOnboardingPrompt: new Date(),
      updatedAt: Timestamp.now()
    });

    // Reserve username if provided
    if (formData.username && validation?.isAvailable) {
      await reserveUsername(user.uid, formData.username);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await handleSaveProgress();
      
      const currentProgress = calculateOnboardingProgress(formData);
      const completionMessage = currentProgress.level === CompletionLevel.COMPLETE 
        ? 'Profile setup complete! 🎉' 
        : `Profile saved! You're ${currentProgress.percentage}% complete.`;
      
      toast.success(completionMessage);
      onComplete(formData);
      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const currentStepConfig = ONBOARDING_STEPS.find(s => s.id === currentStep);
    
    switch (currentStep) {
      case 1: // Essential Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentStepConfig?.title}</h3>
              <p className="text-gray-600">{currentStepConfig?.description}</p>
              {progress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{progress.percentage}% complete</p>
                </div>
              )}
            </div>
            
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">This is how others will see your name</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                  placeholder="yourusername"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validation?.isValid === false ? 'border-red-300' : 
                    validation?.isAvailable === true ? 'border-green-300' : 'border-gray-300'
                  }`}
                  maxLength={30}
                />
                <div className="absolute right-3 top-3">
                  {isChecking && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  {validation?.isAvailable === true && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {validation?.isValid === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              
              {validation?.error && (
                <p className="text-sm text-red-600 mt-1">{validation.error}</p>
              )}
              
              {validation?.isAvailable === true && (
                <p className="text-sm text-green-600 mt-1">✓ Username is available!</p>
              )}
              
              {validation?.suggestions && validation.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleInputChange('username', suggestion)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                3-30 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <LocationSelector
                value={formData.location}
                onChange={handleLocationChange}
                required={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps us connect you with local opportunities
              </p>
            </div>
          </div>
        );

      case 2: // Enhanced Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentStepConfig?.title}</h3>
              <p className="text-gray-600">{currentStepConfig?.description}</p>
              {progress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{progress.percentage}% complete</p>
                </div>
              )}
            </div>
            
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center">
              {/* Drag and Drop Zone */}
              <div 
                className={`relative mb-6 transition-all duration-200 ${
                  isDragOver ? 'scale-105' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-2 transition-all duration-200 ${
                  isDragOver 
                    ? 'border-blue-500 border-dashed bg-blue-50' 
                    : 'border-gray-300'
                }`}>
                  {formData.profileImage ? (
                    <>
                      <img
                        src={formData.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon w-full h-full flex items-center justify-center';
                            fallback.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImageSelect(file);
                          };
                          input.click();
                        }}
                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group"
                        title="Edit photo"
                      >
                        <Edit3 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isDragOver ? (
                        <Upload className="w-8 h-8 text-blue-500" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                
                <label className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-colors ${
                  isDragOver 
                    ? 'bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                    }}
                    className="hidden"
                  />
                </label>
                
                {isDragOver && (
                  <div className="absolute -inset-4 border-2 border-dashed border-blue-500 rounded-full bg-blue-50 bg-opacity-50 flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">Drop image here</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                Click to upload or drag and drop an image
              </p>
              
              {isUploading && (
                <div className="w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-2">Uploading...</p>
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/160 characters</p>
            </div>
          </div>
        );

      case 3: // Complete Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentStepConfig?.title}</h3>
              <p className="text-gray-600">{currentStepConfig?.description}</p>
              {progress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{progress.percentage}% complete</p>
                </div>
              )}
            </div>
            
            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Website (Optional)
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Social Media (Optional)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks?.linkedin || ''}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks?.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks?.instagram || ''}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/yourusername"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks?.github || ''}
                    onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {progress && progress.level === CompletionLevel.COMPLETE && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-800">Profile Complete!</h4>
                <p className="text-sm text-green-600">You've completed your profile setup.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && canSkipOnboarding() && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
            <p className="text-gray-600">Step {currentStep} of {ONBOARDING_STEPS.length}</p>
            {progress && (
              <p className="text-sm text-blue-600 mt-1">
                {progress.percentage}% complete • {progress.level} level
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={!canSkipOnboarding() || isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={canSkipOnboarding() ? "Close" : "Complete essential info first"}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {ONBOARDING_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  step.id < ONBOARDING_STEPS.length ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium border-2 transition-all ${
                    currentStep >= step.id
                      ? step.isRequired 
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {getStepStatus(step.id) === 'complete' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {step.id < ONBOARDING_STEPS.length && (
                  <div
                    className={`flex-1 h-1 mx-1 sm:mx-2 transition-all ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {ONBOARDING_STEPS[currentStep - 1]?.description}
            </p>
            {progress && (
              <span className="text-xs font-medium text-blue-600">
                {progress.level.charAt(0).toUpperCase() + progress.level.slice(1)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-200 gap-3 sm:gap-0">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Back
          </button>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto order-1 sm:order-2">
            {/* Skip Options */}
            {canSkipOnboarding() && currentStep < 3 && (
              <button
                onClick={handleSkipToApp}
                className="w-full sm:w-auto px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip to App
              </button>
            )}

            {/* Main Action Buttons */}
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToStep(currentStep)}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {ONBOARDING_STEPS[currentStep - 1]?.isRequired ? 'Continue' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {canSkipOnboarding() && (
                  <button
                    onClick={handleSkipToApp}
                    className="w-full sm:w-auto px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Save & Continue to App
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Profile
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {showImageEditor && selectedImageFile && (
        <ImageEditor
          isOpen={showImageEditor}
          onClose={() => {
            setShowImageEditor(false);
            setSelectedImageFile(null);
          }}
          onSave={handleImageEditorSave}
          imageFile={selectedImageFile}
          title="Edit Profile Picture"
          aspectRatio={1} // Square aspect ratio for profile pictures
        />
      )}
    </div>
  );
}

