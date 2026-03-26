import { useState, useCallback } from 'react';
import { X, Share2, Check, Copy, Twitter, MessageCircle, Link2, Sparkles, Trophy, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareMilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectTitle: string;
    projectId: string;
    raised: number;
    goal: number;
    percentFunded: number;
    backerCount?: number;
    daysLeft?: number;
}

/**
 * Share Milestone Modal - Beautiful modal for sharing project milestones
 * Supports WhatsApp, Twitter, and Copy Link sharing
 */
export default function ShareMilestoneModal({
    isOpen,
    onClose,
    projectTitle,
    projectId,
    raised,
    goal,
    percentFunded,
    backerCount = 0,
    daysLeft = 0
}: ShareMilestoneModalProps) {
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const projectUrl = `${window.location.origin}/project/${projectId}`;
    const amountToGo = goal - raised;

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    // Pre-formatted share messages
    const getWhatsAppMessage = () => {
        return encodeURIComponent(
            `🎉 Great news! My project "${projectTitle}" just reached ${percentFunded}% funding on Lineup!\n\n` +
            `💰 ${formatCurrency(raised)} raised from ${backerCount} amazing backers.\n\n` +
            `${amountToGo > 0 ? `Just ${formatCurrency(amountToGo)} more to reach the goal! ` : '🏆 Fully funded! '}` +
            `Support here: ${projectUrl}`
        );
    };

    const getTwitterMessage = () => {
        return encodeURIComponent(
            `🚀 "${projectTitle}" just hit ${percentFunded}% funding on @LineupIndia!\n\n` +
            `${formatCurrency(raised)} raised • ${backerCount} backers • ${daysLeft} days left\n\n` +
            `Help us reach 100%! 👉 ${projectUrl}\n\n` +
            `#Crowdfunding #Startup #India`
        );
    };

    const handleWhatsAppShare = useCallback(() => {
        setIsSharing(true);
        const url = `https://wa.me/?text=${getWhatsAppMessage()}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => setIsSharing(false), 500);
    }, [projectTitle, percentFunded, raised, backerCount, amountToGo, projectUrl]);

    const handleTwitterShare = useCallback(() => {
        setIsSharing(true);
        const url = `https://twitter.com/intent/tweet?text=${getTwitterMessage()}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => setIsSharing(false), 500);
    }, [projectTitle, percentFunded, raised, backerCount, daysLeft, projectUrl]);

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(projectUrl);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error('Failed to copy link');
        }
    }, [projectUrl]);

    if (!isOpen) return null;

    const getMilestoneEmoji = () => {
        if (percentFunded >= 100) return '🏆';
        if (percentFunded >= 75) return '🎆';
        if (percentFunded >= 50) return '🎊';
        return '🎉';
    };

    const getMilestoneMessage = () => {
        if (percentFunded >= 100) return 'Fully Funded!';
        if (percentFunded >= 75) return 'Almost There!';
        if (percentFunded >= 50) return 'Halfway There!';
        return 'Making Progress!';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Celebration Header */}
                <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 p-6 text-white overflow-hidden">
                    {/* Animated confetti background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-2 left-4 animate-bounce delay-100">🎊</div>
                        <div className="absolute top-4 right-8 animate-bounce delay-200">🎉</div>
                        <div className="absolute bottom-3 left-12 animate-bounce delay-300">✨</div>
                        <div className="absolute bottom-2 right-4 animate-bounce delay-100">🎊</div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <PartyPopper className="w-6 h-6" />
                            <Trophy className="w-8 h-8" />
                            <PartyPopper className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Congratulations!</h2>
                        <p className="text-white/90 text-sm">{getMilestoneMessage()}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Milestone Stats */}
                    <div className="text-center mb-6">
                        <p className="text-gray-600 mb-2 line-clamp-2">
                            "{projectTitle}"
                        </p>
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <span className="text-4xl">{getMilestoneEmoji()}</span>
                            <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                {percentFunded}%
                            </span>
                            <span className="text-4xl">{getMilestoneEmoji()}</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(raised)} raised
                        </p>
                        <p className="text-sm text-gray-500">
                            from {backerCount} amazing backers
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(percentFunded, 100)}%` }}
                            />
                        </div>
                        {amountToGo > 0 && (
                            <p className="text-center text-sm text-gray-500 mt-2">
                                Only <span className="font-semibold text-orange-600">{formatCurrency(amountToGo)}</span> more to reach your goal!
                            </p>
                        )}
                    </div>

                    {/* Share Title */}
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <h3 className="font-semibold text-gray-900">Share this achievement</h3>
                    </div>

                    {/* Share Buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* WhatsApp */}
                        <button
                            onClick={handleWhatsAppShare}
                            disabled={isSharing}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-green-700">WhatsApp</span>
                        </button>

                        {/* Twitter */}
                        <button
                            onClick={handleTwitterShare}
                            disabled={isSharing}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <Twitter className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-blue-700">Twitter</span>
                        </button>

                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500' : 'bg-gray-500'}`}>
                                {copied ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : (
                                    <Link2 className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <span className={`text-xs font-medium ${copied ? 'text-green-700' : 'text-gray-700'}`}>
                                {copied ? 'Copied!' : 'Copy Link'}
                            </span>
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                window.open(`/dashboard/updates?action=new&projectId=${projectId}`, '_self');
                            }}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Post Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
