import { useState } from 'react';
import { 
  Calendar, 
  Globe, 
  Lock, 
  CheckCircle, 
  Rocket, 
  CreditCard, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Target,
  Layers,
  X
} from 'lucide-react';
import { UserKYCData } from '../../types/kyc';
import ProjectPreview from './ProjectPreview';

interface Step3LaunchProps {
    data: {
        type: 'immediate' | 'scheduled';
        scheduledDate?: Date;
        privacy: 'public' | 'private';
    };
    onUpdate: (data: any) => void;
    onSubmit: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    projectData: any;
    kycData?: UserKYCData;
}

interface DateTimePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onSelect: (date: Date) => void;
}

function DateTimePickerModal({ isOpen, onClose, currentDate, onSelect }: DateTimePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
    const [viewDate, setViewDate] = useState(new Date(currentDate));

    if (!isOpen) return null;

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handleDateClick = (day: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year, month, day);
        setSelectedDate(newDate);
    };

    const handleTimeChange = (type: 'h' | 'm', val: number) => {
        const newDate = new Date(selectedDate);
        if (type === 'h') newDate.setHours(val);
        else newDate.setMinutes(val);
        setSelectedDate(newDate);
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(viewDate.getMonth() + offset);
        setViewDate(newDate);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-brand-black/90 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-[#0a0a0a] border-2 border-neutral-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(204,255,0,0.1)] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-wider text-brand-white">Pick <span className="text-brand-acid">Launch</span></h3>
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-500 mt-1">Schedule your drop</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-neutral-900 rounded-2xl text-neutral-500 hover:text-brand-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Nav */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:text-brand-acid transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <p className="font-black italic uppercase tracking-widest text-brand-white">
                            {monthNames[month]} {year}
                        </p>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:text-brand-acid transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2">
                        {weekDays.map(d => (
                            <div key={d} className="text-center text-[10px] font-black italic uppercase tracking-tighter text-neutral-700">{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-8">
                        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: days }).map((_, i) => {
                            const d = i + 1;
                            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                            const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
                            return (
                                <button
                                    key={d}
                                    onClick={() => handleDateClick(d)}
                                    className={`aspect-square rounded-xl text-xs font-bold transition-all ${
                                        isSelected 
                                        ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                                        : isToday 
                                        ? 'border-2 border-brand-acid text-brand-acid' 
                                        : 'hover:bg-neutral-900 text-neutral-400'
                                    }`}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600">Hour</label>
                            <select 
                                value={selectedDate.getHours()} 
                                onChange={(e) => handleTimeChange('h', parseInt(e.target.value))}
                                className="w-full bg-[#050505] border-2 border-neutral-800 rounded-xl px-4 py-3 text-brand-white font-black italic focus:border-brand-orange transition-colors"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600">Minute</label>
                            <select 
                                value={selectedDate.getMinutes()} 
                                onChange={(e) => handleTimeChange('m', parseInt(e.target.value))}
                                className="w-full bg-[#050505] border-2 border-neutral-800 rounded-xl px-4 py-3 text-brand-white font-black italic focus:border-brand-orange transition-colors"
                            >
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <button
                        onClick={() => {
                            onSelect(selectedDate);
                            onClose();
                        }}
                        className="w-full py-5 bg-brand-acid text-brand-black rounded-2xl font-black italic uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(204,255,0,0.2)]"
                    >
                        Confirm Launch Time
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Step3Launch({
    data,
    onUpdate,
    onSubmit,
    onBack,
    isSubmitting,
    projectData,
    kycData
}: Step3LaunchProps) {
    const [launchType, setLaunchType] = useState<'immediate' | 'scheduled'>(data.type || 'immediate');
    const [scheduledDate, setScheduledDate] = useState(data.scheduledDate || new Date());
    const [privacy, setPrivacy] = useState<'public' | 'private'>(data.privacy || 'public');
    const [showPreview, setShowPreview] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const handleLaunchTypeChange = (type: 'immediate' | 'scheduled') => {
        setLaunchType(type);
        onUpdate({ type, scheduledDate: type === 'scheduled' ? scheduledDate : undefined, privacy });
    };

    const handleScheduledDateChange = (date: Date) => {
        setScheduledDate(date);
        onUpdate({ type: launchType, scheduledDate: date, privacy });
    };

    const handlePrivacyChange = (newPrivacy: 'public' | 'private') => {
        setPrivacy(newPrivacy);
        onUpdate({ type: launchType, scheduledDate, privacy: newPrivacy });
    };

    const handleSubmit = () => {
        onUpdate({ type: launchType, scheduledDate, privacy });
        onSubmit();
    };

    const primaryPayment = kycData?.paymentMethods.find(pm => pm.isPrimary) || kycData?.paymentMethods[0];

    return (
        <div className="space-y-12 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter text-brand-white mb-3">
                    Review & <span className="text-brand-orange">Launch</span>
                </h2>
                <p className="text-neutral-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                    Review your project details and choose when to launch
                </p>
            </div>

            {/* Project Summary */}
            <div className="group">
                <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-acid" />
                    Project Summary
                </label>
                
                <div className="bg-[#0a0a0a] border-2 border-brand-acid/20 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(204,255,0,0.05)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                                <Target className="w-3 h-3" /> Title
                            </p>
                            <p className="text-xl font-black italic uppercase tracking-wider text-brand-white">{projectData.basics?.title || 'Untitled'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Goal
                            </p>
                            <p className="text-xl font-black italic uppercase tracking-wider text-brand-acid">₹{projectData.basics?.fundingGoal?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                                <Layers className="w-3 h-3" /> Category
                            </p>
                            <p className="text-lg font-bold text-brand-white uppercase">{projectData.basics?.category || 'Not set'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Duration
                            </p>
                            <p className="text-lg font-bold text-brand-white uppercase">{projectData.basics?.duration || 30} DAYS</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowPreview(true)}
                        className="mt-8 w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#111] border-2 border-neutral-800 rounded-2xl text-brand-white font-black italic uppercase tracking-widest hover:border-brand-acid hover:text-brand-acid transition-all duration-300 group/preview"
                    >
                        <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Preview Full Page</span>
                    </button>
                </div>
            </div>

            {/* Payment Method */}
            {kycData && primaryPayment && (
                <div className="group">
                    <label className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand-orange" />
                        Payout Account
                    </label>
                    <div className="bg-[#0a0a0a] border-2 border-brand-orange/20 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(255,91,0,0.05)]">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-orange" />
                                    <p className="text-sm font-black italic uppercase tracking-wider text-brand-white">
                                        {primaryPayment.type === 'upi' ? 'UPI ID' : 'Bank Account'}
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-brand-white font-mono tracking-tight">
                                    {primaryPayment.type === 'upi' ? primaryPayment.upiId : primaryPayment.bankDetails?.bankName}
                                </p>
                            </div>
                            <div className="bg-brand-orange/10 px-4 py-2 rounded-xl border border-brand-orange/30">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-brand-orange" />
                                    <span className="text-[10px] font-black italic uppercase tracking-widest text-brand-orange">Verified</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 mt-6">
                            ✓ FUNDS WILL BE AUTOMATICALLY TRANSFERRED TO THIS ACCOUNT UPON SUCCESSFUL COMPLETION
                        </p>
                    </div>
                </div>
            )}

            {/* Launch Type */}
            <div className="group">
                <label className="block text-sm font-black italic uppercase tracking-wider text-brand-acid mb-4 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-brand-acid" />
                    Launch Strategy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        type="button"
                        onClick={() => handleLaunchTypeChange('immediate')}
                        className={`relative p-6 border-2 rounded-2xl transition-all duration-500 overflow-hidden ${launchType === 'immediate'
                            ? 'border-brand-acid bg-brand-acid/10 shadow-[0_0_30px_rgba(204,255,0,0.1)] scale-[1.02]'
                            : 'border-neutral-800/30 bg-[#0f0f0f] hover:border-neutral-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xl font-black italic uppercase tracking-wider text-brand-white">Immediate</p>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Post-Approval</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${launchType === 'immediate' ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.4)]' : 'bg-neutral-900 text-neutral-700'}`}>
                                <Rocket className="w-6 h-6" />
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            handleLaunchTypeChange('scheduled');
                            setIsDatePickerOpen(true);
                        }}
                        className={`relative p-6 border-2 rounded-2xl transition-all duration-500 overflow-hidden ${launchType === 'scheduled'
                            ? 'border-brand-acid bg-brand-acid/10 shadow-[0_0_30px_rgba(204,255,0,0.1)] scale-[1.02]'
                            : 'border-neutral-800/30 bg-[#0f0f0f] hover:border-neutral-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xl font-black italic uppercase tracking-wider text-brand-white">Scheduled</p>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Future Date</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${launchType === 'scheduled' ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.4)]' : 'bg-neutral-900 text-neutral-700'}`}>
                                <Calendar className="w-6 h-6" />
                            </div>
                        </div>
                    </button>
                </div>

                {launchType === 'scheduled' && (
                    <div className="mt-8">
                        <button 
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full flex items-center justify-between px-8 py-5 bg-[#0a0a0a] border-2 border-brand-orange/20 rounded-2xl group/btn hover:border-brand-orange transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center group-hover/btn:bg-brand-orange/20 transition-colors">
                                    <Clock className="w-6 h-6 text-brand-orange" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black italic uppercase tracking-widest text-neutral-600">Selected Drop Time</p>
                                    <p className="text-xl font-black italic uppercase tracking-wider text-brand-white">
                                        {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <span className="text-brand-acid not-italic">@</span> {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-brand-orange font-black italic uppercase tracking-widest text-[10px]">Edit Schedule</div>
                        </button>
                    </div>
                )}
            </div>

            <DateTimePickerModal 
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                currentDate={scheduledDate}
                onSelect={(date) => {
                    setScheduledDate(date);
                    onUpdate({ type: 'scheduled', scheduledDate: date, privacy });
                }}
            />

            {/* Privacy */}
            <div className="group">
                <label className="block text-sm font-black italic uppercase tracking-wider text-brand-orange mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-orange" />
                    Project Visibility
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        type="button"
                        onClick={() => handlePrivacyChange('public')}
                        className={`relative p-6 border-2 rounded-2xl transition-all duration-500 overflow-hidden ${privacy === 'public'
                            ? 'border-brand-orange bg-brand-orange/10 shadow-[0_0_30px_rgba(255,91,0,0.1)] scale-[1.02]'
                            : 'border-neutral-800/30 bg-[#0f0f0f] hover:border-neutral-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xl font-black italic uppercase tracking-wider text-brand-white">Public</p>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Discoverable by all</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${privacy === 'public' ? 'bg-brand-orange text-brand-black shadow-[0_0_15px_rgba(255,91,0,0.4)]' : 'bg-neutral-900 text-neutral-700'}`}>
                                <Globe className="w-6 h-6" />
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handlePrivacyChange('private')}
                        className={`relative p-6 border-2 rounded-2xl transition-all duration-500 overflow-hidden ${privacy === 'private'
                            ? 'border-brand-orange bg-brand-orange/10 shadow-[0_0_30px_rgba(255,91,0,0.1)] scale-[1.02]'
                            : 'border-neutral-800/30 bg-[#0f0f0f] hover:border-neutral-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xl font-black italic uppercase tracking-wider text-brand-white">Private</p>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Via direct link only</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${privacy === 'private' ? 'bg-brand-orange text-brand-black shadow-[0_0_15px_rgba(255,91,0,0.4)]' : 'bg-neutral-900 text-neutral-700'}`}>
                                <Lock className="w-6 h-6" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Admin Review Notice */}
            <div className="bg-[#111] border-2 border-neutral-800 rounded-[2rem] p-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-acid/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-brand-acid" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-wider text-brand-white">Launch Review</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                            <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                                Projects are reviewed by our safety team within 24-48 hours
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                            <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                                Ensure your content adheres to our community guidelines
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                            <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                                Secure smart-contract deployment upon validation
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                            <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                                High-density visibility optimization active for your drop
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 shrink-0" />
                            <p className="text-xs font-black italic uppercase tracking-wider text-neutral-400">
                                Notification will be sent once your project is live
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-12 border-t-2 border-neutral-800">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-4 px-10 py-5 bg-[#111] border-2 border-neutral-800 text-brand-white rounded-[1.5rem] font-black italic uppercase tracking-widest hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300"
                >
                    <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Story</span>
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="group flex items-center gap-6 px-16 py-6 bg-brand-orange text-brand-black rounded-[1.5rem] font-black italic uppercase tracking-widest hover:bg-[#ff752d] hover:scale-105 hover:shadow-[0_0_40px_rgba(255,91,0,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        <>
                            <span className="text-xl">Launch Project</span>
                            <Rocket className="w-7 h-7 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>

            {/* Security Note */}
            <div className="text-center">
                <p className="text-xs text-neutral-500">
                    🔒 You'll be asked to verify your identity with your security PIN before submission
                </p>
            </div>

            {/* Project Preview Modal */}
            <ProjectPreview
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                projectData={projectData}
            />
        </div>
    );
}
