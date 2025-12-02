import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Calendar, DollarSign, Users, Tag, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createProject, updateProject, getProject } from '../../lib/firestore';
import { Timestamp } from 'firebase/firestore';
import { UploadResult } from '../../lib/cloudinary';
import { CreateProjectData, FirestoreProject } from '../../types/firestore';
import ImageUpload from '../common/ImageUpload';
import { ImageFile } from '../../hooks/useImageUpload';
import toast from 'react-hot-toast';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string; // If provided, we're editing an existing project
  onSuccess?: () => void;
}

interface ProjectFormData {
  title: string;
  tagline: string;
  description: string;
  fullDescription: string;
  category: 'Tech' | 'Education' | 'Art' | 'Social Impact';
  goal: number;
  endDate: string;
  video?: string;
  rewards: {
    title: string;
    description: string;
    amount: number;
    estimatedDelivery: string;
    available: number;
  }[];
}

const categories = [
  { value: 'Tech', label: 'Technology', icon: '💻' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Art', label: 'Art & Design', icon: '🎨' },
  { value: 'Social Impact', label: 'Social Impact', icon: '🤝' }
];

export default function ProjectForm({ isOpen, onClose, projectId, onSuccess }: ProjectFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [projectImages, setProjectImages] = useState<ImageFile[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ProjectFormData>({
    defaultValues: {
      title: '',
      tagline: '',
      description: '',
      fullDescription: '',
      category: 'Tech',
      goal: 0,
      endDate: '',
      video: '',
      rewards: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rewards'
  });

  // Load project data for editing
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId || !user || !isOpen) return;
      
      // Prevent multiple loads
      if (isLoading) return;
    
      try {
        setIsLoading(true);
        setIsEditing(true);
        
        const project = await getProject(projectId);
        if (!project) {
          toast.error('Project not found');
          onClose();
          return;
        }

        // Check if user owns this project
        if (project.creatorId !== user.uid) {
          toast.error('You can only edit your own projects');
          onClose();
          return;
        }

        // Populate form with project data
        reset({
          title: project.title,
          tagline: project.tagline,
          description: project.description,
          fullDescription: project.fullDescription,
          category: project.category,
          goal: project.goal,
          endDate: project.endDate.toDate().toISOString().split('T')[0],
          video: project.video || '',
          rewards: project.rewards || []
        });

        // Set existing image
        if (project.image) {
          setExistingImageUrl(project.image);
        }

      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project data');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    // Only load when modal opens and we have a projectId
    if (isOpen && projectId && user) {
      loadProjectData();
    } else if (isOpen && !projectId) {
      // Reset form for new project
      setIsEditing(false);
      setIsLoading(false);
      setExistingImageUrl('');
    }
  }, [projectId, user, isOpen, reset, onClose, isLoading]);

  // Handle image upload completion
  const handleImageUpload = (uploadResults: UploadResult[]) => {
    if (uploadResults.length > 0) {
      const mainImageUrl = uploadResults[0].secure_url;
      setValue('image' as any, mainImageUrl);
      setExistingImageUrl(mainImageUrl);
      toast.success('Images uploaded successfully!');
    }
  };

  // Handle image upload error
  const handleImageUploadError = (error: Error) => {
    console.error('Image upload failed:', error);
    
    if (error.message.includes('CORS') || error.message.includes('Access to XMLHttpRequest')) {
      toast.error(
        '🔧 Storage setup needed! Please enable Firebase Storage in your Firebase Console first.',
        { duration: 8000 }
      );
    } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      toast.error('🔐 Please sign in to upload images.');
    } else if (error.message.includes('storage/unauthorized')) {
      toast.error('🚫 Storage access denied. Please check your Firebase Storage rules.');
    } else if (error.message.includes('network')) {
      toast.error('🌐 Network error. Please check your internet connection.');
    } else {
      toast.error(`❌ Upload failed: ${error.message}`);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    // Validate that we have at least one image
    const hasNewImages = projectImages.some(img => img.status === 'completed');
    const hasValidImage = isEditing ? (hasNewImages || existingImageUrl) : hasNewImages;
    
    if (!hasValidImage) {
      toast.error('Please upload at least one project image');
      return;
    }

    try {
      setIsLoading(true);

      // Use existing image URL or the first uploaded image
      const imageUrl = existingImageUrl || (hasNewImages ? projectImages.find(img => img.status === 'completed')?.uploadResult?.secure_url : '');
      
      if (!imageUrl) {
        toast.error('No valid image found. Please upload an image.');
        return;
      }

      const projectData: CreateProjectData = {
        title: data.title,
        tagline: data.tagline,
        description: data.description,
        fullDescription: data.fullDescription,
        category: data.category,
        goal: data.goal,
        daysLeft: Math.ceil((new Date(data.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        featured: false,
        status: 'draft',
        // Admin approval system
        approvalStatus: 'pending',
        image: imageUrl,
        creatorId: user.uid,
        endDate: Timestamp.fromDate(new Date(data.endDate)),
        rewards: data.rewards.map((reward, index) => ({
          id: `reward-${index}`,
          title: reward.title,
          description: reward.description,
          amount: reward.amount,
          estimatedDelivery: reward.estimatedDelivery,
          available: reward.available,
          claimed: 0
        })),
        // Only include video if it has a value
        ...(data.video && data.video.trim() ? { video: data.video } : {})
      };


      if (isEditing && projectId) {
        await updateProject(projectId, projectData);
        toast.success('Project updated successfully!');
      } else {
        await createProject(projectData);
        toast.success('Project created successfully!');
      }

      onSuccess?.();
      handleClose();
      
    } catch (error) {
      console.error('Error saving project:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          toast.error('Permission denied. Please check your account settings.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your connection.');
        } else if (error.message.includes('validation')) {
          toast.error('Validation error. Please check your project details.');
        } else {
          toast.error(`Failed to save project: ${error.message}`);
        }
      } else {
        toast.error('Failed to save project. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    setProjectImages([]);
    setExistingImageUrl('');
    setIsEditing(false);
    onClose();
  };

  const addReward = () => {
    // Validate current form data before adding new reward
    const currentValues = watch();
    if (!getStepValidation(currentStep) && currentStep < 4) {
      toast.error('Please complete the current step before adding rewards');
      return;
    }
    
    append({
      title: '',
      description: '',
      amount: 0,
      estimatedDelivery: '',
      available: 0
    });
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getStepValidation = (step: number) => {
    const values = watch();
    switch (step) {
      case 1:
        return values.title && values.tagline && values.category;
      case 2:
        return values.description && values.fullDescription;
      case 3:
        // For editing: either has new images or existing image, for new: must have new images
        const hasImages = isEditing 
          ? (projectImages.some(img => img.status === 'completed') || existingImageUrl)
          : projectImages.some(img => img.status === 'completed');
        return hasImages && values.goal > 0 && values.endDate;
      case 4:
        return true; // Rewards are optional
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Project title and category' },
    { number: 2, title: 'Description', description: 'Tell your story' },
    { number: 3, title: 'Media & Goals', description: 'Images and funding goal' },
    { number: 4, title: 'Rewards', description: 'Optional reward tiers' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-gray-600 mt-1">
              {steps[currentStep - 1].description}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  currentStep >= step.number
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-0.5 w-16 ${
                    currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                    {...register('title', { 
                      required: 'Project title is required',
                      minLength: { value: 5, message: 'Title must be at least 5 characters' },
                      maxLength: { value: 100, message: 'Title must be less than 100 characters' }
                    })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your project title"
                />
                {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline *
                  </label>
                  <input
                    {...register('tagline', { 
                      required: 'Tagline is required',
                      maxLength: { value: 150, message: 'Tagline must be less than 150 characters' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="A brief, compelling description of your project"
                  />
                  {errors.tagline && (
                    <p className="mt-1 text-sm text-red-600">{errors.tagline.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <label
                        key={category.value}
                        className="relative flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-orange-500"
                      >
                        <input
                          {...register('category', { required: 'Please select a category' })}
                          type="radio"
                          value={category.value}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <span className="font-medium text-gray-900">{category.label}</span>
                        </div>
                        <div className="absolute inset-0 border-2 border-transparent rounded-lg peer-checked:border-orange-500 pointer-events-none" />
                      </label>
                    ))}
                  </div>
                {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>
            )}

            {/* Step 2: Description */}
            {currentStep === 2 && (
              <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 50, message: 'Description must be at least 50 characters' },
                      maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                    })}
                    rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Provide a compelling overview of your project (50-500 characters)"
              />
              {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description *
              </label>
              <textarea
                    {...register('fullDescription', { 
                      required: 'Full description is required',
                      minLength: { value: 200, message: 'Full description must be at least 200 characters' }
                    })}
                    rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Tell the complete story of your project. What problem does it solve? How will you execute it? Why should people support you?"
              />
              {errors.fullDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullDescription.message}</p>
              )}
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Video URL (Optional)
                  </label>
                  <input
                    {...register('video')}
                    type="url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Add a YouTube, Vimeo, or other video URL to showcase your project
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Media & Goals */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Project Images *
                  </label>
                  
                  {/* Show existing image if editing */}
                  {isEditing && existingImageUrl && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Current Project Image:</p>
                      <img 
                        src={existingImageUrl} 
                        alt="Current project image" 
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                      <p className="text-xs text-blue-600 mt-1">Upload new images to replace this one</p>
                    </div>
                  )}

                   <ImageUpload
                     maxFiles={5}
                     uploadFolder="lineup-projects"
                     uploadTags={[user?.uid || 'anonymous', projectId || 'new-project']}
                     onImagesChange={setProjectImages}
                     onUploadComplete={handleImageUpload}
                     onUploadError={handleImageUploadError}
                     className="mb-4"
                   />
          </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Goal (₹) *
                </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  {...register('goal', { 
                    required: 'Funding goal is required',
                          min: { value: 10000, message: 'Minimum goal is ₹10,000' },
                          max: { value: 10000000, message: 'Maximum goal is ₹1,00,00,000' }
                  })}
                  type="number"
                        min="10000"
                        max="10000000"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="500000"
                      />
                    </div>
                {errors.goal && (
                      <p className="mt-1 text-sm text-red-600">{errors.goal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign End Date *
                </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  {...register('endDate', { 
                    required: 'End date is required',
                    validate: (value) => {
                            const endDate = new Date(value);
                            const minDate = new Date();
                            minDate.setDate(minDate.getDate() + 7); // Minimum 7 days from now
                            const maxDate = new Date();
                            maxDate.setDate(maxDate.getDate() + 365); // Maximum 1 year from now
                            
                            if (endDate < minDate) {
                              return 'Campaign must run for at least 7 days';
                            }
                            if (endDate > maxDate) {
                              return 'Campaign cannot exceed 1 year';
                            }
                            return true;
                    }
                  })}
                  type="date"
                        min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                    </div>
                {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>
            )}

            {/* Step 4: Rewards */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
              <div>
                    <h3 className="text-lg font-semibold text-gray-900">Reward Tiers</h3>
                    <p className="text-gray-600">Create optional rewards for your supporters</p>
          </div>
              <button
                type="button"
                onClick={addReward}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reward</span>
              </button>
            </div>

            {fields.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards yet</h3>
                    <p className="text-gray-600 mb-4">Rewards help incentivize supporters to contribute more</p>
                <button
                  type="button"
                  onClick={addReward}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Add Your First Reward
                </button>
              </div>
            )}

                <div className="space-y-4">
            {fields.map((field, index) => (
                    <div key={field.id} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Reward Tier {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                          className="p-1 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reward Title
                    </label>
                    <input
                            {...register(`rewards.${index}.title` as const, {
                              required: 'Reward title is required'
                            })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., Early Bird Special"
                    />
                  </div>

                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (₹)
                    </label>
                    <input
                            {...register(`rewards.${index}.amount` as const, {
                        required: 'Amount is required',
                        min: { value: 100, message: 'Minimum amount is ₹100' }
                      })}
                      type="number"
                      min="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="1000"
                    />
                  </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                    </label>
                          <textarea
                            {...register(`rewards.${index}.description` as const, {
                              required: 'Description is required'
                            })}
                            rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Describe what supporters will receive"
                    />
                  </div>

                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimated Delivery
                    </label>
                    <input
                            {...register(`rewards.${index}.estimatedDelivery` as const, {
                              required: 'Estimated delivery is required'
                            })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., March 2025"
                    />
                  </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Available Quantity
                    </label>
                          <input
                            {...register(`rewards.${index}.available` as const, {
                              required: 'Available quantity is required',
                              min: { value: 1, message: 'Must have at least 1 available' }
                            })}
                            type="number"
                            min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!getStepValidation(currentStep) && (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Please complete all required fields</span>
              </div>
            )}

            {currentStep < 4 ? (
            <button
              type="button"
                onClick={nextStep}
                disabled={!getStepValidation(currentStep) || isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next Step
            </button>
            ) : (
            <button
              type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || !isValid}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}</span>
            </button>
            )}
          </div>
          </div>
      </div>
    </div>
  );
}
