import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { ProjectBasics, ProjectStory } from '../../types/projectCreation';
import { useAuth } from '../../contexts/AuthContext';
import { useKYC } from '../../hooks/useKYC';
import Step1Basics from './Step1Basics';
import Step2Story from './Step2Story';
import Step3Launch from './Step3Launch';
import PINVerificationModal from '../kyc/PINVerificationModal';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function ProjectCreationWizard() {
  const { user } = useAuth();
  const { kycData, isApproved, loading: kycLoading } = useKYC();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);

  const [projectData, setProjectData] = useState<{
    basics?: Partial<ProjectBasics>;
    story?: Partial<ProjectStory>;
    launch?: {
      type: 'immediate' | 'scheduled';
      scheduledDate?: Date;
      privacy: 'public' | 'private';
    };
  }>({});

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

  const updateLaunch = (data: any) => {
    setProjectData(prev => ({
      ...prev,
      launch: { ...prev.launch, ...data }
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

    try {
      setIsSubmitting(true);

      // Get primary payment method from KYC
      const primaryPayment = kycData.paymentMethods.find(pm => pm.isPrimary) || kycData.paymentMethods[0];

      // Create project document
      const projectDoc: any = {
        // Basic Info
        title: projectData.basics?.title || '',
        tagline: projectData.basics?.tagline || '',
        category: projectData.basics?.category || '',
        location: projectData.basics?.location || { country: 'India', state: '', city: '' },
        image: projectData.basics?.coverImage || '',
        goal: projectData.basics?.fundingGoal || 0,
        duration: projectData.basics?.duration || 30,

        // Story
        description: projectData.story?.description || '',
        story: {
          why: projectData.story?.why || '',
          fundBreakdown: projectData.story?.fundBreakdown || [],
          timeline: projectData.story?.timeline || [],
          risks: projectData.story?.risks || ''
        },
        gallery: projectData.story?.gallery || [],

        // Creator
        creatorId: user.uid,
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

        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        endDate: Timestamp.fromDate(
          new Date(Date.now() + (projectData.basics?.duration || 30) * 24 * 60 * 60 * 1000)
        )
      };

      // Optional fields
      if (projectData.basics?.videoUrl) {
        projectDoc.videoUrl = projectData.basics.videoUrl;
      }

      if (projectData.launch?.scheduledDate) {
        projectDoc.scheduledDate = Timestamp.fromDate(projectData.launch.scheduledDate);
      }

      // Add to Firestore
      await addDoc(collection(db, 'projects'), projectDoc);

      toast.success('🎉 Project submitted for admin review!');
      toast.info('Your project will be published after admin approval', { duration: 5000 });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard/projects');
      }, 2000);

    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be logged in to create a project.</p>
        </div>
      </div>
    );
  }

  if (kycLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentStep > step.number
                    ? 'bg-green-500'
                    : currentStep === step.number
                      ? 'bg-orange-500'
                      : 'bg-gray-200'
                    }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <span className={`text-lg font-bold ${currentStep === step.number ? 'text-white' : 'text-gray-600'
                        }`}>
                        {step.number}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
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
