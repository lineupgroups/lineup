import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, ChevronRight, ChevronLeft, Rocket, Users,
    BarChart3, Wallet, MessageSquare, Edit3, Target,
    Sparkles, CheckCircle, ArrowRight, Zap, Star
} from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    tips: string[];
    action?: {
        label: string;
        route: string;
    };
}

interface DashboardOnboardingProps {
    isOpen: boolean;
    onComplete: () => void;
    userName?: string;
}

const ONBOARDING_STORAGE_KEY = 'lineup_dashboard_onboarding_completed';

/**
 * Dashboard Onboarding - Beautiful first-time user experience
 * Shows a guided tour of dashboard features with tips and actions
 */
export default function DashboardOnboarding({
    isOpen,
    onComplete,
    userName = 'Creator'
}: DashboardOnboardingProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const steps: OnboardingStep[] = [
        {
            id: 'welcome',
            title: 'Welcome to Your Creator Dashboard! 🎉',
            description: 'This is your command center for managing campaigns, tracking supporters, and growing your creator journey.',
            icon: <Sparkles className="w-12 h-12 text-white" />,
            color: 'from-orange-500 via-red-500 to-purple-600',
            tips: [
                'View all your key metrics at a glance',
                'Track revenue and backer growth over time',
                'Get actionable insights to improve performance'
            ]
        },
        {
            id: 'summary-cards',
            title: 'Summary Cards',
            description: 'Your key metrics are displayed in beautiful summary cards. Click any card to dive deeper into that area.',
            icon: <Target className="w-12 h-12 text-white" />,
            color: 'from-green-500 to-emerald-600',
            tips: [
                '💰 Total Raised - All donations across projects',
                '👥 Active Backers - Unique supporters count',
                '💳 Available Balance - Ready to withdraw',
                '📈 Conversion Rate - Views to supporters ratio'
            ]
        },
        {
            id: 'revenue-chart',
            title: 'Revenue Analytics',
            description: 'Visualize your funding trends over time with interactive charts. Toggle between 7, 14, or 30 day views.',
            icon: <BarChart3 className="w-12 h-12 text-white" />,
            color: 'from-blue-500 to-indigo-600',
            tips: [
                'See daily donation patterns',
                'Identify your best performing days',
                'Hover over points for detailed info',
                'Compare trends across time periods'
            ]
        },
        {
            id: 'quick-actions',
            title: 'Quick Actions',
            description: 'One-click shortcuts to your most common tasks. Badges show items needing attention.',
            icon: <Zap className="w-12 h-12 text-white" />,
            color: 'from-yellow-500 to-orange-600',
            tips: [
                '🚀 Create new projects instantly',
                '✏️ Post updates to keep backers engaged',
                '💬 Reply to comments to build community',
                '💳 Withdraw funds when ready'
            ],
            action: {
                label: 'Create Your First Project',
                route: '/dashboard/projects/create'
            }
        },
        {
            id: 'activity-feed',
            title: 'Activity Feed & Backers',
            description: 'Stay updated with real-time notifications about donations, comments, and milestones.',
            icon: <Users className="w-12 h-12 text-white" />,
            color: 'from-purple-500 to-pink-600',
            tips: [
                'See new donations as they happen',
                'Track comments and engagement',
                'Celebrate milestone achievements',
                'Quick-thank your supporters'
            ]
        },
        {
            id: 'project-selector',
            title: 'Project Selector',
            description: 'Filter your entire dashboard by project. Select a project from the navbar to focus on specific campaign data.',
            icon: <Edit3 className="w-12 h-12 text-white" />,
            color: 'from-teal-500 to-cyan-600',
            tips: [
                'Switch between projects instantly',
                'Dashboard updates automatically',
                'Compare project performance',
                'Focus on what matters most'
            ]
        },
        {
            id: 'complete',
            title: "You're All Set! 🚀",
            description: "You're ready to start your creator journey. Create your first project and share it with the world!",
            icon: <Star className="w-12 h-12 text-white" />,
            color: 'from-orange-500 via-red-500 to-purple-600',
            tips: [
                '✅ Complete your profile for trust',
                '✅ Complete KYC verification',
                '✅ Create your first project',
                '✅ Share with your network'
            ],
            action: {
                label: 'Start Creating',
                route: '/dashboard/projects/create'
            }
        }
    ];

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, steps.length]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const handleComplete = useCallback(() => {
        setIsExiting(true);
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        setTimeout(() => {
            onComplete();
        }, 300);
    }, [onComplete]);

    const handleSkip = useCallback(() => {
        handleComplete();
    }, [handleComplete]);

    const handleAction = useCallback((route: string) => {
        handleComplete();
        navigate(route);
    }, [handleComplete, navigate]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (currentStep === steps.length - 1) {
                    handleComplete();
                } else {
                    handleNext();
                }
            } else if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'Escape') {
                handleSkip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentStep, steps.length, handleNext, handlePrevious, handleComplete, handleSkip]);

    if (!isOpen) return null;

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${isExiting ? 'scale-95' : 'scale-100'}`}>
                {/* Progress Bar */}
                <div className="h-1 bg-gray-100">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header with Icon */}
                <div className={`relative bg-gradient-to-r ${step.color} p-8 text-white overflow-hidden`}>
                    {/* Skip button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Step indicator */}
                    <div className="absolute top-4 left-4 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                        {currentStep + 1} / {steps.length}
                    </div>

                    {/* Animated background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/10 animate-pulse" />
                        <div className="absolute bottom-4 right-8 w-24 h-24 rounded-full bg-white/10 animate-pulse delay-100" />
                        <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-white/5 animate-pulse delay-200" />
                    </div>

                    <div className="flex flex-col items-center text-center relative z-10 pt-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                            {step.icon}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 text-center mb-6 leading-relaxed">
                        {step.description}
                    </p>

                    {/* Tips */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            {currentStep === 0 ? 'What you can do:' : 'Tips & Features:'}
                        </h4>
                        <ul className="space-y-2">
                            {step.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action button if present */}
                    {step.action && (
                        <button
                            onClick={() => handleAction(step.action!.route)}
                            className="w-full mb-4 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-200"
                        >
                            <Rocket className="w-5 h-5" />
                            {step.action.label}
                        </button>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-1 px-4 py-2 rounded-xl font-medium transition-colors ${currentStep === 0
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        {/* Step dots */}
                        <div className="flex items-center gap-1.5">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                            ? 'w-6 bg-orange-500'
                                            : index < currentStep
                                                ? 'bg-orange-300'
                                                : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        {currentStep === steps.length - 1 ? (
                            <button
                                onClick={handleComplete}
                                className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all"
                            >
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Keyboard hints */}
                <div className="px-6 pb-4 text-center">
                    <p className="text-xs text-gray-400">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">→</kbd> for next,{' '}
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">←</kbd> for back,{' '}
                        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd> to skip
                    </p>
                </div>
            </div>
        </div>
    );
}

// Hook to check if onboarding should be shown
export function useDashboardOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!hasCompleted) {
            // Delay showing onboarding to let dashboard load first
            const timer = setTimeout(() => {
                setShowOnboarding(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const completeOnboarding = useCallback(() => {
        setShowOnboarding(false);
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }, []);

    const resetOnboarding = useCallback(() => {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setShowOnboarding(true);
    }, []);

    return {
        showOnboarding,
        completeOnboarding,
        resetOnboarding
    };
}
