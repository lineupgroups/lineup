import { Link } from 'react-router-dom';
import { Rocket, ArrowRight, ShieldCheck } from 'lucide-react';
import { useKYC } from '../../hooks/useKYC';

interface BecomeCreatorCTAProps {
    variant?: 'navbar' | 'banner' | 'card';
    className?: string;
}

export default function BecomeCreatorCTA({ variant = 'navbar', className = '' }: BecomeCreatorCTAProps) {
    const { kycData } = useKYC();

    // Determine if user has started KYC
    const hasSubmittedKYC = kycData !== null;

    const targetPath = hasSubmittedKYC ? '/kyc/status' : '/kyc/submit';
    const buttonText = hasSubmittedKYC ? 'AUDIT KYC STATUS' : 'BECOME A CREATOR';

    if (variant === 'navbar') {
        return (
            <Link
                to={targetPath}
                className={`
                    inline-flex items-center gap-2.5 px-6 py-2.5 
                    bg-brand-orange text-brand-black rounded-2xl 
                    text-[10px] font-black italic uppercase tracking-[0.2em]
                    shadow-[0_10px_20px_rgba(255,91,0,0.2)] hover:shadow-[0_15px_30px_rgba(255,91,0,0.3)] 
                    hover:scale-105 active:scale-95
                    transition-all duration-500
                    whitespace-nowrap
                    ${className}
                `}
            >
                <Rocket className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{buttonText}</span>
                <span className="sm:hidden">CREATOR</span>
            </Link>
        );
    }

    if (variant === 'banner') {
        return (
            <div className={`relative group bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 overflow-hidden hover:bg-white/10 transition-all ${className}`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-full blur-3xl group-hover:bg-brand-orange/10 transition-all"></div>
                
                <div className="flex items-start justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-brand-orange/10 rounded-2xl border border-brand-orange/20">
                                <Rocket className="w-6 h-6 text-brand-orange" />
                            </div>
                            <h3 className="text-3xl font-black text-brand-white italic uppercase tracking-tighter leading-none">
                                {hasSubmittedKYC ? 'KYC IN PROGRESS' : 'READY TO DEPLOY?'}
                            </h3>
                        </div>
                        <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-8 leading-relaxed max-w-xl">
                            {hasSubmittedKYC
                                ? 'AUDIT YOUR KYC VERIFICATION STATUS AND TRACK YOUR OPERATIONAL PROGRESS.'
                                : 'INITIALIZE YOUR KYC VERIFICATION PROTOCOL TO UNLOCK CREATOR CAPABILITIES AND ACQUIRE GLOBAL CAPITAL.'}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                            {[
                                'UNLIMITED PROJECT DEPLOYMENT',
                                'DIRECT CAPITAL ACQUISITION',
                                'NETWORK NODE EXPANSION',
                                'REAL-TIME INTEL ANALYTICS'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-acid" />
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{item}</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            to={targetPath}
                            className="inline-flex items-center gap-4 px-10 py-5 bg-brand-orange text-brand-black rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] shadow-2xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {hasSubmittedKYC ? 'AUDIT STATUS' : 'INITIALIZE KYC PROTOCOL'}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    
                    <div className="hidden lg:block flex-shrink-0">
                        <div className="w-48 h-48 bg-white/5 border border-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                            <ShieldCheck className="w-20 h-20 text-brand-acid opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Card variant
    return (
        <div className={`relative group bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 overflow-hidden hover:bg-white/10 transition-all ${className}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl transition-all"></div>
            <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Rocket className="w-7 h-7 text-brand-orange" />
                </div>
                <h3 className="text-xl font-black text-brand-white italic uppercase tracking-tight mb-3">
                    {hasSubmittedKYC ? 'KYC SUBMITTED' : 'WANT TO DEPLOY?'}
                </h3>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-8 leading-relaxed">
                    {hasSubmittedKYC
                        ? 'AUDIT YOUR VERIFICATION PROGRESS'
                        : 'UNLOCK CREATOR CAPABILITIES VIA KYC'}
                </p>
                <Link
                    to={targetPath}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-brand-orange text-brand-black rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    {buttonText}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
