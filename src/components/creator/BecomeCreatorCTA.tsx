import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';
import { useKYC } from '../../hooks/useKYC';

interface BecomeCreatorCTAProps {
    variant?: 'navbar' | 'banner' | 'card';
    className?: string;
}

export default function BecomeCreatorCTA({ variant = 'navbar', className = '' }: BecomeCreatorCTAProps) {
    const { kycData } = useKYC();

    // Determine if user has started KYC
    const hasSubmittedKYC = kycData !== null;

    // If user has already submitted KYC, go to status page
    // Otherwise, go to submission form
    const targetPath = hasSubmittedKYC ? '/kyc/status' : '/kyc/submit';
    const buttonText = hasSubmittedKYC ? 'View KYC Status' : 'Become a Creator';

    if (variant === 'navbar') {
        return (
            <Link
                to={targetPath}
                className={`
                    inline-flex items-center gap-2 px-4 py-2 
                    bg-gradient-to-r from-brand-orange/100 to-pink-600 
                    text-white rounded-full font-semibold text-sm
                    shadow-md hover:shadow-lg hover:scale-105 
                    transition-all duration-200 ease-in-out
                    whitespace-nowrap
                    ${className}
                `}
                style={{ display: 'inline-flex', alignItems: 'center' }}
            >
                <span className="inline-flex items-center" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Rocket className="w-4 h-4" style={{ verticalAlign: 'middle' }} />
                </span>
                <span className="hidden sm:inline">{buttonText}</span>
                <span className="sm:hidden">Creator</span>
            </Link>
        );
    }

    if (variant === 'banner') {
        return (
            <div className={`bg-gradient-to-r from-brand-orange/100 to-pink-500 rounded-3xl p-6 text-white ${className}`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Rocket className="w-6 h-6" />
                            <h3 className="text-xl font-bold">
                                {hasSubmittedKYC ? 'KYC In Progress' : 'Ready to Create?'}
                            </h3>
                        </div>
                        <p className="text-orange-50 mb-4">
                            {hasSubmittedKYC
                                ? 'Check the status of your KYC verification and track your progress.'
                                : 'Complete KYC verification to unlock creator features and start raising funds for your projects.'}
                        </p>
                        <ul className="text-sm text-orange-50 space-y-1 mb-4">
                            <li>✓ Create unlimited projects</li>
                            <li>✓ Receive direct funding</li>
                            <li>✓ Build your community</li>
                            <li>✓ Track your analytics</li>
                        </ul>
                        <Link
                            to={targetPath}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111] text-brand-orange rounded-2xl font-semibold hover:shadow-xl transition-all"
                        >
                            {hasSubmittedKYC ? 'View Status' : 'Start KYC Verification'}
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="hidden md:block flex-shrink-0">
                        <div className="w-32 h-32 bg-[#111]/10 rounded-full flex items-center justify-center">
                            <Rocket className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Card variant
    return (
        <div className={`bg-gradient-to-br from-brand-orange/10 to-pink-50 border-2 border-brand-orange/30 rounded-3xl p-6 ${className}`}>
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-brand-orange/100 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-brand-white mb-2">
                    {hasSubmittedKYC ? 'KYC Submitted' : 'Want to Create Projects?'}
                </h3>
                <p className="text-sm text-neutral-400 mb-4">
                    {hasSubmittedKYC
                        ? 'Check your KYC verification status'
                        : 'Complete KYC verification to unlock creator features'}
                </p>
                <Link
                    to={targetPath}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-orange/100 to-pink-500 text-white rounded-2xl font-medium hover:shadow-lg transition-all"
                >
                    {buttonText}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
