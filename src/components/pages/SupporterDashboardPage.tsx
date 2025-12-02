import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDonations, DonationData } from '../../lib/donationService';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FirestoreProject } from '../../types/firestore';
import { getProjectProgress, getDaysLeft } from '../../lib/firestore';
import DonationHistory from '../supporter/DonationHistory';

interface BackedProjectWithDetails extends FirestoreProject {
    pledgeAmount: number;
    pledgeDate: any; // Timestamp
    pledgeStatus: string;
}

export default function SupporterDashboardPage() {
    const { user } = useAuth();
    const [activeProjects, setActiveProjects] = useState<BackedProjectWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // Get all donations
                const donations = await getUserDonations(user.uid, { limitCount: 50 });

                // Group by project to find unique active projects
                const projectMap = new Map<string, DonationData>();
                donations.forEach(d => {
                    // Keep the most recent donation for a project
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

                // Fetch project details
                const projectsData: BackedProjectWithDetails[] = [];

                await Promise.all(uniqueProjectIds.map(async (projectId) => {
                    const projectDoc = await getDoc(doc(db, 'projects', projectId));
                    if (projectDoc.exists()) {
                        const project = projectDoc.data() as FirestoreProject;
                        const donation = projectMap.get(projectId);

                        // Only add if project is active
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse"></div>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white rounded-xl h-40 animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Supporter Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your impact and manage your contributions</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Active Projects
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Donation History
                    </button>
                </div>

                {activeTab === 'active' ? (
                    <>
                        {activeProjects.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No active projects</h3>
                                <p className="text-gray-500 mb-6">You don't have any active pledges right now.</p>
                                <Link
                                    to="/discover"
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
                                                            {getDaysLeft(project)} days left
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
                ) : (
                    <DonationHistory />
                )}
            </div>
        </div>
    );
}
