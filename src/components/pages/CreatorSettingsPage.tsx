import { useState, useMemo, useRef, useEffect } from 'react';
import {
    Settings as SettingsIcon, Bell, Shield, Lock, Calendar, AlertTriangle,
    Check, X, Mail, MessageCircle, Clock, Loader2, Zap, ShieldCheck, 
    Smartphone, Monitor, Globe, Fingerprint, Command, Cpu, Hash, ArrowRight,
    ChevronRight, CreditCard, User, History, Terminal, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectContext } from '../../hooks/useProjectContext';
import { useKYC } from '../../hooks/useKYC';
import PageTitle from '../common/PageTitle';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { extendProjectDeadline, cancelProject } from '../../lib/projectManagement';
import { maskAadhaarNumber, maskPANCard } from '../../types/kyc';

// Tactical Tab Configuration
const TABS = [
    { id: 'project', label: 'PROJECT OPS', icon: Command, description: 'MANAGEMENT PROTOCOLS' },
    { id: 'kyc', label: 'IDENTITY', icon: ShieldCheck, description: 'SECURITY CLEARANCE' },
    { id: 'notifications', label: 'TELEMETRY', icon: Bell, description: 'SIGNAL CHANNELS' },
    { id: 'security', label: 'FIREWALL', icon: Lock, description: 'DEFENSE CONFIG' },
] as const;

export default function CreatorSettingsPage() {
    const { user } = useAuth();
    const { projects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');
    const { selectedProject } = useProjectContext();
    const { kycData, loading: kycLoading } = useKYC();

    const [activeTab, setActiveTab] = useState<'project' | 'notifications' | 'security' | 'kyc'>('project');

    // Notification state
    const [notifications, setNotifications] = useState({
        email: { newDonation: true, milestoneReached: true, weeklyAnalytics: true, payoutProcessed: true, marketing: false },
        whatsapp: { largePayouts: true, projectEnding: true, dailySummary: false }
    });

    const [extensionDays, setExtensionDays] = useState(7);
    const [extensionReason, setExtensionReason] = useState('');
    const [showExtensionForm, setShowExtensionForm] = useState(false);
    const [isExtending, setIsExtending] = useState(false);

    const managedProject = useMemo(() => {
        if (selectedProject) return selectedProject;
        return projects.length > 0 ? projects[0] : null;
    }, [selectedProject, projects]);

    const projectInfo = useMemo(() => {
        if (!managedProject) return null;
        const goalAmount = managedProject.goal || managedProject.goalAmount || 0;
        const currentAmount = managedProject.raised || managedProject.currentAmount || 0;
        const progress = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;
        const endDate = managedProject.endDate ? new Date(managedProject.endDate.seconds ? managedProject.endDate.seconds * 1000 : managedProject.endDate) : null;
        const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : managedProject.daysLeft || 0;

        return {
            id: managedProject.id,
            title: managedProject.title,
            status: managedProject.status || 'active',
            currentAmount,
            goalAmount,
            progress: Math.min(progress, 100),
            daysLeft,
        };
    }, [managedProject]);

    const handleNotificationChange = (category: 'email' | 'whatsapp', key: string) => {
        setNotifications(prev => ({
            ...prev,
            [category]: { ...prev[category as keyof typeof prev], [key]: !prev[category as keyof typeof prev][key as keyof typeof prev.email] }
        }));
        toast.success(`Protocol Updated: ${key.toUpperCase()}`);
    };

    const handleExtendDeadline = async () => {
        if (extensionDays < 1 || extensionDays > 30 || !extensionReason.trim() || !managedProject || !user) return;
        setIsExtending(true);
        try {
            const result = await extendProjectDeadline({ projectId: managedProject.id, extensionDays, reason: extensionReason, requestedBy: user.uid });
            if (result.success) { toast.success(result.message); setShowExtensionForm(false); setExtensionReason(''); }
            else toast.error(result.message);
        } catch (error) { toast.error('Failed to extend deadline'); }
        finally { setIsExtending(false); }
    };

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    if (projectsLoading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-brand-white font-sans py-12 px-4 sm:px-6 lg:px-10">
            <PageTitle title="Control Center" description="Mission-critical system configurations" />

            {/* Cinematic Header - Matched to Analytics Hub */}
            <div className="max-w-[1920px] mx-auto mb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-brand-acid/10 rounded-3xl border border-brand-acid/20 shadow-[0_0_20px_rgba(204,255,0,0.1)] transition-transform hover:scale-105 duration-500">
                                <SettingsIcon className="w-8 h-8 text-brand-acid" />
                            </div>
                            <span className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-orange/20">
                                SYSTEM ARCHITECTURE
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                            Control <span className="text-brand-acid">Center</span>
                        </h1>
                        <p className="text-lg text-neutral-500 font-medium mt-4 max-w-xl leading-relaxed italic uppercase tracking-tight">
                            Configure your creative engine and manage the underlying infrastructure of your digital outreach.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-xl">
                        <div className="w-12 h-12 bg-brand-acid/10 rounded-2xl flex items-center justify-center border border-brand-acid/20">
                            <Cpu className="w-6 h-6 text-brand-acid" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">SYSTEM STATUS</div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-acid shadow-[0_0_8px_rgba(204,255,0,0.5)] animate-pulse" />
                                <span className="text-xs font-black italic text-brand-white uppercase">OPTIMAL FLOW</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto flex flex-col xl:flex-row gap-12">
                {/* Tactical Navigation Sidebar - Vertical Command Stack */}
                <aside className="xl:w-80 flex-shrink-0">
                    <div className="sticky top-12 space-y-3">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full group relative overflow-hidden transition-all duration-500 rounded-[2rem] text-left ${
                                        isActive 
                                        ? 'bg-brand-acid border-brand-acid shadow-[0_20px_40px_rgba(204,255,0,0.15)]' 
                                        : 'bg-white/[0.02] border border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="p-6 flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-500 ${isActive ? 'bg-brand-black text-brand-acid' : 'bg-brand-black border border-white/5 text-neutral-500 group-hover:text-brand-acid'}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className={`text-[11px] font-black italic uppercase tracking-widest ${isActive ? 'text-brand-black' : 'text-brand-white'}`}>{tab.label}</div>
                                                <div className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${isActive ? 'text-brand-black/50' : 'text-neutral-500'}`}>{tab.description}</div>
                                            </div>
                                        </div>
                                        {isActive ? (
                                            <div className="w-2 h-2 rounded-full bg-brand-black animate-pulse" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-neutral-800 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </div>
                                    {/* Subtle Gradient for Inactive State */}
                                    {!isActive && <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            );
                        })}

                        {/* Operational Log Shortcut */}
                        <div className="mt-12 p-8 bg-brand-orange/5 border border-brand-orange/10 rounded-[2.5rem] relative overflow-hidden">
                            <Terminal className="w-6 h-6 text-brand-orange mb-4" />
                            <h4 className="text-[10px] font-black italic uppercase tracking-widest text-brand-orange mb-2">SYSTEM LOGS</h4>
                            <p className="text-[9px] font-medium text-neutral-500 leading-relaxed italic uppercase">Audit trail of all security changes and operational overrides.</p>
                            <button className="mt-4 flex items-center gap-2 text-[9px] font-black text-brand-white italic uppercase tracking-widest hover:gap-3 transition-all">
                                VIEW LOGS <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Command Content Stream */}
                <main className="flex-1 min-w-0">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {activeTab === 'project' && (
                            <div className="space-y-8">
                                {/* Project Management Engine */}
                                <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 relative overflow-hidden transition-all duration-300 hover:border-brand-acid/30 group">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-acid/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-12">
                                            <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20">
                                                <Cpu className="w-5 h-5 text-brand-acid" />
                                            </div>
                                            <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">OPERATIONAL ENGINE</span>
                                        </div>

                                        {projectInfo ? (
                                            <div className="space-y-12">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                    <div>
                                                        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2 block">PROJECT ID: {projectInfo.id.slice(0, 8)}...</span>
                                                        <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-brand-white leading-none">{projectInfo.title}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-6 py-3 bg-brand-acid/10 border border-brand-acid/20 rounded-2xl">
                                                        <div className="w-2 h-2 rounded-full bg-brand-acid shadow-[0_0_8px_rgba(204,255,0,0.5)] animate-pulse" />
                                                        <span className="text-[10px] font-black italic uppercase tracking-widest text-brand-acid">{projectInfo.status}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    {[
                                                        { label: 'FUNDING VELOCITY', value: formatCurrency(projectInfo.currentAmount), sub: `GOAL: ${formatCurrency(projectInfo.goalAmount)}`, icon: Zap, color: 'text-brand-acid' },
                                                        { label: 'TEMPORAL STATUS', value: `${projectInfo.daysLeft} DAYS`, sub: 'REMAINING WINDOW', icon: Clock, color: 'text-brand-orange' },
                                                        { label: 'CONVERSION PROGRESS', value: `${projectInfo.progress.toFixed(1)}%`, sub: 'OF REVENUE TARGET', icon: Target, color: 'text-brand-acid' }
                                                    ].map((stat, i) => (
                                                        <div key={i} className="p-8 bg-brand-black border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group/stat cursor-pointer">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                                                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{stat.label}</span>
                                                            </div>
                                                            <div className="text-3xl font-black italic text-brand-white mb-2">{stat.value}</div>
                                                            <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{stat.sub}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="relative h-4 bg-brand-black rounded-full overflow-hidden border border-white/5 p-1">
                                                    <div className="h-full bg-gradient-to-r from-brand-acid/40 to-brand-acid rounded-full transition-all duration-1000 relative shadow-[0_0_20px_rgba(204,255,0,0.2)]" style={{ width: `${projectInfo.progress}%` }}>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                                    <button 
                                                        onClick={() => setShowExtensionForm(!showExtensionForm)} 
                                                        className="px-10 py-5 bg-brand-acid text-brand-black text-[11px] font-black italic uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(204,255,0,0.1)] flex items-center gap-3"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        EXTEND PROTOCOL
                                                    </button>
                                                    <button className="px-10 py-5 bg-white/5 border border-white/10 text-neutral-400 text-[11px] font-black italic uppercase tracking-widest rounded-2xl hover:bg-brand-orange hover:text-brand-white hover:border-brand-orange transition-all flex items-center gap-3 group/term">
                                                        <AlertTriangle className="w-4 h-4 group-hover/term:animate-bounce" />
                                                        TERMINATE CORE
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center">
                                                <Cpu className="w-20 h-20 text-neutral-800 mx-auto mb-8 animate-pulse" />
                                                <p className="text-xl font-black italic uppercase tracking-widest text-neutral-700">NO ENGINE DETECTED</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Extension Form Redesign */}
                                {showExtensionForm && (
                                    <div className="bg-[#111] border border-brand-acid/30 rounded-[3rem] p-10 animate-in zoom-in-95 duration-500 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-3 mb-10">
                                            <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20">
                                                <History className="w-5 h-5 text-brand-acid" />
                                            </div>
                                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-brand-acid">Extend Operational Window</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                            <div className="space-y-6">
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">EXTENSION WINDOW (1-30 DAYS)</label>
                                                <div className="flex items-end gap-4 border-b border-white/10 pb-4 group focus-within:border-brand-acid transition-all">
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        max={30} 
                                                        value={extensionDays} 
                                                        onChange={(e) => setExtensionDays(Number(e.target.value))} 
                                                        className="w-full bg-transparent text-6xl font-black text-brand-white focus:outline-none tracking-tighter" 
                                                    />
                                                    <span className="text-xl font-black italic text-neutral-700 mb-2 uppercase">DAYS</span>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">PROTOCOL OVERRIDE REASON</label>
                                                <textarea 
                                                    value={extensionReason} 
                                                    onChange={(e) => setExtensionReason(e.target.value)} 
                                                    placeholder="STATE YOUR INTEL..." 
                                                    className="w-full bg-transparent border border-white/5 p-6 rounded-2xl text-lg font-medium text-neutral-300 focus:outline-none focus:border-brand-acid transition-all resize-none h-32 bg-brand-black/50" 
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <button 
                                                onClick={handleExtendDeadline} 
                                                disabled={isExtending} 
                                                className="flex-1 py-6 bg-brand-acid text-brand-black text-[12px] font-black italic uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                            >
                                                {isExtending ? <LoadingSpinner size="sm" /> : <Zap className="w-5 h-5" />}
                                                EXECUTE OVERRIDE
                                            </button>
                                            <button onClick={() => setShowExtensionForm(false)} className="px-10 py-6 bg-white/5 border border-white/5 text-neutral-500 text-[12px] font-black italic uppercase tracking-widest rounded-2xl hover:text-brand-white transition-all">
                                                ABORT
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'kyc' && (
                            <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 transition-all duration-300 hover:border-brand-acid/30 group">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20">
                                            <ShieldCheck className="w-5 h-5 text-brand-acid fill-current" />
                                        </div>
                                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">TRUST PROTOCOL</span>
                                    </div>
                                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-widest border ${kycData?.status === 'approved' ? 'bg-brand-acid/10 border-brand-acid/20 text-brand-acid' : 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange'}`}>
                                        {kycData?.status?.replace('_', ' ') || 'UNVERIFIED'}
                                    </div>
                                </div>

                                {kycLoading ? <div className="py-24 text-center"><LoadingSpinner /></div> : (
                                    <div className="space-y-8">
                                        {/* Status Banner */}
                                        <div className="p-10 bg-brand-black border border-white/5 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                                            <div className={`w-24 h-24 flex items-center justify-center rounded-3xl ${kycData?.status === 'approved' ? 'bg-brand-acid/10 text-brand-acid' : 'bg-brand-orange/10 text-brand-orange'}`}>
                                                {kycData?.status === 'approved' ? <Shield className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white mb-2">
                                                    {kycData?.status === 'approved' ? 'IDENTITY VERIFIED' : 'ACTION REQUIRED'}
                                                </h4>
                                                <p className="text-neutral-500 text-[11px] font-black uppercase tracking-widest">CLEARANCE LEVEL: ALPHA OPERATIONAL</p>
                                            </div>
                                            <button className="px-10 py-5 bg-white/5 border border-white/10 text-[11px] font-black italic uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
                                                VIEW CREDENTIALS
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {[
                                                { label: 'AADHAAR IDENTITY', value: kycData?.selfKYC?.aadhaarNumber ? maskAadhaarNumber(kycData.selfKYC.aadhaarNumber) : 'NOT LINKED', icon: Fingerprint, sub: 'GOVERNMENT ISSUED' },
                                                { label: 'PAN REGISTRATION', value: kycData?.selfKYC?.panCard ? maskPANCard(kycData.selfKYC.panCard) : 'NOT LINKED', icon: Hash, sub: 'TAX REGISTRY ID' }
                                            ].map((item, i) => (
                                                <div key={i} className="p-10 bg-brand-black border border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all group/item cursor-pointer">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <item.icon className="w-5 h-5 text-neutral-500 group-hover/item:text-brand-acid transition-colors" />
                                                        <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{item.label}</span>
                                                    </div>
                                                    <div className="text-2xl font-mono font-black tracking-[0.2em] text-brand-white mb-2">{item.value}</div>
                                                    <div className="text-[9px] font-black text-neutral-700 uppercase tracking-widest italic">{item.sub}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 transition-all duration-300 hover:border-brand-acid/30 group">
                                <div className="flex items-center gap-3 mb-12">
                                    <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20">
                                        <Globe className="w-5 h-5 text-brand-acid fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">DATA TELEMETRY</span>
                                </div>

                                <div className="space-y-16">
                                    {/* Email Channels */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                                                <Mail className="w-4 h-4 text-neutral-300" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black italic uppercase tracking-widest text-brand-white leading-none mb-1">EMAIL DISPATCH PROTOCOLS</h4>
                                                <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">PRIMARY COMMS GATEWAY</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(notifications.email).map(([key, value]) => (
                                                <button 
                                                    key={key} 
                                                    onClick={() => handleNotificationChange('email', key)}
                                                    className={`group/item relative flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-500 overflow-hidden ${
                                                        value 
                                                        ? 'bg-brand-acid text-brand-black border-brand-acid' 
                                                        : 'bg-brand-black border-white/5 text-neutral-500 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="text-[11px] font-black italic uppercase tracking-widest relative z-10">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl relative z-10 transition-all duration-500 ${value ? 'bg-brand-black text-brand-acid' : 'bg-white/5 text-neutral-800'}`}>
                                                        {value ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                    </div>
                                                    {/* Reverse Fill Hover Effect for Inactive */}
                                                    {!value && <div className="absolute inset-0 bg-brand-acid opacity-0 group-hover/item:opacity-10 transition-opacity" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* WhatsApp Channels */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20">
                                                <MessageCircle className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black italic uppercase tracking-widest text-brand-white leading-none mb-1">WHATSAPP REAL-TIME SIGNALS</h4>
                                                <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">HIGH-FREQUENCY ALERTS</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(notifications.whatsapp).map(([key, value]) => (
                                                <button 
                                                    key={key} 
                                                    onClick={() => handleNotificationChange('whatsapp', key)}
                                                    className={`group/item relative flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-500 overflow-hidden ${
                                                        value 
                                                        ? 'bg-green-500 text-brand-white border-green-500' 
                                                        : 'bg-brand-black border-white/5 text-neutral-500 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="text-[11px] font-black italic uppercase tracking-widest relative z-10">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl relative z-10 transition-all duration-500 ${value ? 'bg-brand-black text-green-500' : 'bg-white/5 text-neutral-800'}`}>
                                                        {value ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                    </div>
                                                    {!value && <div className="absolute inset-0 bg-green-500 opacity-0 group-hover/item:opacity-10 transition-opacity" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                {/* Firewall Config Redesign */}
                                <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 transition-all duration-300 hover:border-brand-acid/30 group">
                                    <div className="flex items-center gap-3 mb-12">
                                        <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20">
                                            <Lock className="w-5 h-5 text-brand-acid fill-current" />
                                        </div>
                                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">FIREWALL CONFIG</span>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="group/item relative flex items-center justify-between p-8 bg-brand-black border border-white/5 rounded-[2.5rem] hover:border-brand-acid/30 transition-all overflow-hidden cursor-pointer">
                                            <div className="flex items-center gap-8 z-10">
                                                <div className="w-20 h-20 bg-brand-acid/10 border border-brand-acid/20 rounded-3xl flex items-center justify-center text-brand-acid group-hover/item:bg-brand-acid group-hover/item:text-brand-black transition-all duration-500">
                                                    <Smartphone className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white leading-none mb-2">6-DIGIT AUTH PIN</h4>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-acid shadow-[0_0_8px_rgba(204,255,0,0.5)] animate-pulse" />
                                                        <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">ACTIVE SECURITY LAYER</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="relative z-10 px-10 py-5 bg-white/5 border border-white/10 text-[11px] font-black italic uppercase tracking-widest rounded-2xl hover:bg-brand-acid hover:text-brand-black transition-all">
                                                ROTATE PIN
                                            </button>
                                            <div className="absolute inset-0 bg-brand-acid opacity-0 group-hover/item:opacity-5 transition-opacity" />
                                        </div>

                                        <div className="p-10 bg-brand-black border border-white/5 rounded-[3rem]">
                                            <div className="flex items-center justify-between mb-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                                                        <Activity className="w-4 h-4 text-neutral-300" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[11px] font-black italic uppercase tracking-widest text-brand-white leading-none mb-1">SESSION TELEMETRY</h4>
                                                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">ACTIVE ACCESS POINTS</p>
                                                    </div>
                                                </div>
                                                <button className="text-[10px] font-black italic uppercase tracking-widest text-brand-orange hover:brightness-125 transition-all">TERMINATE ALL</button>
                                            </div>
                                            <div className="space-y-4">
                                                {[
                                                    { device: 'CHROME ON WINDOWS', location: 'MUMBAI, INDIA (IN)', status: 'PRIMARY', icon: Monitor },
                                                    { device: 'SAFARI ON IPHONE 15', location: 'BANGALORE, INDIA (IN)', status: 'VERIFIED', icon: Smartphone },
                                                ].map((session, i) => (
                                                    <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-white/20 transition-all cursor-pointer">
                                                        <div className="flex items-center gap-6">
                                                            <div className="p-4 bg-brand-black border border-white/5 rounded-2xl text-neutral-500">
                                                                <session.icon className="w-5 h-5" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h5 className="text-sm font-black italic uppercase tracking-widest text-brand-white leading-none">{session.device}</h5>
                                                                <p className="text-[9px] font-bold text-neutral-600 tracking-[0.2em]">{session.location}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black italic uppercase text-brand-acid tracking-widest">{session.status}</span>
                                                            <button className="p-2 hover:text-brand-orange transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function Target({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
