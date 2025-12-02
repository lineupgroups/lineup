import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, Rocket, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreatorCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
}

export default function CreatorCelebration({ isOpen, onClose, userName }: CreatorCelebrationProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Reset animation
            setStep(0);

            // Trigger confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF']
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // Animation steps
            setTimeout(() => setStep(1), 300);
            setTimeout(() => setStep(2), 800);
            setTimeout(() => setStep(3), 1500);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Animated Background */}
                <div className="relative bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 p-8 text-white overflow-hidden">
                    {/* Floating Sparkles */}
                    <div className="absolute inset-0">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute animate-float"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`
                                }}
                            >
                                <Sparkles className="w-4 h-4 text-white/30" />
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 text-center">
                        {/* Animated Rocket */}
                        <div className={`transition-all duration-700 ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <Rocket className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className={`transition-all duration-700 delay-300 ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <h2 className="text-3xl font-bold mb-2">🎉 Congratulations!</h2>
                            <p className="text-xl text-white/90 mb-1">{userName}</p>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-8">
                    <div className={`transition-all duration-700 delay-500 ${step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        {/* Success Message */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold mb-4">
                                <CheckCircle className="w-5 h-5" />
                                <span>You're now a Verified Creator!</span>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Your KYC has been approved. You can now create unlimited projects and start raising funds!
                            </p>
                        </div>

                        {/* Features Unlocked */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Create Projects</p>
                                    <p className="text-sm text-gray-600">Launch unlimited crowdfunding campaigns</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Receive Funding</p>
                                    <p className="text-sm text-gray-600">Get direct payments from supporters</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Build Community</p>
                                    <p className="text-sm text-gray-600">Connect with supporters and grow your audience</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Explore Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    window.location.href = '/dashboard/projects/create';
                                }}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-pink-700 transition-all hover:shadow-lg"
                            >
                                Create First Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
        .animate-float {
          animation: float 4s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
}
