import { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

interface FAQ {
    id: string;
    question: string;
    answer: string;
}

interface ProjectFAQsProps {
    faqs: FAQ[];
    projectId: string;
    showAskQuestion?: boolean;
    onAskQuestion?: (question: string) => Promise<void>;
}

export default function ProjectFAQs({
    faqs,
    showAskQuestion = false,
    onAskQuestion
}: ProjectFAQsProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newQuestion, setNewQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleFaq = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleSubmitQuestion = async () => {
        if (!newQuestion.trim() || !onAskQuestion) return;

        setIsSubmitting(true);
        try {
            await onAskQuestion(newQuestion.trim());
            setNewQuestion('');
        } catch (error) {
            console.error('Failed to submit question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (faqs.length === 0 && !showAskQuestion) {
        return (
            <div className="text-center py-12 bg-neutral-800/30 rounded-2xl border border-neutral-800">
                <HelpCircle className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-brand-white mb-2">No FAQs yet</h4>
                <p className="text-neutral-500">
                    The creator hasn't added any frequently asked questions.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* FAQ List */}
            {faqs.length > 0 && (
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div
                            key={faq.id}
                            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                                expandedId === faq.id 
                                    ? 'border-brand-orange/30 bg-white/5 shadow-[0_0_15px_rgba(255,91,0,0.05)]' 
                                    : 'border-neutral-800 bg-[#111] hover:border-neutral-700'
                            }`}
                        >
                            <button
                                onClick={() => toggleFaq(faq.id)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                                aria-expanded={expandedId === faq.id}
                                aria-controls={`faq-answer-${faq.id}`}
                            >
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-brand-orange/10 text-brand-orange rounded-xl text-sm font-black border border-brand-orange/20">
                                        {index + 1}
                                    </span>
                                    <span className="font-semibold text-brand-white text-left">
                                        {faq.question}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`w-5 h-5 text-neutral-500 flex-shrink-0 ml-4 transition-transform duration-300 ${expandedId === faq.id ? 'rotate-180 text-brand-orange' : ''
                                        }`}
                                />
                            </button>

                            <div
                                id={`faq-answer-${faq.id}`}
                                className={`overflow-hidden transition-all duration-300 ${expandedId === faq.id ? 'max-h-96' : 'max-h-0'
                                    }`}
                            >
                                <div className="px-5 pb-5 pt-0 border-t border-neutral-800/50">
                                    <div className="pl-12 pt-4 whitespace-pre-wrap text-neutral-300 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ask a Question Form */}
            {showAskQuestion && onAskQuestion && (
                <div className="mt-6 p-5 bg-[#111] rounded-2xl border border-neutral-800">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageCircle className="w-5 h-5 text-brand-orange" />
                        <h4 className="font-bold text-brand-white">Have a question?</h4>
                    </div>
                    <p className="text-sm text-neutral-400 mb-4">
                        Ask the creator a question about this project. They'll be notified and can respond.
                    </p>
                    <div className="space-y-3">
                        <textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Type your question here..."
                            rows={3}
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-brand-white placeholder-neutral-600 focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 resize-none transition-all"
                            disabled={isSubmitting}
                            maxLength={500}
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                                {newQuestion.length}/500 characters
                            </span>
                            <button
                                onClick={handleSubmitQuestion}
                                disabled={!newQuestion.trim() || isSubmitting}
                                className="px-5 py-2.5 bg-brand-orange text-brand-black font-black rounded-xl hover:bg-[#ff7529] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(255,91,0,0.2)] hover:shadow-[0_0_25px_rgba(255,91,0,0.3)]"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Empty state for when there are no FAQs
export function EmptyFAQs() {
    return (
        <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">No FAQs have been added for this project yet.</p>
        </div>
    );
}
