import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Import components
import LandingPage from '../components/LandingPage';
import SmartHomepage from '../components/SmartHomepage';
import TrendingPage from '../components/pages/TrendingPage';
import SearchResultsPage from '../components/pages/SearchResultsPage';
import ProjectDetailPage from '../components/ProjectDetailPage';
import SupportFlowPage from '../components/SupportFlowPage';
import SupporterDashboardPage from '../components/pages/SupporterDashboardPage';
import CreatorDashboardPage from '../components/CreatorDashboardPage';
import CreatorAnalyticsPage from '../components/pages/CreatorAnalyticsPage';
import CreatorEarningsPage from '../components/pages/CreatorEarningsPage';
import CreatorUpdatesPage from '../components/pages/CreatorUpdatesPage';
import CreatorCommentsPage from '../components/pages/CreatorCommentsPage';
import CreatorBackersPage from '../components/pages/CreatorBackersPage';
import CreatorSettingsPage from '../components/pages/CreatorSettingsPage';
import NotificationsPage from '../components/pages/NotificationsPage';
import ProjectEditPage from '../components/pages/ProjectEditPage';
import ProjectCreationWizard from '../components/projectCreation/ProjectCreationWizard';
import LineupSocials from '../components/LineupSocials';
import EnhancedUserProfile from '../components/EnhancedUserProfile';
import MyProfilePage from '../components/MyProfilePage';
import ProtectedRoute, { CreatorProtectedRoute } from '../components/auth/ProtectedRoute';
import NotFound from '../components/NotFound';
import EnhancedAdminDashboard from '../components/admin/EnhancedAdminDashboard';

// Import KYC components
import KYCSubmissionPage from '../components/kyc/KYCSubmissionPage';
import KYCStatusPage from '../components/kyc/KYCStatusPage';

// Import layout components
import Layout from '../components/Layout';

export default function AppRouter() {
    return (
        <HelmetProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout />}>
                    {/* Smart Homepage - Main discover page with personalization */}
                    <Route index element={<SmartHomepage />} />

                    {/* Discover Projects - Redirect to main homepage */}
                    <Route path="discover" element={<Navigate to="/" replace />} />

                    {/* Browse Projects - Redirect to homepage */}
                    <Route path="browse" element={<Navigate to="/" replace />} />

                    {/* Trending Projects */}
                    <Route path="trending" element={<TrendingPage />} />

                    {/* Search Results */}
                    <Route path="search" element={<SearchResultsPage />} />

                    {/* Marketing Landing Page */}
                    <Route path="welcome" element={<LandingPage />} />

                    {/* Project Detail */}
                    <Route path="project/:projectId" element={<ProjectDetailPage />} />

                    {/* Support Flow */}
                    <Route path="support/:projectId" element={<SupportFlowPage />} />

                    {/* User Profiles */}
                    <Route path="profile" element={<MyProfilePage />} />
                    <Route path="profile/:userId" element={<EnhancedUserProfile />} />
                    <Route path="profile/@:username" element={<EnhancedUserProfile />} />

                    {/* Other Pages */}
                    <Route path="socials" element={<LineupSocials />} />
                    <Route path="about" element={<div>About Page Coming Soon</div>} />

                    {/* KYC Routes - Protected */}
                    <Route path="kyc/submit" element={
                        <ProtectedRoute>
                            <KYCSubmissionPage />
                        </ProtectedRoute>
                    } />
                    <Route path="kyc/status" element={
                        <ProtectedRoute>
                            <KYCStatusPage />
                        </ProtectedRoute>
                    } />
                </Route>

                {/* Protected Routes - Creator Dashboard (Requires KYC) */}
                <Route path="/dashboard" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorDashboardPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                {/* Protected Routes - Supporter Dashboard (My Pledges) */}
                <Route path="/dashboard/supporter" element={
                    <ProtectedRoute>
                        <Layout>
                            <SupporterDashboardPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                {/* All Notifications Page - Accessible by any authenticated user */}
                <Route path="/notifications" element={
                    <ProtectedRoute>
                        <Layout>
                            <NotificationsPage />
                        </Layout>
                    </ProtectedRoute>
                } />

                {/* Redirect old /dashboard/projects to /dashboard/settings */}
                <Route path="/dashboard/projects" element={
                    <Navigate to="/dashboard/settings" replace />
                } />

                <Route path="/dashboard/analytics" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorAnalyticsPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/earnings" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorEarningsPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/settings" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorSettingsPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/updates" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorUpdatesPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/supporters" element={
                    <Navigate to="/dashboard/backers" replace />
                } />

                <Route path="/dashboard/donations" element={
                    <Navigate to="/dashboard/backers" replace />
                } />

                <Route path="/dashboard/backers" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorBackersPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/comments" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <CreatorCommentsPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/projects/create" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <ProjectCreationWizard />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/projects/:projectId/edit" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <ProjectEditPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                <Route path="/dashboard/notifications" element={
                    <CreatorProtectedRoute>
                        <Layout>
                            <NotificationsPage />
                        </Layout>
                    </CreatorProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <EnhancedAdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Legacy redirects for old hash-based URLs */}
                <Route path="/legacy" element={<Navigate to="/" replace />} />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </HelmetProvider>
    );
}
