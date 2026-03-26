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
            <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="h-80 bg-gray-200 rounded-xl"></div>
                            <div className="h-80 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Supporter Dashboard</h1>
                        <p className="text-gray-600 mt-1">Track your impact and manage your contributions</p>
                    </div>
                    <button
                        onClick={() => refresh()}
                        className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
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
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Overview
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'active'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Active Projects ({activeProjects.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Donation History
                        </span>
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Two Column Layout for Updates and Suggested */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Updates from Backed Projects */}
                            <BackedProjectUpdates updates={recentUpdates} loading={statsLoading} />

                            {/* Active Projects Preview */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Heart className="w-5 h-5 text-pink-500" />
                                            <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('active')}
                                            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                </div>

                                {activeProjects.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
                                        <p className="text-gray-500">You haven't backed any active projects yet.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {activeProjects.slice(0, 3).map((project) => (
                                            <Link
                                                key={project.id}
                                                to={`/project/${project.id}`}
                                                className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <img
                                                    src={project.image}
                                                    alt={project.title}
                                                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        You pledged {formatCurrency(project.pledgeAmount)}
                                                    </p>
                                                    <div className="mt-2">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span>{getProjectProgress(project).toFixed(0)}% funded</span>
                                                            <span>{getDaysLeft(project) > 0 ? `${getDaysLeft(project)} days left` : 'Ended'}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full"
                                                                style={{ width: `${Math.min(getProjectProgress(project), 100)}%` }}
                                                            />
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
                            title="Recommended For You"
                            subtitle="Projects you might like"
                        />
                    </div>
                )}

                {activeTab === 'active' && (
                    <>
                        {activeProjects.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No active projects</h3>
                                <p className="text-gray-500 mb-6">You don't have any active pledges right now.</p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                >
                                    Explore Projects
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activeProjects.map((project) => (
                                    <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="md:w-64 h-48 md:h-auto relative">
                                                <img
                                                    src={project.image}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        ACTIVE
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <Link to={`/project/${project.id}`} className="text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors">
                                                                {project.title}
                                                            </Link>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Last backed on {project.pledgeDate?.toDate().toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500">Your Last Pledge</p>
                                                            <p className="text-lg font-bold text-gray-900">{formatCurrency(project.pledgeAmount)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                            <span>Progress</span>
                                                            <span>{getProjectProgress(project).toFixed(0)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                                                style={{ width: `${getProjectProgress(project)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {getDaysLeft(project) > 0 ? `${getDaysLeft(project)} days left` : 'Ended'}
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to={`/project/${project.id}`}
                                                        className="text-orange-600 font-medium text-sm hover:text-orange-800"
                                                    >
                                                        View Details →
                                                    </Link>
                                                </div>
                                            </div>
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
