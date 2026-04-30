import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDonations, DonationData } from '../../lib/donationService';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';
import DonationHistory from '../supporter/DonationHistory';
import ImpactStats from '../supporter/ImpactStats';
import BackedProjectUpdates from '../supporter/BackedProjectUpdates';
import SuggestedProjects from '../supporter/SuggestedProjects';
import { useSupporterDashboard } from '../../hooks/useSupporterDashboard';
import { useRecommendations } from '../../hooks/useRecommendations';

interface BackedProjectWithDetails extends FirestoreProject {
    pledgeAmount: number;
    pledgeDate: any;
    pledgeStatus: string;
}

export default function SupporterDashboardPage() {
    const { user } = useAuth();
    const [activeProjects, setActiveProjects] = useState<BackedProjectWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history'>('overview');

    // Use the new supporter dashboard hook
    const { stats, recentUpdates, loading: statsLoading, refresh } = useSupporterDashboard();

    // Use recommendations hook for suggested projects
    const { forYou, loading: recommendationsLoading } = useRecommendations();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const donations = await getUserDonations(user.uid, { limitCount: 50 });

                const projectMap = new Map<string, DonationData>();
                donations.forEach(d => {
                    if (!projectMap.has(d.projectId)) {
                        projectMap.set(d.projectId, d);
                    }
                });

                const uniqueProjectIds = Array.from(projectMap.keys());

                if (uniqueProjectIds.length === 0) {
                    setActiveProjects([]);
                    setIsLoading(false);
                    return;
                }

                const projectsData: BackedProjectWithDetails[] = [];

                await Promise.all(uniqueProjectIds.map(async (projectId) => {
                    const projectDoc = await getDoc(doc(db, 'projects', projectId));
                    if (projectDoc.exists()) {
                        const project = projectDoc.data() as FirestoreProject;
                        const donation = projectMap.get(projectId);

                        if (project.status === 'active') {
                            projectsData.push({
                                ...project,
                                id: projectDoc.id,
                                pledgeAmount: donation?.amount || 0,
                                pledgeDate: donation?.backedAt,
                                pledgeStatus: 'completed'
                            });
                        }
                    }
                }));

                setActiveProjects(projectsData);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const isFullyLoading = isLoading || statsLoading;

    if (isFullyLoading) {
        return (
            <div className="min-h-screen bg-brand-black text-brand-white py-8 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-neutral-800 rounded-2xl w-1/3"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-28 bg-neutral-800 rounded-2xl"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-80 bg-neutral-800 rounded-2xl"></div>
                            <div className="h-80 bg-neutral-800 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black text-brand-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-16">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-brand-acid/10 rounded-3xl border border-brand-acid/20 shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                                <Rocket className="w-8 h-8 text-brand-acid" />
                            </div>
                            <span className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-orange/20">
                                Backer Mode
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                            Supporter <span className="text-brand-acid">Hub</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-neutral-400 font-medium mt-4 max-w-2xl">
                            Track your impact and discover the next big idea.
                        </p>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-[#222] border border-neutral-800 rounded-full text-brand-acid transition-all duration-300 font-medium group"
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        Sync Data
                    </button>
                </div>

                {/* Impact Stats */}
                <ImpactStats
                    totalBacked={stats.totalBacked}
                    projectsSupported={stats.projectsSupported}
                    creatorsHelped={stats.creatorsHelped}
                    projectsReachedGoal={stats.projectsReachedGoal}
                    uniqueCategories={stats.uniqueCategories}
                    averageDonation={stats.averageDonation}
                />

                {/* Tabs */}
                <div className="flex space-x-2 bg-[#111] p-1.5 rounded-2xl w-fit mb-10 border border-neutral-800/50">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 rounded-3xl text-sm font-semibold transition-all duration-300 ${activeTab === 'overview'
                            ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                            : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-800/50'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Overview
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-3 rounded-3xl text-sm font-semibold transition-all duration-300 ${activeTab === 'active'
                            ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                            : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-800/50'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Active Projects ({activeProjects.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 rounded-3xl text-sm font-semibold transition-all duration-300 ${activeTab === 'history'
                            ? 'bg-brand-acid text-brand-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                            : 'text-neutral-400 hover:text-brand-white hover:bg-neutral-800/50'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            History
                        </span>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-10">
                        {/* Two Column Layout for Updates and Suggested */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Updates from Backed Projects */}
                            <BackedProjectUpdates updates={recentUpdates} loading={statsLoading} />

                            {/* Active Projects Preview */}
                            <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-brand-orange/10 rounded-2xl">
                                            <Heart className="w-5 h-5 text-brand-orange" />
                                        </div>
                                        <h2 className="text-xl font-bold text-brand-white tracking-tight">Active Projects</h2>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('active')}
                                        className="text-sm text-brand-orange hover:text-brand-white font-semibold transition-colors"
                                    >
                                        View All →
                                    </button>
                                </div>

                                {activeProjects.length === 0 ? (
                                    <div className="p-12 flex-1 flex flex-col items-center justify-center text-center">
                                        <Heart className="w-12 h-12 text-neutral-700 mb-4" />
                                        <h3 className="text-lg font-medium text-brand-white mb-2">No active projects</h3>
                                        <p className="text-neutral-500">You haven't backed any active projects yet.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-800/50">
                                        {activeProjects.slice(0, 3).map((project) => (
                                            <Link
                                                key={project.id}
                                                to={`/project/${project.id}`}
                                                className="group flex gap-5 p-6 hover:bg-neutral-800/30 transition-all duration-300"
                                            >
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-neutral-800 group-hover:border-brand-acid/30 transition-colors">
                                                    <img
                                                        src={project.image}
                                                        alt={project.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h3 className="font-bold text-brand-white text-base line-clamp-1 group-hover:text-brand-acid transition-colors">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-sm text-neutral-400 mt-1">
                                                        Pledged <span className="text-brand-white font-medium">{formatCurrency(project.pledgeAmount)}</span>
                                                    </p>
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-xs text-neutral-400 mb-2 font-medium">
                                                            <span className="text-brand-acid">{getProjectProgress(project).toFixed(0)}% Funded</span>
                                                            <span>{getDaysLeft(project) > 0 ? `${getDaysLeft(project)} Days Left` : 'Ended'}</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-brand-acid h-full rounded-full relative"
                                                                style={{ width: `${Math.min(getProjectProgress(project), 100)}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-[#111]/20 w-full animate-[shimmer_2s_infinite]"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Suggested Projects */}
                        <SuggestedProjects
                            projects={forYou.map(p => ({ ...p }) as FirestoreProject)}
                            loading={recommendationsLoading}
                            title="Curated For You"
                            subtitle="Discover next-gen creators building the future"
                        />
                    </div>
                )}

                {activeTab === 'active' && (
                    <>
                        {activeProjects.length === 0 ? (
                            <div className="bg-[#111] rounded-3xl border border-neutral-800 p-16 text-center">
                                <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Heart className="w-10 h-10 text-brand-orange" />
                                </div>
                                <h3 className="text-2xl font-bold text-brand-white mb-3">No active projects</h3>
                                <p className="text-neutral-400 mb-8 max-w-md mx-auto">You don't have any active pledges right now. Start exploring to back the next big idea.</p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center px-8 py-4 text-sm font-bold rounded-full text-brand-black bg-brand-acid hover:bg-[#b3e600] transition-colors shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:shadow-[0_0_30px_rgba(204,255,0,0.4)]"
                                >
                                    Explore Projects
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activeProjects.map((project) => (
                                    <div key={project.id} className="group bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden hover:border-brand-acid/50 transition-all duration-500">
                                        <div className="h-48 relative overflow-hidden">
                                            <img
                                                src={project.image}
                                                alt={project.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-acid text-brand-black shadow-lg">
                                                    ACTIVE
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <Link to={`/project/${project.id}`} className="block">
                                                <h3 className="text-2xl font-bold text-brand-white group-hover:text-brand-acid transition-colors line-clamp-1 mb-1">
                                                    {project.title}
                                                </h3>
                                            </Link>
                                            <p className="text-sm text-neutral-400 mb-6">
                                                Backed on {project.pledgeDate?.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>

                                            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 mb-6">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-neutral-400 text-sm">Your Pledge</span>
                                                    <span className="text-xl font-bold text-brand-white">{formatCurrency(project.pledgeAmount)}</span>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex justify-between text-sm font-medium mb-2">
                                                    <span className="text-brand-acid">{getProjectProgress(project).toFixed(0)}% Funded</span>
                                                    <span className="text-neutral-400">
                                                        <Clock className="w-4 h-4 inline mr-1 -mt-0.5" />
                                                        {getDaysLeft(project) > 0 ? `${getDaysLeft(project)} Days Left` : 'Ended'}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-brand-acid h-full rounded-full"
                                                        style={{ width: `${Math.min(getProjectProgress(project), 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <Link
                                                to={`/project/${project.id}`}
                                                className="block w-full py-3 text-center text-sm font-bold text-brand-black bg-brand-white rounded-3xl hover:bg-brand-acid transition-colors"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'history' && (
                    <DonationHistory />
                )}
            </div>
        </div>
    );
}
