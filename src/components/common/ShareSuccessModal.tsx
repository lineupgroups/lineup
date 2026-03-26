import { useState } from 'react';
import { Check, Copy, Share2, Twitter, Facebook, Linkedin, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    updateTitle: string;
    updateId: string;
    projectTitle?: string;
}

export default function ShareSuccessModal({
    isOpen,
    onClose,
    updateTitle,
    updateId,
    projectTitle
}: ShareSuccessModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/project/${updateId}#updates`;
    const shareText = `Check out this update: "${updateTitle}"${projectTitle ? ` from ${projectTitle}` : ''}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(shareUrl);

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        };

        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 text-center border-b border-green-200">
                    <div className="relative inline-block">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PartyPopper className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Update Posted! 🎉</h3>
                    <p className="text-sm text-gray-600 mt-2">
                        Your supporters can now see your update. Share it to reach more people!
                    </p>
                </div>

                {/* Share Options */}
                <div className="p-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share your update
                    </h4>

                    {/* Social Share Buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button
                            onClick={() => handleShare('twitter')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all group"
                        >
                            <Twitter className="w-6 h-6 text-sky-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-gray-600">Twitter</span>
                        </button>
                        <button
                            onClick={() => handleShare('facebook')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                        >
                            <Facebook className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-gray-600">Facebook</span>
                        </button>
                        <button
                            onClick={() => handleShare('linkedin')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                        >
                            <Linkedin className="w-6 h-6 text-blue-700 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-gray-600">LinkedIn</span>
                        </button>
                    </div>

                    {/* Copy Link */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 text-sm text-gray-600 bg-transparent border-none focus:outline-none truncate"
                        />
                        <button
                            onClick={handleCopyLink}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${copied
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
