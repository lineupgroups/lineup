import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, PartyPopper, Trophy, X, TrendingUp, Heart, Share2, Twitter, Facebook, Linkedin, Link2, CheckCircle, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    projectTitle: string;
    projectId?: string;
    raised: number;
    goal: number;
    percentFunded: number;
}

interface ShareOption {
    name: string;
    icon: React.ReactNode;
    color: string;
    hoverColor: string;
    action: (url: string, text: string) => void;
}

/**
 * Phase 3 Implementation: Goal Celebration Modal with Share Functionality
 * - Confetti animation on achievement
 * - Social sharing options (Twitter, Facebook, LinkedIn, Copy Link)
 * - Animated entrance and celebration elements
 */
export default function GoalCelebration({
    isOpen,
    onClose,
    projectTitle,
    projectId,
    raised,
    goal: _goal, // Kept for potential future use
    percentFunded
}: GoalCelebrationProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Navigate to updates page with pre-filled milestone info
    const handlePostUpdate = () => {
        onClose();
        // Navigate to updates with context about the milestone
        navigate(`/dashboard/updates?action=new&project=${projectId || ''}&milestone=${Math.round(percentFunded)}`);
    };

    // Generate share URL and text
    const shareUrl = projectId
        ? `${window.location.origin}/project/${projectId}`
        : window.location.href;

    const shareText = `🎉 Amazing news! "${projectTitle}" just reached ${Math.round(percentFunded)}% funding with ${formatCurrency(raised)} raised! Thank you to all our incredible backers!`;

    // Share options configuration
    const shareOptions: ShareOption[] = [
        {
            name: 'Twitter',
            icon: <Twitter className="w-5 h-5" />,
            color: 'bg-[#1DA1F2]',
            hoverColor: 'hover:bg-[#1a8cd8]',
            action: (url, text) => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
            }
        },
        {
            name: 'Facebook',
            icon: <Facebook className="w-5 h-5" />,
            color: 'bg-[#1877F2]',
            hoverColor: 'hover:bg-[#166fe5]',
            action: (url, text) => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
            }
        },
        {
            name: 'LinkedIn',
            icon: <Linkedin className="w-5 h-5" />,
            color: 'bg-[#0A66C2]',
            hoverColor: 'hover:bg-[#095eb5]',
            action: (url, _text) => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            }
        },
        {
            name: 'WhatsApp',
            icon: <span className="text-lg">📱</span>,
            color: 'bg-[#25D366]',
            hoverColor: 'hover:bg-[#20bd5a]',
            action: (url, text) => {
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
            }
        }
    ];

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Reset animation
            setStep(0);
            setShowShareOptions(false);

            // Trigger celebration confetti
            const duration = 4000;
            const end = Date.now() + duration;

            // Golden confetti burst
            const goldColors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB700', '#FFDF00'];

            const frame = () => {
                // Left side burst
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 70,
                    origin: { x: 0, y: 0.6 },
                    colors: goldColors
                });
                // Right side burst
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 70,
                    origin: { x: 1, y: 0.6 },
                    colors: goldColors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            // Initial big burst
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { x: 0.5, y: 0.4 },
                colors: goldColors
            });

            setTimeout(() => frame(), 500);

            // Animation steps
            setTimeout(() => setStep(1), 200);
            setTimeout(() => setStep(2), 600);
            setTimeout(() => setStep(3), 1200);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-[#111] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-[#111]/20 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Animated Header */}
                <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500/100 p-8 text-white overflow-hidden">
                    {/* Floating Sparkles */}
                    <div className="absolute inset-0">
                        {[...Array(15)].map((_, i) => (
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
                                <Sparkles className="w-4 h-4 text-white/40" />
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="relative z-10 text-center">
                        {/* Animated Trophy */}
                        <div className={`transition-all duration-500 ${step >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50'}`}>
                            <div className="w-20 h-20 bg-[#111]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Trophy className="w-10 h-10 text-yellow-200" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className={`transition-all duration-500 delay-150 ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111]/20 backdrop-blur-sm rounded-full mb-3">
                                <PartyPopper className="w-5 h-5" />
                                <span className="font-semibold">GOAL REACHED!</span>
                                <PartyPopper className="w-5 h-5 transform scale-x-[-1]" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">Congratulations! 🎉</h2>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6">
                    <div className={`transition-all duration-500 delay-300 ${step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        {/* Project Title */}
                        <div className="text-center mb-6">
                            <p className="text-neutral-500 text-sm mb-1">Your project</p>
                            <h3 className="text-xl font-bold text-brand-white mb-4">"{projectTitle}"</h3>
                            <p className="text-neutral-400">has reached its funding goal!</p>
                        </div>

                        {/* Stats */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-xs font-medium">RAISED</span>
                                    </div>
                                    <p className="text-2xl font-bold text-brand-white">{formatCurrency(raised)}</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                                        <Heart className="w-4 h-4" />
                                        <span className="text-xs font-medium">FUNDED</span>
                                    </div>
                                    <p className="text-2xl font-bold text-brand-white">{Math.round(percentFunded)}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Share Options */}
                        {!showShareOptions ? (
                            <>
                                <p className="text-center text-neutral-400 text-sm mb-6">
                                    Thank you for your hard work! Share this milestone with your supporters!
                                </p>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowShareOptions(true)}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-brand-orange/100 to-red-500/100 text-white rounded-2xl font-medium hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-5 h-5" />
                                        Share This Achievement
                                    </button>
                                    <button
                                        onClick={handlePostUpdate}
                                        className="w-full px-6 py-3 bg-blue-500/100 text-white rounded-2xl font-medium hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                        Post an Update
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full px-6 py-3 bg-neutral-900 text-neutral-300 rounded-2xl font-medium hover:bg-neutral-800 transition-all"
                                    >
                                        Maybe Later
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-center text-neutral-400 text-sm mb-4">
                                    Share your achievement on:
                                </p>

                                {/* Social Share Buttons */}
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    {shareOptions.map((option) => (
                                        <button
                                            key={option.name}
                                            onClick={() => option.action(shareUrl, shareText)}
                                            className={`flex flex-col items-center justify-center p-3 ${option.color} ${option.hoverColor} text-white rounded-3xl transition-all hover:scale-105`}
                                            title={`Share on ${option.name}`}
                                        >
                                            {option.icon}
                                            <span className="text-xs mt-1">{option.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Copy Link */}
                                <button
                                    onClick={handleCopyLink}
                                    className={`w-full px-4 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${linkCopied
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                                        }`}
                                >
                                    {linkCopied ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Link Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="w-5 h-5" />
                                            Copy Project Link
                                        </>
                                    )}
                                </button>

                                {/* Back button */}
                                <button
                                    onClick={() => setShowShareOptions(false)}
                                    className="w-full mt-3 px-6 py-2 text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
                                >
                                    ← Back
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
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
