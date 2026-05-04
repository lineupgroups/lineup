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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-black/95 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-sm bg-brand-black border border-neutral-800 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Scheduled Launch</p>
                        <button onClick={onClose} className="p-1 text-neutral-700 hover:text-brand-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-4 px-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-neutral-500 hover:text-brand-white"><ChevronLeft className="w-4 h-4" /></button>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-white">
                            {monthNames[month]} {year}
                        </p>
                        <button onClick={() => changeMonth(1)} className="p-2 text-neutral-500 hover:text-brand-white"><ChevronRight className="w-4 h-4" /></button>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-[9px] font-bold uppercase text-neutral-700 text-center">
                        {weekDays.map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-6">
                        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: days }).map((_, i) => {
                            const d = i + 1;
                            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                            return (
                                <button
                                    key={d}
                                    onClick={() => handleDateClick(d)}
                                    className={`aspect-square rounded-lg text-[10px] font-bold transition-all ${
                                        isSelected 
                                        ? 'bg-brand-acid text-brand-black' 
                                        : 'hover:bg-white/5 text-neutral-500'
                                    }`}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 ml-1">Hour</label>
                            <select 
                                value={selectedDate.getHours()} 
                                onChange={(e) => handleTimeChange('h', parseInt(e.target.value))}
                                className="w-full bg-white/[0.03] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold text-brand-white focus:border-brand-acid/40 outline-none appearance-none"
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i} className="bg-brand-black">{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 ml-1">Min</label>
                            <select 
                                value={selectedDate.getMinutes()} 
                                onChange={(e) => handleTimeChange('m', parseInt(e.target.value))}
                                className="w-full bg-white/[0.03] border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-bold text-brand-white focus:border-brand-acid/40 outline-none appearance-none"
                            >
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <option key={i} value={i} className="bg-brand-black">{i.toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            onSelect(selectedDate);
                            onClose();
                        }}
                        className="w-full py-3.5 bg-brand-white text-brand-black rounded-xl text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                        Confirm Time
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
        <div className="space-y-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-acid/60 mb-3">Step 03</p>
                <h2 className="text-4xl font-black italic uppercase tracking-tight text-brand-white">
                    Review & <span className="text-brand-orange">Launch</span>
                </h2>
            </div>

            {/* Project Summary Grid */}
            <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Final Summary</label>
                <div className="bg-white/[0.02] border border-neutral-800 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Project Title</p>
                            <p className="text-sm font-bold text-brand-white truncate">{projectData.basics?.title || 'Untitled'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Funding Goal</p>
                            <p className="text-sm font-bold text-brand-acid">₹{projectData.basics?.fundingGoal?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Category</p>
                            <p className="text-sm font-bold text-brand-white uppercase">{projectData.basics?.category || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Duration</p>
                            <p className="text-sm font-bold text-brand-white uppercase">{projectData.basics?.duration || 30} Days</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowPreview(true)}
                        className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-brand-white transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Page
                    </button>
                </div>
            </div>

            {/* Payout Details */}
            {kycData && primaryPayment && (
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Payout Account</label>
                    <div className="bg-white/[0.02] border border-brand-orange/20 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-orange/60 mb-1">
                                {primaryPayment.type === 'upi' ? 'UPI ID' : 'Bank Details'}
                            </p>
                            <p className="text-base font-bold text-brand-white font-mono">
                                {primaryPayment.type === 'upi' ? primaryPayment.upiId : primaryPayment.bankDetails?.bankName}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-orange">Verified</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Launch Type */}
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Strategy</label>
                    <div className="flex gap-2">
                        {['immediate', 'scheduled'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => type === 'scheduled' ? setIsDatePickerOpen(true) : handleLaunchTypeChange('immediate')}
                                className={`flex-1 h-14 flex flex-col items-center justify-center rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${launchType === type
                                    ? 'bg-brand-acid text-brand-black'
                                    : 'bg-transparent border border-neutral-800 text-neutral-500 hover:border-neutral-600'
                                }`}
                            >
                                <span>{type === 'scheduled' ? 'Schedule' : 'Immediate'}</span>
                                {type === 'scheduled' && launchType === 'scheduled' && (
                                    <span className="text-[8px] opacity-60 mt-0.5">
                                        {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Privacy */}
                <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3">Visibility</label>
                    <div className="flex gap-2">
                        {['public', 'private'].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handlePrivacyChange(p as any)}
                                className={`flex-1 h-14 flex items-center justify-center rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${privacy === p
                                    ? 'bg-brand-orange text-brand-black'
                                    : 'bg-transparent border border-neutral-800 text-neutral-500 hover:border-neutral-600'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Review Notice */}
            <div className="border-t border-neutral-800/50 pt-8 mt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600 mb-4">Launch review</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {[
                        'Safety review takes 24-48 hours',
                        'Automatic smart-contract deployment',
                        'High-density visibility optimization drop',
                        'Instant transfer upon goal completion'
                    ].map((tip, i) => (
                        <p key={i} className="text-[11px] text-neutral-600 flex items-start gap-2">
                            <span className="text-brand-orange/40 mt-0.5">—</span>
                            {tip}
                        </p>
                    ))}
                </div>
            </div>

            {/* Final Navigation */}
            <div className="flex justify-between items-center pt-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3.5 bg-white/5 text-neutral-400 rounded-full text-[11px] font-bold uppercase tracking-wider hover:text-brand-white transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="group flex items-center gap-4 px-10 py-4 bg-brand-orange text-brand-black rounded-full text-[13px] font-black italic uppercase tracking-wider hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Launch Project</span>
                            <Rocket className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>

            <DateTimePickerModal 
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                currentDate={scheduledDate}
                onSelect={(date) => {
                    setScheduledDate(date);
                    onUpdate({ type: 'scheduled', scheduledDate: date, privacy });
                    setLaunchType('scheduled');
                }}
            />

            {/* Preview Modal */}
            <ProjectPreview
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                projectData={projectData}
            />
        </div>
    );
}
