import { useState, useCallback } from 'react';
import { X, Heart, Send, Sparkles, Rocket, Star, HandHeart } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface Supporter {
    id: string;
    userId: string;
    displayName: string;
    displayProfileImage: string | null;
    totalAmount: number;
    donationCount: number;
    anonymous: boolean;
}

interface ThankYouModalProps {
    isOpen: boolean;
    onClose: () => void;
    supporter: Supporter;
    onSend: (supporterId: string, message: string) => Promise<void>;
}

// Template options
const THANK_YOU_TEMPLATES = [
    {
        id: 'thank-you',
        icon: HandHeart,
        label: '🙏 Thank You',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        activeColor: 'bg-blue-500 text-white border-blue-500',
        message: 'Thank you so much for your incredible support! Your contribution means the world to us and helps bring this vision to life. 🙏'
    },
    {
        id: 'heartfelt',
        icon: Heart,
        label: '❤️ Heartfelt',
        color: 'bg-pink-100 text-pink-700 border-pink-200',
        activeColor: 'bg-pink-500 text-white border-pink-500',
        message: "Words can't express how grateful I am for your support. You're helping make this dream a reality! Your belief in this project inspires me to work even harder. ❤️"
    },
    {
        id: 'excited',
        icon: Rocket,
        label: '🚀 Excited',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        activeColor: 'bg-orange-500 text-white border-orange-500',
        message: "Your backing is rocket fuel for this project! 🚀 Thank you for believing in what we're building. Together, we're going to create something amazing!"
    },
    {
        id: 'amazing',
        icon: Star,
        label: '🌟 Amazing',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        activeColor: 'bg-yellow-500 text-white border-yellow-500',
        message: "You're an amazing supporter! 🌟 Your generosity is inspiring and deeply appreciated. This project wouldn't be possible without incredible backers like you!"
    }
];

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Max character limit
const MAX_MESSAGE_LENGTH = 500;

export default function ThankYouModal({
    isOpen,
    onClose,
    supporter,
    onSend
}: ThankYouModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Reset state when modal opens
    const handleClose = useCallback(() => {
        setSelectedTemplate(null);
        setMessage('');
        setIsSending(false);
        onClose();
    }, [onClose]);

    // Handle template selection
    const handleTemplateSelect = useCallback((templateId: string) => {
        const template = THANK_YOU_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setMessage(template.message);
        }
    }, []);

    // Handle send
    const handleSend = useCallback(async () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            toast.error(`Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`);
            return;
        }

        setIsSending(true);

        try {
            await onSend(supporter.id, message);

            // Fire confetti! 🎊
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa']
            });

            toast.success(
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span>Thank you sent to {supporter.displayName}!</span>
                </div>,
                { duration: 4000 }
            );

            handleClose();
        } catch (error) {
            console.error('Error sending thank you:', error);
            toast.error('Failed to send thank you. Please try again.');
        } finally {
            setIsSending(false);
        }
    }, [message, supporter, onSend, handleClose]);

    // Character count
    const characterCount = message.length;
    const isOverLimit = characterCount > MAX_MESSAGE_LENGTH;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                {/* Modal */}
                <div
                    className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full">
                                <Heart className="w-6 h-6 text-pink-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Send Thank You
                                </h2>
                                <p className="text-sm text-gray-500">
                                    to {supporter.displayName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Supporter Info */}
                    <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                        <div className="flex items-center gap-4">
                            {supporter.displayProfileImage ? (
                                <img
                                    src={supporter.displayProfileImage}
                                    alt={supporter.displayName}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    <span className="text-gray-500 font-medium text-lg">
                                        {supporter.displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-gray-900">
                                    {supporter.displayName}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Contributed <span className="font-bold text-green-600">{formatCurrency(supporter.totalAmount)}</span>
                                    {' '}across {supporter.donationCount} donation{supporter.donationCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="p-6 border-b border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Quick Templates
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {THANK_YOU_TEMPLATES.map(template => {
                                const Icon = template.icon;
                                const isSelected = selectedTemplate === template.id;
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template.id)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isSelected
                                                ? template.activeColor + ' shadow-md scale-[1.02]'
                                                : template.color + ' hover:scale-[1.02]'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {template.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write a heartfelt thank you message..."
                            rows={5}
                            className={`w-full px-4 py-3 border rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-400">
                                Tip: Personalize your message for a bigger impact!
                            </span>
                            <span className={`text-xs font-medium ${isOverLimit ? 'text-red-500' : characterCount > MAX_MESSAGE_LENGTH * 0.8 ? 'text-orange-500' : 'text-gray-400'
                                }`}>
                                {characterCount}/{MAX_MESSAGE_LENGTH}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
                        <button
                            onClick={handleClose}
                            disabled={isSending}
                            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || !message.trim() || isOverLimit}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Thank You
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
