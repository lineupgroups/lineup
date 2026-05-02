import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { ProjectBasics, ProjectStory, validateYouTubeUrl } from '../../types/projectCreation';
import { useAuth } from '../../contexts/AuthContext';
import { useKYC } from '../../hooks/useKYC';
import Step1Basics from './Step1Basics';
import Step2Story from './Step2Story';
import Step3Launch from './Step3Launch';
import PINVerificationModal from '../kyc/PINVerificationModal';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Draft storage key
const DRAFT_KEY = 'lineup_project_draft';

// Type for project form data
interface ProjectFormData {
  basics?: Partial<ProjectBasics>;
  story?: Partial<ProjectStory>;
  launch?: {
    type: 'immediate' | 'scheduled';
    scheduledDate?: Date;
    privacy: 'public' | 'private';
  };
}

// Consistent error handler
const handleError = (error: any, context: string) => {
  console.error(`[${context}]`, error);
  const message = error?.message || 'An unexpected error occurred';
  toast.error(message);
};

export default function ProjectCreationWizard() {
  const { user } = useAuth();
  const { kycData, isApproved, loading: kycLoading } = useKYC();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);

  const [projectData, setProjectData] = useState<ProjectFormData>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Issue #7: Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Restore dates properly
        if (parsed.launch?.scheduledDate) {
          parsed.launch.scheduledDate = new Date(parsed.launch.scheduledDate);
        }
        setProjectData(parsed);
        toast.success('Draft restored from previous session', { icon: '💾' });
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
    setDraftLoaded(true);
  }, []);

  // Issue #7: Save draft to localStorage on every update
  useEffect(() => {
    if (draftLoaded && Object.keys(projectData).length > 0) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(projectData));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }
  }, [projectData, draftLoaded]);

  // Issue #11: Warn before leaving with unsaved changes
  useEffect(() => {
    const hasChanges = Object.keys(projectData).length > 0;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectData]);

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  }, []);

  // ✅ KYC Pre-check
  useEffect(() => {
    if (!kycLoading && !isApproved) {
      toast.error('Please complete KYC verification before creating a project');
      navigate('/kyc/submit');
    }
  }, [kycLoading, isApproved, navigate]);

  const steps = [
    { number: 1, label: 'Basics', description: 'Project details' },
    { number: 2, label: 'Story', description: 'Tell your story' },
    { number: 3, label: 'Launch', description: 'Review & launch' }
  ];

  const updateBasics = (data: Partial<ProjectBasics>) => {
    setProjectData(prev => ({
      ...prev,
      basics: { ...prev.basics, ...data }
    }));
  };

  const updateStory = (data: Partial<ProjectStory>) => {
    setProjectData(prev => ({
      ...prev,
      story: { ...prev.story, ...data }
    }));
  };

  const updateLaunch = (data: Partial<ProjectFormData['launch']>) => {
    setProjectData(prev => ({
      ...prev,
      launch: { ...prev.launch, ...data } as ProjectFormData['launch']
    }));
  };

  const handlePINVerified = async () => {
    // PIN verified, now submit project
    await submitProject(true);
  };

  const submitProject = async (identityVerified: boolean = false) => {
    if (!user || !kycData) {
      toast.error('Missing user or KYC data');
      return;
    }

    // Validate payment methods
    if (!kycData.paymentMethods || kycData.paymentMethods.length === 0) {
      toast.error('No payment methods found in KYC. Please complete your KYC first.');
      navigate('/kyc/submit');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get primary payment method from KYC
      const primaryPayment = kycData.paymentMethods.find(pm => pm.isPrimary) || kycData.paymentMethods[0];

      // Validate required data
      if (!projectData.basics?.title || !projectData.basics?.category) {
        toast.error('Missing required project information');
        return;
      }

      // Issue #10: Re-validate video URL before submission
      if (projectData.basics?.videoUrl && !validateYouTubeUrl(projectData.basics.videoUrl)) {
        toast.error('Please enter a valid YouTube URL or remove the video URL');
        return;
      }

      if (!projectData.basics?.location?.state || !projectData.basics?.location?.city) {
        toast.error('Please provide complete location information');
        return;
      }

      // Issue #16: Calculate end date based on launch type
      const launchDate = projectData.launch?.type === 'scheduled' && projectData.launch?.scheduledDate
        ? new Date(projectData.launch.scheduledDate)
        : new Date();

      const endDate = new Date(launchDate.getTime() + (projectData.basics.duration || 30) * 24 * 60 * 60 * 1000);

      // Create project document
      const projectDoc: any = {
        // Basic Info
        title: projectData.basics.title,
        tagline: projectData.basics.tagline || '',
        category: projectData.basics.category,
        location: {
          state: projectData.basics.location.state,
          city: projectData.basics.location.city
        },
        image: projectData.basics.coverImage || '',
        goal: projectData.basics.fundingGoal || 0,
        duration: projectData.basics.duration || 30,

        // Story
        description: projectData.story?.description || '',
        story: {
          why: projectData.story?.why || '',
          fundBreakdown: projectData.story?.fundBreakdown || [],
          timeline: projectData.story?.timeline || [],
          risks: projectData.story?.risks || ''
        },
        gallery: projectData.story?.gallery || [],

        // Creator - Issue #4: Use both creatorId and createdBy for compatibility
        creatorId: user.uid,
        createdBy: user.uid, // Alias for backward compatibility
        creatorName: user.displayName || '',
        creatorPhoto: user.profileImage || user.photoURL || '',

        // ✅ NEW: Reference existing KYC
        kycDocumentId: user.kycDocumentId,
        kycStatus: 'approved', // Already verified during KYC
        identityVerified, // TRUE after PIN verification

        // ✅ NEW: Use KYC payment method
        paymentMethodType: primaryPayment.type,
        paymentMethod: primaryPayment,

        // Launch settings
        launchType: projectData.launch?.type || 'immediate',
        privacy: projectData.launch?.privacy || 'public',

        // ✅ CRITICAL: Status set to pending_review (requires admin approval)
        status: 'pending_review',
        approvalStatus: 'pending',
        adminReviewRequired: true,

        // Stats
        raised: 0,
        supporters: 0,
        likeCount: 0,
        followCount: 0,
        viewCount: 0,

        // Timestamps - Issue #16: Use calculated endDate
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        endDate: Timestamp.fromDate(endDate)
      };

      // Optional: Tags
      if (projectData.basics.tags && projectData.basics.tags.length > 0) {
        projectDoc.tags = projectData.basics.tags;
      }

      // Optional fields
      if (projectData.basics.videoUrl) {
        projectDoc.videoUrl = projectData.basics.videoUrl;
      }

      if (projectData.launch?.scheduledDate) {
        projectDoc.scheduledDate = Timestamp.fromDate(projectData.launch.scheduledDate);
      }

      console.log('📝 Submitting project with data:', projectDoc);

      // Add to Firestore
      await addDoc(collection(db, 'projects'), projectDoc);

      // Issue #7: Clear draft after successful submission
      clearDraft();

      toast.success('🎉 Project submitted for admin review!');
      toast.success('ℹ️ Your project will be published after admin approval', { duration: 5000 });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard/projects');
      }, 2000);

    } catch (error: any) {
      // Issue #12: Consistent error handling
      if (error.code === 'permission-denied') {
        handleError(error, 'ProjectCreation - Permission');
        toast.error('Permission denied. Please check your account permissions.');
      } else {
        handleError(error, 'ProjectCreation - Submit');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = () => {
    // Show PIN verification modal before submission
    setShowPINModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black italic uppercase tracking-wider text-brand-white mb-4">Please Sign In</h2>
          <p className="text-neutral-400">You need to be logged in to create a project.</p>
        </div>
      </div>
    );
  }

  if (kycLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-acid mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="bg-[#111] rounded-3xl border border-neutral-800 p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${currentStep > step.number
                    ? 'bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.4)]'
                    : currentStep === step.number
                      ? 'bg-brand-orange scale-110 shadow-[0_0_20px_rgba(255,91,0,0.3)]'
                      : 'bg-neutral-900 border-2 border-neutral-800'
                    }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6 text-brand-black" />
                    ) : (
                      <span className={`text-lg font-black ${currentStep === step.number ? 'text-brand-black' : 'text-neutral-500'
                        }`}>
                        {step.number}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <div className={`text-[10px] font-black italic uppercase tracking-[0.2em] ${currentStep > step.number ? 'text-brand-acid' : currentStep === step.number ? 'text-brand-orange' : 'text-neutral-600'
                      }`}>
                      {step.label}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-6 transition-all duration-500 ${currentStep > step.number ? 'bg-brand-acid' : 'bg-neutral-800'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-[#111] rounded-[2.5rem] border-2 border-neutral-800 p-12 shadow-2xl">
          {currentStep === 1 && (
            <Step1Basics
              data={projectData.basics || {}}
              onUpdate={updateBasics}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2Story
              data={projectData.story || {}}
              fundingGoal={projectData.basics?.fundingGoal || 0}
              onUpdate={updateStory}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3Launch
              data={projectData.launch || { type: 'immediate', privacy: 'public' }}
              onUpdate={updateLaunch}
              onSubmit={handleFinalSubmit}
              onBack={() => setCurrentStep(2)}
              isSubmitting={isSubmitting}
              projectData={projectData}
              kycData={kycData || undefined}
            />
          )}
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PINVerificationModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerified={handlePINVerified}
        userId={user.uid}
      />
    </div>
  );
}
