import { useState } from 'react';
import { Lock, X, AlertCircle, ShieldCheck, Zap, ChevronRight } from 'lucide-react';
import { verifyCreatorPIN } from '../../lib/kycService';
import toast from 'react-hot-toast';

interface PINVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    userId: string;
}

export default function PINVerificationModal({
    isOpen,
    onClose,
    onVerified,
    userId
}: PINVerificationModalProps) {
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    if (!isOpen) return null;

    const handlePINChange = (value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setPin(numericValue);
        setError('');
    };

    const handleVerify = async () => {
        if (pin.length !== 6) {
            setError('PIN MUST BE 6 DIGITS');
            return;
        }

        try {
            setVerifying(true);
            setError('');

            const isValid = await verifyCreatorPIN(userId, pin);

            if (isValid) {
                toast.success('IDENTITY VERIFIED!');
                onVerified();
                handleClose();
            } else {
                setAttempts(prev => prev + 1);
                setError('INVALID SECURITY PIN');
                setPin('');

                if (attempts >= 2) {
                    toast.error('MULTIPLE FAILURES. CONTACT SUPPORT.');
                }
            }
        } catch (error: any) {
            console.error('PIN verification error:', error);
            setError(error.message?.toUpperCase() || 'VERIFICATION FAILED');
            setPin('');
        } finally {
            setVerifying(false);
        }
    };

    const handleClose = () => {
        setPin('');
        setError('');
        setAttempts(0);
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && pin.length === 6) {
            handleVerify();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-brand-black/95 backdrop-blur-2xl" onClick={handleClose} />
            
            <div className="relative w-full max-w-md bg-[#0a0a0a] border-2 border-neutral-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(255,91,0,0.1)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b-2 border-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,91,0,0.1)]">
                                <Lock className="w-7 h-7 text-brand-orange" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-wider text-brand-white">Verify <span className="text-brand-orange">ID</span></h3>
                                <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 mt-1">6-Digit Security Access</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-3 bg-neutral-900 rounded-2xl text-neutral-600 hover:text-brand-white transition-all hover:scale-110 active:scale-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-8">
                        <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-brand-acid" />
                            Security PIN
                        </label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => handlePINChange(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="••••••"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="off"
                                autoFocus
                                className="w-full px-6 py-6 bg-brand-black border-2 border-neutral-800 rounded-2xl text-center text-4xl font-black italic tracking-[0.5em] text-brand-white placeholder-neutral-800 focus:border-brand-orange focus:ring-8 focus:ring-brand-orange/10 transition-all duration-300"
                                disabled={verifying}
                            />
                        </div>

                        {/* PIN Strength Indicator */}
                        <div className="mt-6 flex gap-2">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < pin.length 
                                        ? 'bg-brand-orange shadow-[0_0_10px_rgba(255,91,0,0.5)]' 
                                        : 'bg-neutral-900'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl mb-6 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-brand-acid/5 border-2 border-brand-acid/10 rounded-3xl p-6 mb-8 relative overflow-hidden group/info">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover/info:opacity-10 transition-opacity">
                            <ShieldCheck className="w-24 h-24 text-brand-acid" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black italic uppercase tracking-widest text-brand-acid mb-2">Why this matters?</h4>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 leading-relaxed">
                                This PIN confirms account ownership and prevents unauthorized project drops on the platform.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleClose}
                            disabled={verifying}
                            className="flex-1 px-8 py-5 border-2 border-neutral-800 text-neutral-500 rounded-2xl font-black italic uppercase tracking-widest hover:border-neutral-600 hover:text-brand-white transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={pin.length !== 6 || verifying}
                            className={`flex-1 px-8 py-5 rounded-2xl font-black italic uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 ${pin.length === 6 && !verifying
                                    ? 'bg-brand-orange text-brand-black shadow-[0_0_30px_rgba(255,91,0,0.3)] hover:scale-105 active:scale-95'
                                    : 'bg-neutral-900 text-neutral-700 cursor-not-allowed'
                                }`}
                        >
                            {verifying ? (
                                <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Verify</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Security Note */}
                <div className="p-6 bg-[#0c0c0c] border-t-2 border-neutral-800/50">
                    <div className="flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-acid" />
                        <p className="text-[9px] font-black italic uppercase tracking-[0.2em] text-neutral-600">
                            End-to-End Encrypted Verification
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
